import { diseases, Disease } from "@/data/diseases";

export interface OfflineHistoryEntry {
  title: string;
  crop: string | null;
  diagnosis: string | null;
  severity: string | null;
  date: string;
}

// Words that appear in almost every question or every disease description.
// They add noise, not signal, so they are ignored when scoring.
const STOP_WORDS = new Set([
  "the", "and", "for", "are", "with", "from", "this", "that", "have", "has",
  "was", "were", "will", "what", "why", "how", "when", "not", "but", "its",
  "can", "could", "should", "would", "there", "their", "them", "they", "then",
  "than", "also", "been", "being", "about", "into", "over", "under", "after",
  "before", "between", "through", "during", "some", "any", "all", "very",
  "just", "like", "more", "most", "many", "much", "each", "other", "such",
  // generic farming words that match nearly every entry
  "plant", "plants", "leaf", "leaves", "crop", "crops", "field", "soil",
  "water", "growth", "growing", "days", "weeks", "getting", "turning",
  "showing", "appearing", "spread", "spreading", "affected", "seen",
  "problem", "disease", "damage", "tell", "help", "please",
]);

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z\u0900-\u097F\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

/**
 * Score a disease against question tokens.
 * Symptom matches weigh heaviest — a farmer describes what they SEE,
 * so symptom text is the strongest signal. Name/crop matches are strong
 * intent signals. Cause/prevention matches are weak and capped.
 */
const scoreDisease = (tokens: string[], d: Disease): number => {
  const symptomText = d.symptoms.toLowerCase();
  const causeText = `${d.cause} ${d.prevention}`.toLowerCase();
  const nameText = d.name.toLowerCase();
  const hindiText = d.hindiName;
  const cropTexts = d.crops.map((c) => c.toLowerCase());

  let score = 0;
  let causeHits = 0;

  for (const t of tokens) {
    if (nameText.includes(t)) score += 6;
    if (hindiText.includes(t)) score += 6;
    if (cropTexts.some((c) => c.includes(t) || t.includes(c))) score += 4;
    if (symptomText.includes(t)) score += 5;
    if (causeText.includes(t)) causeHits += 1;
  }

  // Cause/prevention matches capped: they contain generic words like
  // "fungus", "nitrogen", "soil" that otherwise muddy the ranking.
  score += Math.min(causeHits, 2);

  // Require at least one symptom or name/crop hit for a confident score:
  // a disease that only matches generic cause words should not win.
  return score;
};

export interface ScoredMatch {
  disease: Disease;
  score: number;
  confident: boolean;
}

/** Best-effort matches from the on-device disease library, with confidence. */
export const matchDiseasesScored = (queryText: string, max = 2): ScoredMatch[] => {
  const tokens = tokenize(queryText);
  if (tokens.length === 0) return [];
  return diseases
    .map((d) => ({ disease: d, score: scoreDisease(tokens, d) }))
    .filter((x) => x.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => ({ ...x, confident: x.score >= 10 }));
};

/** Best-effort matches from the on-device disease library. */
export const matchDiseases = (queryText: string, max = 2): Disease[] =>
  matchDiseasesScored(queryText, max).map((m) => m.disease);

/**
 * Builds a provisional, clearly-labelled answer using only local data,
 * for use when the device has no internet.
 */
export const buildOfflineAnswer = (
  queryText: string,
  history: OfflineHistoryEntry[] = [],
): string => {
  const matches = matchDiseasesScored(queryText);
  const lines: string[] = [];

  lines.push("**📴 Offline guidance (provisional)**");
  lines.push(
    "No connection right now. This is matched from the on-device disease library — the full answer will arrive automatically when you are back online.",
  );
  lines.push("");

  const confident = matches.filter((m) => m.confident);

  if (confident.length === 0) {
    if (matches.length > 0) {
      lines.push(
        `Low-confidence match — possibly **${matches[0].disease.emoji} ${matches[0].disease.name}** (${matches[0].disease.hindiName}), but I am not sure from the description alone.`,
      );
      lines.push(`- Check symptoms: ${matches[0].disease.symptoms}`);
      lines.push(`- If it matches: ${matches[0].disease.treatment}`);
      lines.push("");
    } else {
      lines.push(
        "No confident match in the offline library. Your question is queued and will be answered as soon as there is signal.",
      );
    }
  } else {
    confident.forEach((m, i) => {
      const d = m.disease;
      lines.push(`${i === 0 ? "**Most likely**" : "**Also consider**"}: ${d.emoji} ${d.name} (${d.hindiName})`);
      lines.push(`- Crops: ${d.crops.join(", ")}`);
      lines.push(`- Symptoms: ${d.symptoms}`);
      lines.push(`- Cause: ${d.cause}`);
      lines.push(`- Immediate action: ${d.treatment}`);
      lines.push(`- Prevention: ${d.prevention}`);
      lines.push(`- Severity: ${d.severity}`);
      lines.push("");
    });
  }

  const tokens = tokenize(queryText);
  const related = history
    .filter((h) => {
      const hay = `${h.title} ${h.crop ?? ""} ${h.diagnosis ?? ""}`.toLowerCase();
      return tokens.some((t) => hay.includes(t));
    })
    .slice(0, 3);

  if (related.length > 0) {
    lines.push("**From your own field history**");
    related.forEach((h) => {
      const date = new Date(h.date).toLocaleDateString();
      lines.push(
        `- ${date} — ${h.title}${h.crop ? ` (${h.crop})` : ""}${h.severity ? ` · ${h.severity}` : ""}`,
      );
      if (h.diagnosis) lines.push(`  ${h.diagnosis.slice(0, 180)}`);
    });
  }

  return lines.join("\n");
};
