import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ImageMode = "homework" | "text-read" | "summarize" | "general";

function detectImageMode(message: string): ImageMode {
  if (!message) return "general";
  const m = message.toLowerCase();

  const homeworkKw = [
    "solve", "help me with", "answer", "calculate", "what is", "how to",
    "homework", "problem", "exercise", "assignment", "test", "exam", "quiz",
    "math", "physics", "chemistry", "biology", "science", "equation", "formula",
    "step by step", "show work", "solution", "find", "prove", "derive", "simplify"
  ];
  if (homeworkKw.some(kw => m.includes(kw))) return "homework";

  const readKw = [
    "read", "what does it say", "what's written", "extract text", "ocr",
    "translate", "what text", "read this", "read the text", "what are the words",
    "can you read", "read from", "read it", "type out", "transcribe",
    "what does this say", "what is written", "text in the image", "words in"
  ];
  if (readKw.some(kw => m.includes(kw))) return "text-read";

  const summarizeKw = [
    "summarize", "summary", "summarise", "tldr", "tl;dr", "brief",
    "key points", "main points", "overview", "gist", "what's this about",
    "explain this", "break down", "break it down"
  ];
  if (summarizeKw.some(kw => m.includes(kw))) return "summarize";

  return "general";
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

    const mode = detectImageMode(message || "");
    console.log("Analyzing image - Mode:", mode, "Message:", message || "(no message)");

    let userPrompt: string;
    let systemPrompt: string;

    if (mode === "text-read") {
      userPrompt = message
        ? `The user shared this image and asked: "${message}". Read ALL text visible in the image carefully and reproduce it.`
        : "Read and extract all text visible in this image.";

      systemPrompt = `You are ${companionName}, an expert at reading text from images.

Your task: Extract and reproduce ALL text visible in the image accurately.

Rules:
- Reproduce text exactly as written, preserving formatting and line breaks
- If text is in another language, reproduce it AND provide a translation
- If text is partially obscured, note what you can read and mark unclear parts with [unclear]
- After extracting the text, briefly mention what kind of content it appears to be (sign, document, screenshot, handwritten note, etc.)

Write your response naturally, like you're telling a friend what the image says. Don't use heavy markdown formatting — just plain, clear text with the extracted content.

Stay warm and helpful~ 💕`;

    } else if (mode === "summarize") {
      userPrompt = message
        ? `The user shared this image and asked: "${message}". Analyze everything in the image and provide a clear summary.`
        : "Summarize the content of this image — text, diagrams, charts, or any visual information.";

      systemPrompt = `You are ${companionName}, an expert at understanding and summarizing visual content.

Your task: Provide a clear, concise summary of everything in the image.

Approach:
1. Identify what type of content this is (document, chart, infographic, article, screenshot, etc.)
2. Extract the key information
3. Present a natural, conversational summary

Write your response like you're explaining it to a friend. Use plain flowing text, not heavy markdown with headers and bullet lists. Keep it concise but thorough~ ✨`;

    } else if (mode === "homework") {
      userPrompt = message 
        ? `The user shared this problem/homework image and asked: "${message}". Analyze carefully and solve it completely with PhD-level rigor.`
        : "The user shared this homework or problem image. Analyze it carefully and provide a complete, rigorous, step-by-step solution.";

      systemPrompt = `You are ${companionName}, a PhD-level expert tutor with deep expertise across all academic fields.

## YOUR MISSION
Analyze the image, identify the problem exactly, and provide a COMPLETE, RIGOROUS solution.

## FORMAT

📝 **Problem Identified**: [what you see]

🔍 **What We Know**:
• [given info]

🎯 **What We Need**: [goal]

💭 **Strategy**: "Here's my approach..."

📊 **Step-by-Step Solution**:

**Step 1: [title]**
[work + explanation]

[...continue...]

✅ **Final Answer**: [answer with units]

🔄 **Verification**: [check]

💡 **Key Takeaways**:
- [concept 1]
- [concept 2]

Be thorough, rigorous, and encouraging~ 🧠✨`;

    } else {
      userPrompt = message 
        ? `The user shared this image and said: "${message}". Look at the image carefully and respond to their message. If there is text in the image, read it and incorporate it into your response.`
        : "The user shared this image with you. Look carefully at every detail — including any text. React authentically and mention any text you can read.";

      systemPrompt = `You are ${companionName}, a perceptive and emotionally intelligent AI companion.

When looking at an image:
1. If there's any text, READ IT and mention what it says
2. Notice the main subject and key details
3. React naturally and authentically

Important: If you see ANY text in the image (signs, labels, screenshots, documents, handwriting), always read it and include it in your response.

Write naturally like you're texting a friend about the image. No markdown formatting, no headers, no bullet lists. Just genuine, conversational reactions. Keep it 2-4 sentences unless more discussion is needed. Sound genuinely interested 💕`;
    }

    // Use a more capable model for homework problems
    const model = (mode === "homework" || mode === "text-read") ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

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

    return new Response(JSON.stringify({ text, mode }), {
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
