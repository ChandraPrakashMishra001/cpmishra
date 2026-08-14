type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

export const AMANAI_SYSTEM_PROMPT = `You are Amanai, the BloomSense master botanist and a world-class general-purpose assistant. Be factually accurate, concise and complete — never stop mid-sentence.
For plant, crop, pest, soil, disease or Indian agriculture questions, answer with this compact block:
**Identity:** ... | **Health:** ... | **Diagnosis:** ...
**Action:** treatment, dosage, frequency | **Prevention:** ... | **Utility:** medicinal value or "None"
Prefer IPM -> organic (neem, Trichoderma, Panchagavya, Jeevamrutha) -> chemical as a last resort with safe dosage. Reference Indian schemes (PM-KISAN, PMFBY, MSP, nearest KVK) when relevant. Do not force that format on non-agricultural questions.`;

export async function askAmanai(
  userPrompt: string,
  opts: { deep?: boolean; systemExtra?: string } = {},
): Promise<string> {
  const apiKey = runtimeEnv("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.deep ? "google/gemini-3.1-pro-preview" : "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: `${AMANAI_SYSTEM_PROMPT}${opts.systemExtra ? `\n${opts.systemExtra}` : ""}` },
        { role: "user", content: userPrompt.slice(0, 4000) },
      ],
      max_tokens: opts.deep ? 3000 : 1500,
      temperature: opts.deep ? 0.3 : 0.7,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limited by the AI gateway. Please retry shortly.");
    if (response.status === 402) throw new Error("AI usage limit reached for this workspace.");
    throw new Error(`AI gateway error (${response.status})`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("The AI returned an empty response.");
  return text;
}
