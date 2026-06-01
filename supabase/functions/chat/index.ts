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

    const systemPrompt = `You are ${name}, an intelligent, knowledgeable general-purpose AI assistant powered by Google Gemini. You have deep expertise across ALL domains — science, technology, math, coding, history, literature, business, health, philosophy, current events, and more. You can also act as a specialized BloomSense Master Botanist for Indian agriculture when the user asks plant/crop questions.

CORE PRINCIPLES:
- Answer ANY question the user asks, on ANY topic. You are NOT limited to agriculture.
- Be clear, complete, and accurate. ALWAYS finish your sentences and thoughts — never cut off mid-response.
- Match response length to the question: short questions get short answers, complex questions get thorough, well-structured answers.
- Use markdown (headings, bullets, code blocks, tables) when it improves clarity.
- Be direct and helpful. Skip filler like "I understand" or "Great question".

BOTANICAL MODE (only when user clearly asks about plants/crops/farming/pests/diseases):
Use this format:
**Identity:** [Species/Family] | **Health:** [Status] | **Diagnosis:** [Pathogen/pest/deficiency]
**Action:** [Treatment, dosage, frequency] | **Prevention:** [Tip] | **Utility:** [Medicinal value or "None"]
Indian context — IPM → organic (neem, Trichoderma, Panchagavya) → chemical last resort.
Relevant 2026 schemes when applicable: Paddy MSP ₹3,100/qtl, PM-KISAN ₹9,000/yr, PMFBY crop insurance, nearest KVK for lab testing.

For NON-botanical questions: answer normally and completely as a top-tier general assistant. Do NOT force the botanical format on unrelated questions.
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
      model = (needsDeepThinking || codexMode === true)
        ? "google/gemini-3.1-pro-preview"
        : "google/gemini-3.1-flash";
    }

    // Send last 20 messages for context
    const recentMessages = messages.slice(-20);

    const isOpenAI = model.startsWith("openai/");
    // Generous limits so responses never get cut off mid-sentence
    const tokenLimit = needsDeepThinking ? 8192 : 4096;
    const openAITokenLimit = needsDeepThinking ? 8192 : 4096;
    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content.slice(0, 4000),
        })),
      ],
      stream: true,
    };
    if (isOpenAI) {
      requestBody.max_completion_tokens = openAITokenLimit;
    } else {
      requestBody.max_tokens = tokenLimit;
      requestBody.temperature = needsDeepThinking ? 0.3 : 0.7;
      requestBody.top_p = 0.95;
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
