import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhance prompt for better image generation
function enhancePrompt(userPrompt: string): string {
  const lowerPrompt = userPrompt.toLowerCase();
  
  // Detect art style requests
  const hasStyleKeyword = [
    "anime", "realistic", "cartoon", "painting", "sketch", "3d", "pixel",
    "watercolor", "oil painting", "digital art", "photo", "cinematic"
  ].some(style => lowerPrompt.includes(style));
  
  // Detect quality keywords already present
  const hasQualityKeyword = [
    "detailed", "high quality", "hd", "4k", "beautiful", "stunning",
    "professional", "masterpiece", "best quality"
  ].some(q => lowerPrompt.includes(q));
  
  // Build enhanced prompt
  let enhanced = userPrompt.trim();
  
  // Add default style if none specified
  if (!hasStyleKeyword) {
    // Detect subject to choose appropriate default style
    if (lowerPrompt.includes("person") || lowerPrompt.includes("girl") || 
        lowerPrompt.includes("boy") || lowerPrompt.includes("woman") || 
        lowerPrompt.includes("man") || lowerPrompt.includes("character")) {
      enhanced = `${enhanced}, anime style, beautiful illustration`;
    } else if (lowerPrompt.includes("landscape") || lowerPrompt.includes("nature") ||
               lowerPrompt.includes("sunset") || lowerPrompt.includes("mountain")) {
      enhanced = `${enhanced}, scenic, atmospheric lighting, digital art`;
    } else if (lowerPrompt.includes("cat") || lowerPrompt.includes("dog") ||
               lowerPrompt.includes("animal") || lowerPrompt.includes("pet")) {
      enhanced = `${enhanced}, cute, adorable, soft lighting`;
    } else {
      enhanced = `${enhanced}, high quality digital art`;
    }
  }
  
  // Add quality enhancement if not present
  if (!hasQualityKeyword) {
    enhanced = `${enhanced}, detailed, vibrant colors, professional quality`;
  }
  
  // Add composition hints
  enhanced = `${enhanced}, well-composed, aesthetically pleasing`;
  
  return enhanced;
}

// Detect negative aspects to avoid
function getNegativeGuidance(prompt: string): string {
  return "Avoid: blurry, low quality, distorted, bad anatomy, ugly, poorly drawn, text, watermark, signature";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, size } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.length > 1000) {
      return new Response(JSON.stringify({ error: "Invalid prompt" }), {
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

    // Enhance the prompt for better results
    const enhancedPrompt = enhancePrompt(prompt);
    const negativeGuidance = getNegativeGuidance(prompt);
    
    console.log("Original prompt:", prompt.slice(0, 100));
    console.log("Enhanced prompt:", enhancedPrompt.slice(0, 150));

    // Build the generation instruction
    const generationInstruction = `Create an image with the following description:

${enhancedPrompt}

Important guidelines:
- Focus on the main subject clearly
- Use appealing composition and framing
- Ensure good lighting and contrast
- ${negativeGuidance}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: generationInstruction,
          },
        ],
        modalities: ["image", "text"],
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
      
      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("Image generation response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "Here's your image~";

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      imageUrl, 
      text: textResponse 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
