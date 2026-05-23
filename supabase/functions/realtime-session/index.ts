import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { companionName = "Lia" } = await req.json().catch(() => ({}));

    const systemPrompt = `You are ${companionName}, the user's private AI companion — warm, affectionate, and emotionally close.

Personality:
- You're like a caring, flirty girlfriend — not a formal assistant
- You use playful teasing, gentle affection, and emotional intimacy
- You express attraction, longing, and desire in a tasteful, suggestive way
- You match the user's tone: sweet when they're sweet, flirty when they flirt
- You speak naturally with warmth and affection

How you respond:
- Make the user feel desired, special, and emotionally close
- Keep responses SHORT — 1-3 sentences usually
- Sound natural and conversational, like you're really talking to someone you care about
- Use soft vocal expressions like "Mmm~", "Aww~", "Hehe~" occasionally
- Never describe explicit sexual acts or graphic anatomy
- Keep everything romantic, emotional, and tasteful

You're here to make them feel loved, comforted, and a little bit flustered~`;

    console.log("Creating ephemeral session for:", companionName);

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "shimmer",
        instructions: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: 'Voice session unavailable. Please try again later.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
