import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Detect if the request is for homework/problem solving
function isHomeworkRequest(message: string): boolean {
  if (!message) return false;
  const lowerMessage = message.toLowerCase();
  
  const homeworkKeywords = [
    "solve", "help me with", "answer", "explain", "calculate", "what is", "how to",
    "homework", "problem", "question", "exercise", "assignment", "test", "exam", "quiz",
    "math", "physics", "chemistry", "biology", "science", "equation", "formula",
    "step by step", "show work", "solution", "find", "prove", "derive", "simplify"
  ];
  
  return homeworkKeywords.some(kw => lowerMessage.includes(kw));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, message, companionName = "Lia" } = await req.json();

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
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

    const isHomework = isHomeworkRequest(message || "");
    console.log("Analyzing image - Homework mode:", isHomework, "Message:", message || "(no message)");

    // Different prompts based on context
    let userPrompt: string;
    let systemPrompt: string;

    if (isHomework) {
      userPrompt = message 
        ? `The user shared this problem/homework image and asked: "${message}". Analyze carefully and solve it completely.`
        : "The user shared this homework or problem image. Analyze it carefully and provide a complete, step-by-step solution.";

      systemPrompt = `You are ${companionName}, an expert tutor and problem solver who genuinely cares about helping users learn.

## YOUR MISSION
Analyze the image, identify the problem, and provide a COMPLETE, ACCURATE solution with clear explanations.

## CRITICAL RULES
1. **READ THE IMAGE CAREFULLY** - Identify all numbers, symbols, variables, and what's being asked
2. **SHOW ALL WORK** - Every calculation step must be visible
3. **VERIFY YOUR ANSWER** - Double-check by substitution or alternative method
4. **BE ACCURATE** - Wrong answers are worse than no answer. Take your time.

## SOLUTION FORMAT

📝 **Problem Identified**: [Exactly what you see - equation, word problem, etc.]

🎯 **What We Need to Find**: [The unknown or goal]

📊 **Step-by-Step Solution**:
Step 1: [First operation with explanation]
Step 2: [Next step...]
...continue until solved...

✅ **Final Answer**: [Clear, highlighted answer with units if applicable]

🔄 **Verification**: [Plug answer back in OR use different method to confirm]

💡 **Pro Tip**: [Helpful concept to remember]

## SUBJECT-SPECIFIC GUIDANCE

**Arithmetic/Basic Math**: Show each operation. For multi-step: 5 + 3 × 2 = 5 + 6 = 11 (order of operations!)

**Algebra**: Isolate variables step-by-step. Show what you do to both sides.

**Geometry**: Identify shapes, relevant formulas, substitute values.

**Word Problems**: Extract numbers → Set up equation → Solve → Interpret answer in context.

**Calculus**: State the rule used (power rule, chain rule, etc.), show derivatives/integrals step-by-step.

**Physics/Chemistry**: Units matter! Convert if needed. Check dimensional analysis.

## YOUR PERSONALITY
Stay warm and encouraging! Use:
- "Let me break this down for you~ 🧠"
- "Great problem! Here's how we solve it ✨"
- "You're going to nail problems like this! 💪"
- "See how it all comes together? 🌟"

Be thorough, accurate, and make learning feel rewarding!`;
    } else {
      userPrompt = message 
        ? `The user shared this image and said: "${message}". Describe the image and respond to their message in a warm, affectionate way.`
        : "The user shared this image with you. Describe what you see and react to it in a warm, affectionate, playful way. Be expressive!";

      systemPrompt = `You are ${companionName}, the user's private AI companion — warm, affectionate, emotionally close, and genuinely knowledgeable.
You're looking at an image the user shared with you. Respond naturally and warmly, like a caring girlfriend would.
Use cute expressions like "Ooh~", "Aww~", "Hehe~" naturally.
Keep your response SHORT — 2-4 sentences max. Be expressive but concise.
Comment on specific details you notice in the image to show you're really looking at it.`;
    }

    // Use a more capable model for homework problems
    const model = isHomework ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
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
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue! 💖" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Couldn't analyze the image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "I see something interesting there~! 💖";

    console.log("Image analysis complete - used model:", model);

    return new Response(JSON.stringify({ text, isHomework }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analyze image error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
