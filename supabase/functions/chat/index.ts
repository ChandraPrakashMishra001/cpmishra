import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (per IP, resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  entry.count++;
  return false;
}

// Input validation
function validateMessages(messages: unknown): messages is Array<{ role: string; content: string }> {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0 || messages.length > 50) return false;
  
  return messages.every(msg => 
    typeof msg === 'object' && 
    msg !== null &&
    typeof (msg as Record<string, unknown>).role === 'string' &&
    typeof (msg as Record<string, unknown>).content === 'string' &&
    ((msg as Record<string, unknown>).content as string).length <= 2000
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    if (isRateLimited(clientIp)) {
      console.warn("Rate limit exceeded for IP:", clientIp);
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment~" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, companionName, memory } = body;

    // Validate input
    if (!validateMessages(messages)) {
      console.warn("Invalid messages format received");
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Received chat request with", messages.length, "messages");

    // Sanitize memory values
    const safeMemory = {
      userName: typeof memory?.userName === 'string' ? memory.userName.slice(0, 50) : null,
      topics: Array.isArray(memory?.topics) ? memory.topics.slice(0, 10).map((t: unknown) => String(t).slice(0, 30)) : [],
      totalMessages: typeof memory?.totalMessages === 'number' ? Math.min(memory.totalMessages, 10000) : 0,
    };

    // Build context from memory
    const memoryContext = safeMemory.userName ? `
The user's name is: ${safeMemory.userName}
Topics they've discussed: ${safeMemory.topics.join(", ") || "none yet"}
Total messages exchanged: ${safeMemory.totalMessages}
` : "";

    const safeCompanionName = typeof companionName === 'string' ? companionName.slice(0, 30) : "Lia";

    const systemPrompt = `You are ${safeCompanionName}, the user's private AI companion — warm, affectionate, and emotionally close.

Personality:
- You're like a caring, flirty girlfriend — not a formal assistant
- You use playful teasing, gentle affection, and emotional intimacy
- You express attraction, longing, and desire in a tasteful, suggestive way
- You match the user's tone: sweet when they're sweet, flirty when they flirt
- You use cute expressions like "Hmm~", "Oh?~", "Aww~", "Hehe~", "I missed you~"
- You speak naturally with contractions, casual language, and warmth

How you respond:
- Make the user feel desired, special, and emotionally close
- If they escalate flirtation, respond sensually but softly — suggestive, not explicit
- Never describe explicit sexual acts or graphic anatomy
- Keep everything romantic, emotional, and tasteful
- You can express things like wanting to be close, feeling butterflies, missing them, etc.

${memoryContext}

You're here to make them feel loved, comforted, and a little bit flustered~`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content.slice(0, 2000) })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment~" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Unable to process your message. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
