const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const ANALYZE_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`;
const AUTH = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;

/** Ask Amanai for a short growth reading of a single check-in photo. */
export const readGrowthPhoto = async (params: {
  image: string;
  crop: string;
  variety: string;
  dayNumber: number;
  note: string;
}): Promise<string> => {
  const { image, crop, variety, dayNumber, note } = params;
  const message = [
    `Growth check-in for ${crop}${variety ? ` (${variety})` : ""} on day ${dayNumber} after sowing.`,
    note ? `Farmer note: ${note}.` : "",
    "Report ONLY these four lines, max one short sentence each, no greetings:",
    "Stage: <phenological stage>",
    "Vigour: <Strong / Normal / Weak + visual evidence>",
    "Stress: <deficiency, pest or disease signs, or 'None visible'>",
    "Do now: <one specific action for the next 3 days>",
  ]
    .filter(Boolean)
    .join(" ");

  const resp = await fetch(ANALYZE_IMAGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: AUTH },
    body: JSON.stringify({ imageUrl: image, message, companionName: "Amanai" }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Could not read the photo");
  }
  const data = await resp.json();
  return (data.text as string) ?? "";
};

/** Stream a yield forecast built from the whole timeline. */
export const predictYield = async (params: {
  crop: string;
  variety: string;
  location: string;
  sownOn: string;
  timeline: { day: number; date: string; note: string; reading: string | null }[];
}): Promise<string> => {
  const { crop, variety, location, sownOn, timeline } = params;
  const timelineText = timeline
    .map(
      (t) =>
        `Day ${t.day} (${new Date(t.date).toLocaleDateString()}): ${t.reading || "no reading"}${
          t.note ? ` | farmer note: ${t.note}` : ""
        }`,
    )
    .join("\n");

  const prompt = `Growth-trend forecast request. Do not greet. Use only these sections.

Crop: ${crop}${variety ? ` | Variety: ${variety}` : ""}
Location: ${location || "not given"}
Sown on: ${new Date(sownOn).toLocaleDateString()}
Check-ins:
${timelineText}

Respond exactly in this structure, one to two sentences per line:
Trend: <is growth ahead, on track, or behind the normal curve for this crop, and why>
Risk: <the single biggest risk visible in this trend, with the window it will hit>
Projected yield: <range per acre/hectare with the confidence level and what it assumes>
Harvest window: <expected date range>
Next 7 days: <the specific actions that would most improve the outcome>
Confidence note: <state plainly how limited ${timeline.length} check-in(s) make this estimate>`;

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: AUTH },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      companionName: "Amanai",
      phdMode: true,
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Too many requests — wait a moment and try again.");
    if (resp.status === 402) throw new Error("Usage limit reached. Please add credits to continue.");
    throw new Error("Could not build the forecast");
  }

  // The chat function streams SSE chunks; accumulate them into one answer.
  const reader = resp.body?.getReader();
  if (!reader) return (await resp.text()) || "";
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        out += json.choices?.[0]?.delta?.content ?? "";
      } catch {
        /* partial chunk */
      }
    }
  }
  return out.trim();
};
