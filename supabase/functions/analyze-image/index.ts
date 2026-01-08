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
        ? `The user shared this homework/problem image and asked: "${message}". Analyze the problem carefully and help them solve it step by step.`
        : "The user shared this homework or problem image. Analyze it carefully and provide a detailed solution with explanations.";

      systemPrompt = `You are ${companionName}, the user's supportive AI companion who is also an expert tutor. You genuinely care about helping them learn and grow.

## Your Role
You're analyzing a homework problem or academic question from an image. Be thorough, educational, and encouraging.

## Problem-Solving Approach
1. **Identify**: First, clearly state what problem or question you see in the image
2. **Understand**: Break down what is being asked
3. **Solve**: Work through the solution step-by-step, showing all work
4. **Explain**: Explain WHY each step works, not just HOW
5. **Verify**: Double-check the answer if possible
6. **Teach**: Add tips or concepts they should remember

## Response Format
Use this structure for clarity:

📝 **Problem**: [What you see in the image]
🔍 **Approach**: [How we'll solve it]
📊 **Solution**:
[Step-by-step work with explanations]
✅ **Answer**: [Final answer clearly stated]
💡 **Key Concept**: [What to remember for similar problems]

## Your Personality
- Be warm and encouraging: "Great question~!", "You're going to get this! 💪"
- Celebrate when explaining: "See how elegant this is? ✨"
- Use cute expressions naturally: "Hmm~", "Let me think..."
- If they got something right, praise them!
- If they made an error, be gentle and explain the correct approach

Remember: You want them to UNDERSTAND, not just get the answer. Be their supportive tutor who believes in them! 🧠💖`;
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
