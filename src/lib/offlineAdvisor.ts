import { diseases, Disease } from "@/data/diseases";

export interface OfflineHistoryEntry {
  title: string;
  crop: string | null;
  diagnosis: string | null;
  severity: string | null;
  date: string;
}

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z\u0900-\u097F\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

const scoreDisease = (tokens: string[], d: Disease): number => {
  const haystack = [
    d.name,
    d.hindiName,
    d.crops.join(" "),
    d.symptoms,
    d.cause,
    d.prevention,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const t of tokens) {
    if (haystack.includes(t)) score += 1;
    if (d.name.toLowerCase().includes(t)) score += 3;
    if (d.crops.some((c) => c.toLowerCase().includes(t))) score += 2;
  }
  return score;
};

/** Best-effort matches from the on-device disease library. */
export const matchDiseases = (queryText: string, max = 2): Disease[] => {
  const tokens = tokenize(queryText);
  if (tokens.length === 0) return [];
  return diseases
    .map((d) => ({ d, s: scoreDisease(tokens, d) }))
    .filter((x) => x.s >= 2)
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((x) => x.d);
};

/**
 * Builds a provisional, clearly-labelled answer using only local data,
 * for use when the device has no internet.
 */
export const buildOfflineAnswer = (
  queryText: string,
  history: OfflineHistoryEntry[] = [],
): string => {
  const matches = matchDiseases(queryText);
  const lines: string[] = [];

  lines.push("**📴 Offline guidance (provisional)**");
  lines.push(
    "No connection right now. This is matched from the on-device disease library — the full answer will arrive automatically when you are back online.",
  );
  lines.push("");

  if (matches.length === 0) {
    lines.push(
      "No confident match in the offline library. Your question is queued and will be answered as soon as there is signal.",
    );
  } else {
    matches.forEach((d, i) => {
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

  const related = history
    .filter((h) => {
      const tokens = tokenize(queryText);
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
