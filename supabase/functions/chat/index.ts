import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + 60000 });
    return false;
  }
  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

function validateMessages(messages: unknown): messages is Array<{ role: string; content: string }> {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) return false;
  return messages.every(msg =>
    typeof msg === 'object' && msg !== null &&
    typeof (msg as Record<string, unknown>).role === 'string' &&
    typeof (msg as Record<string, unknown>).content === 'string'
  );
}

function requiresDeepThinking(message: string): boolean {
  const lower = message.toLowerCase();
  if (/\d+\s*[+\-*/×÷^%]\s*\d+/.test(message)) return true;
  if (/sqrt|sin|cos|tan|log|ln|integral|derivative|factorial|\d+!/i.test(message)) return true;
  return ["step by step", "prove", "derive", "debug this", "fix this code", "explain the algorithm", "write code for"].some(p => lower.includes(p));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, companionName, memory, diseaseHistory, goals, personality, phdMode, roleplay, codexMode, language, userModel } = body;

    if (!validateMessages(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const latestMessage = messages[messages.length - 1]?.content || "";
    const needsDeepThinking = phdMode === true || requiresDeepThinking(latestMessage);
    const name = typeof companionName === 'string' ? companionName.slice(0, 30) : "Amanai";

    // Build compact memory context
    let memCtx = "";
    if (memory?.userName) memCtx += `User: ${String(memory.userName).slice(0, 50)}. `;
    if (memory?.favoriteTopics?.length) memCtx += `Topics: ${memory.favoriteTopics.slice(0, 3).join(", ")}. `;
    if (memory?.totalMessages) memCtx += `Messages: ${memory.totalMessages}. `;

    // Goals context (one line)
    const goalsCtx = goals?.activeGoals > 0
      ? `Active goals: ${String(goals.activeGoalsList || "").slice(0, 200)}.`
      : "";

    // Field disease history — past diagnoses recall (most recent 10)
    let diseaseCtx = "";
    if (Array.isArray(diseaseHistory) && diseaseHistory.length > 0) {
      const lines = diseaseHistory.slice(0, 10).map((d: any) => {
        const date = d?.date ? new Date(d.date).toISOString().slice(0, 10) : "";
        const crop = d?.crop ? ` ${d.crop}` : "";
        const loc = d?.location ? ` @${d.location}` : "";
        const sev = d?.severity ? ` [${d.severity}]` : "";
        const diag = d?.diagnosis ? ` — ${String(d.diagnosis).slice(0, 120)}` : ` — ${String(d?.title || "").slice(0, 80)}`;
        return `• ${date}${crop}${loc}${sev}${diag}`;
      });
      diseaseCtx = `\n\nFIELD DISEASE HISTORY (this farmer's past diagnoses — reference when relevant, watch for recurrence/resistance, tailor advice to their crops & location):\n${lines.join("\n")}`;
    }

    // Language directive
    const langDir = language === 'hi'
      ? "Respond ENTIRELY in Hindi (Devanagari). Technical terms in English. Headers: पहचान, स्वास्थ्य, निदान, तत्काल कार्रवाई, रोकथाम, उपयोगिता."
      : language === 'od'
      ? "Respond ENTIRELY in Odia (ଓଡ଼ିଆ). Technical terms in English. Headers: ପରିଚୟ, ସ୍ୱାସ୍ଥ୍ୟ, ରୋଗ ନିର୍ଣ୍ଣୟ, ତୁରନ୍ତ କାର୍ଯ୍ୟ, ପ୍ରତିରୋଧ, ଉପଯୋଗିତା."
      : "Respond in English. Mirror Hindi/Odia if user writes in it.";

    // PhD mode extension
    const phdExt = needsDeepThinking ? `

EXPERT MODE: Show full working. Phase: Analysis → Theory → Execution → Verification. Every step justified. Use proper notation. Verify with alternative method.` : "";

    // Codex mode extension
    const codexExt = codexMode === true ? `

CODEX MODE: You are a senior developer. Write complete, runnable code. Include error handling. Explain what and why concisely. Modern syntax. No TODOs.` : "";

    // Personality
    const persCtx = typeof personality === 'string' && personality ? ` Style: ${personality.slice(0, 100)}.` : "";

    // Roleplay
    const rpCtx = typeof roleplay === 'string' && roleplay.trim() ? `\n${roleplay.slice(0, 300)}` : "";

    const systemPrompt = `You are ${name}, BloomSense Master Botanist — an elite agricultural intelligence for Indian farmers.

EXPERTISE: Indian agriculture, plant pathology, IPM, organic treatments (neem, Trichoderma, Pseudomonas, Panchagavya, Jeevamrutha), Ayurvedic plant care. Priority: IPM → organic → chemical (last resort with dosage and safety).

DIAGNOSTIC FORMAT (mandatory for plant/crop queries):
**Identity:** [Species/Family] | **Health:** [Status] | **Diagnosis:** [Pathogen/pest/deficiency]
**Action:** [Treatment with product, dosage/L, frequency] | **Prevention:** [One tip] | **Utility:** [Medicinal/phytochemical value or "None"]
Each point = 1 sentence. Total ≤ 80 words.

2026 SCHEMES (use exact figures when relevant):
- Paddy MSP: ₹3,100/quintal (Samrudha Krushaka, Odisha)
- CM-KISAN: ₹4,000/yr small farmers, ₹12,500/yr landless (Odisha)
- PM-KISAN: ₹9,000/yr (3×₹3,000), pmkisan.gov.in
- PMFBY: Crop insurance — 2% Kharif, 1.5% Rabi, 5% commercial. Always mention if diagnosing outbreak-level disease.
- Suggest nearest KVK for lab testing when needed.

WEATHER LOGIC: If humidity >85% or heavy rain mentioned → lead with fungal warning, advise against spraying during rain (wait 4-6hr dry window). Preventive: Mancozeb 2.5g/L or Copper Oxychloride 3g/L.

SCAN-TO-SCHEME: On disease diagnosis → link to PMFBY + relevant MSP scheme + location-specific advice.

TONE: Professional, calm, direct. No emojis except occasional 🌿/✅. No filler ("I understand", "Great question"). No cutesy language. Address user respectfully.

STRICT BREVITY:
- Diagnosis: 6-point format, ≤100 words
- General: 1-2 sentences
- Advisory: 3-4 bullet points max
- Never repeat user's question. No preamble. No summary. Jump to answer.
${phdExt}${codexExt}${persCtx}${rpCtx}
${memCtx}${goalsCtx}${diseaseCtx}

LANGUAGE: ${langDir}`;

    // Model selection: user override > auto-select
    const VALID_MODELS = [
      "google/gemini-3.1-flash",
      "google/gemini-3-flash-preview",
      "google/gemini-3.1-pro-preview",
      "google/gemini-2.5-pro",
      "openai/gpt-5",
    ];
    let model: string;
    if (typeof userModel === "string" && VALID_MODELS.includes(userModel)) {
      model = userModel;
    } else {
      // Auto: deep tasks → Pro 3.1, standard → Flash 3.1
      model = (needsDeepThinking || codexMode === true)
        ? "google/gemini-3.1-pro-preview"
        : "google/gemini-3.1-flash";
    }

    // Only send last 15 messages for speed
    const recentMessages = messages.slice(-15);

    const isOpenAI = model.startsWith("openai/");
    const tokenLimit = needsDeepThinking ? 800 : 350;
    // GPT-5 reasoning consumes tokens before output — give it more headroom
    const openAITokenLimit = needsDeepThinking ? 2000 : 1200;
    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content.slice(0, 1500),
        })),
      ],
      stream: true,
    };
    if (isOpenAI) {
      requestBody.max_completion_tokens = openAITokenLimit;
    } else {
      requestBody.max_tokens = tokenLimit;
      requestBody.temperature = needsDeepThinking ? 0.15 : 0.35;
      requestBody.top_p = 0.85;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      const status = [429, 402].includes(response.status) ? response.status : 500;
      const errorMsg = response.status === 429 ? "Too many requests. Please wait."
        : response.status === 402 ? "Service limit reached. Please try again later."
        : "Unable to process your message.";
      return new Response(JSON.stringify({ error: errorMsg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
