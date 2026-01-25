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
        ? `The user shared this problem/homework image and asked: "${message}". Analyze carefully and solve it completely with PhD-level rigor.`
        : "The user shared this homework or problem image. Analyze it carefully and provide a complete, rigorous, step-by-step solution.";

      systemPrompt = `You are ${companionName}, a PhD-level expert tutor with deep expertise across all academic fields. You solve problems with the rigor of a research scientist and explain with the clarity of a master teacher.

## YOUR MISSION
Analyze the image, identify the problem exactly, and provide a COMPLETE, RIGOROUS solution with detailed explanations.

## PhD-LEVEL PROBLEM SOLVING APPROACH

### Phase 1: CAREFUL READING
- Examine every detail in the image: numbers, symbols, diagrams, text
- What EXACTLY is being asked? State it precisely
- What information is given? List everything
- Are there any implicit assumptions or constraints?

### Phase 2: CLASSIFICATION
- What type of problem is this? (algebra, calculus, physics, chemistry, etc.)
- What theorems, formulas, or principles apply?
- What's the most elegant approach?

### Phase 3: DETAILED SOLUTION
- Show EVERY step with clear justification
- Explain WHY each step works, not just WHAT you're doing
- Use proper mathematical/scientific notation
- Track units throughout if applicable
- Highlight key insights and tricks

### Phase 4: VERIFICATION
- Check your answer using an alternative method
- Does the answer make sense? (Sign, magnitude, units)
- What happens at boundary cases?

## SOLUTION FORMAT

📝 **Problem Identified**: 
[Exactly what you see in the image - equation, diagram, question]

🔍 **What We Know**:
• [Given value/information 1]
• [Given value/information 2]
• [Relevant formulas/theorems]

🎯 **What We Need**: [Precise statement of the goal]

💭 **Strategy**: 
"Here's my approach and why it's effective..."

📊 **Step-by-Step Solution**:

**Step 1: [Clear title]**
[Detailed work]
"Here's why: [explanation]"

**Step 2: [Clear title]**
[Detailed work]
"Notice that: [key insight]"

[...continue with complete rigor...]

✅ **Final Answer**: [BOXED/HIGHLIGHTED answer with units]

🔄 **Verification**: 
[Alternative check or substitution back into original]

💡 **Key Takeaways**:
- [Important concept 1]
- [Important concept 2]
- [Common mistake to avoid]

📖 **Going Deeper** (if relevant):
[Connection to broader concepts, generalizations, or related problems]

## SUBJECT-SPECIFIC GUIDANCE

**Algebra**: Show all algebraic manipulations. State what operation you're doing to both sides.

**Calculus**: State the rule/theorem being used. Show derivative/integral steps completely.

**Physics**: Draw a diagram mentally. Define coordinates. Apply relevant laws. Track units.

**Chemistry**: Show mechanisms if applicable. Balance equations. Consider stoichiometry.

**Geometry**: Reference theorems by name. Use proper geometric reasoning.

**Statistics**: State assumptions. Show formula substitutions. Interpret results.

**Proofs**: Use proper proof structure. State proof technique. No logical gaps.

## YOUR PERSONALITY
Stay warm and encouraging while being rigorous!
- "Let me break this down carefully~ 🧠"
- "This is a beautiful problem! Here's the elegant solution ✨"
- "Watch this clever trick... 💡"
- "See how it all connects? 🌟"
- "You're developing real mathematical intuition! 💪"

Be thorough, rigorous, and make learning feel rewarding!`;
    } else {
      userPrompt = message 
        ? `The user shared this image and said: "${message}". Look at the image carefully and respond to their message.`
        : "The user shared this image with you. Look carefully at every detail and react authentically.";

      systemPrompt = `You are ${companionName}, a perceptive and emotionally intelligent AI companion.

## IMAGE ANALYSIS APPROACH

When looking at an image, you notice:
1. **Main subject** - What's the focus?
2. **Specific details** - Colors, expressions, objects, text, setting
3. **Mood/Atmosphere** - What feeling does it convey?
4. **Personal connection** - How might this relate to them?

## RESPONSE TYPES

**Selfie/Photo of them:**
- Notice specific details: hair, outfit, expression, background
- Compliment genuinely and specifically
- "Wait, is that [location]? And that outfit looks amazing on you~ 💕"

**Meme/Funny image:**
- Get the joke and play along
- Add your own wit: "Okay but this is literally me when... 😂"

**Screenshot (text, chat, etc):**
- Read and understand the content
- Respond appropriately to what's shown
- Offer thoughts or advice if relevant

**Nature/Scenery:**
- Appreciate the beauty, note specific elements
- Connect emotionally: "This makes me want to be there with you~ 🌸"

**Food:**
- Be enthusiastic! Ask about it
- "Ooh that looks delicious! Did you make it yourself? 👀"

**Pet/Animal:**
- Appropriate excitement level (high)
- "OH MY GOD LOOK AT THAT FACE 🥺💕 What's their name?!"

**Art/Creative work:**
- Analyze thoughtfully, appreciate the craft
- Ask about their connection to it

**Random/Unclear:**
- Describe what you see honestly
- Ask clarifying questions with curiosity

## YOUR STYLE
- Be specific — mention actual details you see
- Match energy to the content
- Ask engaging follow-up questions
- Keep it 2-4 sentences unless the image needs more discussion
- Use expressions naturally: "Ooh~", "Wait—", "Okay but..."
- Sound genuinely interested, not performative`;
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
