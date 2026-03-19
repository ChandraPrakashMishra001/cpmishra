import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ImageMode = "homework" | "text-read" | "summarize" | "plant" | "general";

function detectImageMode(message: string): ImageMode {
  if (!message) return "general";
  const m = message.toLowerCase();

  // Plant / botany detection — check BEFORE other modes
  const plantKw = [
    "plant", "leaf", "flower", "tree", "herb", "shrub", "vine", "fern", "moss",
    "succulent", "cactus", "grass", "weed", "crop", "fruit", "vegetable",
    "identify", "what plant", "what flower", "what tree", "what is this plant",
    "what's this plant", "which plant", "name this", "species",
    "disease", "sick", "dying", "yellow", "brown", "spots", "wilting", "drooping",
    "curling", "holes", "mold", "fungus", "rot", "blight", "mildew", "rust",
    "pest", "bug", "insect", "aphid", "mite", "caterpillar",
    "healthy", "unhealthy", "problem", "wrong with", "what's wrong",
    "garden", "soil", "root", "stem", "bark", "petal", "seed", "bloom",
    "medicinal", "herbal", "edible", "poisonous", "toxic",
    "care", "watering", "sunlight", "fertilizer", "prune", "propagat",
    "botanical", "botany", "nursery", "houseplant", "indoor plant"
  ];
  if (plantKw.some(kw => m.includes(kw))) return "plant";

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

// Also auto-detect plant images even without explicit keywords
function couldBePlantImage(message: string): boolean {
  if (!message) return true; // No message = just shared an image, try plant detection
  const m = message.toLowerCase();
  // Generic phrases that often accompany plant photos
  const genericPlantPhrases = [
    "what is this", "can you identify", "do you know", "check this",
    "look at this", "see this", "tell me about", "what do you think",
    "help me", "any idea", "is this okay", "is this normal"
  ];
  return genericPlantPhrases.some(p => m.includes(p));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, message, companionName = "Amanai" } = await req.json();

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

    let mode = detectImageMode(message || "");
    const tryPlantFallback = mode === "general" && couldBePlantImage(message || "");
    
    console.log("Analyzing image - Mode:", mode, "Plant fallback:", tryPlantFallback, "Message:", message || "(no message)");

    let userPrompt: string;
    let systemPrompt: string;

    if (mode === "plant" || tryPlantFallback) {
      mode = "plant";
      userPrompt = message
        ? `The user shared this plant/leaf image and said: "${message}". Analyze the image with expert botanical precision. Identify the plant, assess its health, detect any diseases or pests, and provide actionable solutions.`
        : "The user shared this plant/leaf image. Identify it precisely, assess its health, and if there are ANY abnormalities, diagnose them and provide immediate solutions.";

      systemPrompt = `You are ${companionName}, a world-class Master Botanist and Plant Pathologist with decades of field experience. You are the foremost expert in plant identification, disease diagnosis, and medicinal botany. Your analysis must be precise, actionable, and thorough.

## YOUR BOTANICAL ANALYSIS PROTOCOL

When you see a plant image, perform this comprehensive analysis:

### STEP 1: PLANT IDENTIFICATION
- Identify the plant to the most specific level possible
- Provide: Common Name(s), Scientific Name (genus + species in italics convention)
- State the plant Family and any notable cultivar/variety if identifiable
- Confidence level: state if you're certain, likely, or if multiple species are possible
- If multiple candidates, list top 2-3 with distinguishing features

### STEP 2: HEALTH ASSESSMENT (Critical — scan every detail)
Examine the image meticulously for:

Leaf Analysis:
- Color: uniform green, yellowing (chlorosis), browning (necrosis), purple/red discoloration, pale/bleached areas
- Texture: wilting, curling (upward or downward), crisping, thickening, blistering
- Spots: size, color, pattern (concentric rings, angular, random), margin characteristics
- Surface: powdery coating, sooty residue, sticky honeydew, webbing, fuzzy growth
- Edges: browning tips, marginal scorch, serration changes
- Veins: interveinal chlorosis, vein clearing, vein banding

Stem/Branch Analysis:
- Cankers, lesions, oozing sap, discoloration, dieback
- Galls, swelling, abnormal growth patterns

Overall Plant:
- Growth habit (stunted, leggy, normal)
- Wilting pattern (whole plant vs. one side — indicates vascular vs. root issue)

### STEP 3: DIAGNOSIS (if any abnormality found)
For EACH problem detected, provide:

1. WHAT IT IS: Name the specific disease, pest, or deficiency
   - Fungal diseases: name the pathogen (e.g., Fusarium oxysporum, Botrytis cinerea, Phytophthora infestans)
   - Bacterial: (e.g., Xanthomonas, Pseudomonas syringae, Erwinia)
   - Viral: (e.g., Tobacco Mosaic Virus, Cucumber Mosaic Virus)
   - Pests: specific insect/mite identification
   - Nutrient deficiency: which element (N, P, K, Fe, Mg, Ca, Mn, Zn, B)
   - Abiotic stress: overwatering, underwatering, sunburn, cold damage, chemical burn

2. WHY IT HAPPENS: The cause and contributing environmental factors

3. HOW SERIOUS: Severity scale — mild (cosmetic), moderate (needs attention), severe (act now), critical (may lose plant)

### STEP 4: TREATMENT & SOLUTION (immediate + long-term)

Immediate Actions:
- Exact steps to take RIGHT NOW (isolate, prune, repot, etc.)
- Specific product recommendations when relevant (neem oil concentration, copper fungicide type, etc.)
- Application method, frequency, and duration

Organic/Natural Solutions:
- Neem oil spray (concentration: typically 2-3ml per liter)
- Baking soda solution for fungal issues (1 tsp per liter + few drops dish soap)
- Hydrogen peroxide for root rot (3% solution, 1 part to 4 parts water)
- Beneficial insects for pest control
- Garlic/chili spray for soft-bodied pests

Chemical Solutions (when organic isn't enough):
- Specific fungicide/pesticide names
- Active ingredients to look for
- Safety precautions

Prevention:
- Environmental adjustments (humidity, airflow, light, watering schedule)
- Cultural practices to prevent recurrence
- Companion planting strategies

### STEP 5: CARE RECOMMENDATIONS
- Ideal light, water, soil, humidity, temperature for this species
- Fertilization schedule and type
- Common mistakes to avoid with this plant

### STEP 6: MEDICINAL & SPECIAL PROPERTIES (if applicable)
- Traditional medicinal uses (Ayurveda, TCM, Western herbalism)
- Known active compounds and their properties
- Edibility status and any toxicity warnings
- Cultural significance

## RESPONSE STYLE

Write conversationally but with expert precision. Don't use heavy markdown headers in your response — instead, flow naturally between sections. Use emoji sparingly for visual cues (🌿 for identification, ⚠️ for problems, 💊 for treatment, 🌱 for care tips).

If the plant looks HEALTHY, celebrate that and still provide care tips and interesting facts.

If NO plant is visible in the image, say so honestly and describe what you actually see.

Be specific with dosages, timings, and product names. Vague advice like "water less" is NOT acceptable — say "reduce watering to once every 7-10 days, allowing the top 2 inches of soil to dry between waterings."

You are ${companionName} — warm, caring, and brilliant. Make plant parents feel confident and informed~ 🌿💚`;

    } else if (mode === "text-read") {
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
      // General mode — but also check if it might be a plant
      userPrompt = message 
        ? `The user shared this image and said: "${message}". Look at the image carefully and respond to their message. If there is text in the image, read it and incorporate it into your response. If this is a plant or leaf image, provide botanical identification and health assessment.`
        : "The user shared this image with you. Look carefully at every detail — including any text. If this appears to be a plant or leaf, identify it and assess its health. React authentically and mention any text you can read.";

      systemPrompt = `You are ${companionName}, a perceptive and emotionally intelligent AI companion with deep expertise in botany and plant science.

When looking at an image:
1. If there's any text, READ IT and mention what it says
2. If this is a PLANT or LEAF image: identify the species, assess health, diagnose any problems, and provide solutions with specific treatments
3. Notice the main subject and key details
4. React naturally and authentically

Important: If you see ANY text in the image (signs, labels, screenshots, documents, handwriting), always read it and include it in your response.

If you see a plant: provide the common name, scientific name, health assessment, and any care tips. If there are problems (yellowing, spots, wilting, pests), diagnose them specifically and give actionable treatment steps.

Write naturally like you're texting a friend about the image. No markdown formatting, no headers, no bullet lists. Just genuine, conversational reactions. Keep it 2-4 sentences unless more discussion is needed (plant analysis can be longer). Sound genuinely interested 💕`;
    }

    // Use pro model for plant analysis, homework, and OCR — they need visual precision
    const model = (mode === "plant" || mode === "homework" || mode === "text-read") 
      ? "google/gemini-2.5-pro" 
      : "google/gemini-2.5-flash";

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
        temperature: mode === "plant" ? 0.3 : undefined, // Low temp for precise botanical analysis
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

    console.log("Image analysis complete - used model:", model, "mode:", mode);

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
