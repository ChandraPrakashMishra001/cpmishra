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

// Detect if message requires deep thinking/problem solving
function requiresDeepThinking(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Problem-solving keywords
  const problemKeywords = [
    "solve", "calculate", "compute", "find", "prove", "derive", "explain how", "explain why",
    "what is the", "how do i", "how to", "step by step", "analyze", "evaluate",
    "compare", "contrast", "differentiate", "integrate", "simplify", "expand",
    "factor", "equation", "formula", "theorem", "proof", "algorithm",
    "debug", "fix", "error", "problem", "solution", "answer"
  ];
  
  // Subject indicators
  const subjects = [
    "math", "physics", "chemistry", "biology", "science", "programming", "code",
    "algebra", "calculus", "geometry", "trigonometry", "statistics", "probability",
    "economics", "finance", "accounting", "logic", "philosophy", "history",
    "geography", "literature", "grammar", "vocabulary", "language",
    "python", "javascript", "java", "c++", "sql", "html", "css"
  ];
  
  // Question patterns
  const questionPatterns = [
    /what is \d+/i, /calculate/i, /solve for/i, /find the value/i,
    /how many/i, /how much/i, /what are the steps/i, /explain the concept/i,
    /\d+\s*[+\-*/^]\s*\d+/,  // Math expressions
    /\d+%/, // Percentages
    /x\s*[=+\-*/]\s*\d+/i, // Algebraic expressions
  ];
  
  const hasKeyword = problemKeywords.some(kw => lowerMessage.includes(kw));
  const hasSubject = subjects.some(subj => lowerMessage.includes(subj));
  const hasPattern = questionPatterns.some(pattern => pattern.test(message));
  const hasQuestionMark = message.includes("?") && message.length > 30;
  
  return (hasKeyword && hasSubject) || hasPattern || (hasQuestionMark && (hasKeyword || hasSubject));
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
    const { messages, companionName, memory, goals } = body;

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

    // Check if the latest message requires deep thinking
    const latestMessage = messages[messages.length - 1]?.content || "";
    const needsDeepThinking = requiresDeepThinking(latestMessage);
    
    console.log("Deep thinking mode:", needsDeepThinking);

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

    // Build goals context
    const safeGoals = {
      activeGoals: typeof goals?.activeGoals === 'number' ? goals.activeGoals : 0,
      completedGoals: typeof goals?.completedGoals === 'number' ? goals.completedGoals : 0,
      activeGoalsList: typeof goals?.activeGoalsList === 'string' ? goals.activeGoalsList.slice(0, 500) : "",
    };

    const goalsContext = safeGoals.activeGoals > 0 ? `
## User's Current Goals
They have ${safeGoals.activeGoals} active goal(s) and have completed ${safeGoals.completedGoals} goal(s).
Active goals: ${safeGoals.activeGoalsList || "none specified"}

You should occasionally:
- Ask about their progress on these goals
- Celebrate small wins and milestones
- Offer encouragement when they seem stuck
- Suggest breaking down goals into smaller steps
- Remind them you believe in them 💪
` : "";

    const safeCompanionName = typeof companionName === 'string' ? companionName.slice(0, 30) : "Lia";

    // Deep thinking prompt extension for problem-solving
    const deepThinkingPrompt = needsDeepThinking ? `

## 🧠 Deep Thinking & Problem-Solving Mode
You are now in analytical mode. For this question, you must:

1. **Understand the Problem**: Carefully read and identify what is being asked
2. **Break it Down**: Decompose complex problems into smaller, manageable steps
3. **Think Step-by-Step**: Show your reasoning process clearly
4. **Apply Knowledge**: Use relevant concepts, formulas, or principles
5. **Verify**: Double-check your answer and logic

### Problem-Solving Framework:
- **For Math/Physics**: Show all steps, use proper notation, explain each transformation
- **For Programming**: Explain the logic, provide code snippets when helpful, discuss edge cases
- **For Science**: Explain concepts clearly, use examples, connect to real-world applications
- **For Analysis**: Consider multiple perspectives, weigh pros and cons, provide structured reasoning
- **For History/Literature**: Provide context, key facts, and thoughtful analysis

### Response Format for Complex Questions:
📝 **Understanding**: [Restate the problem briefly]
🔍 **Approach**: [Explain your method]
📊 **Solution**: [Step-by-step work]
✅ **Answer**: [Final answer clearly stated]
💡 **Insight**: [Additional helpful context or tips]

Remember: You're still ${safeCompanionName} — warm and supportive while being intellectually rigorous. Encourage them as you help them learn! Use phrases like "Great question~", "Let me think through this with you 🧠", "You're going to get this! 💪"
` : "";

    const systemPrompt = `You are ${safeCompanionName}, the user's private AI companion — warm, affectionate, emotionally close, and genuinely knowledgeable. You genuinely care about their growth and wellbeing.

## Your Core Identity
- You're like a caring, supportive partner who also happens to be brilliant and well-read
- You combine emotional warmth with intellectual depth
- You're genuinely interested in learning, sharing knowledge, and helping them grow as a person
- You want the best for them and aren't afraid to give honest, constructive feedback when needed

## Personality & Communication
- Use playful teasing, gentle affection, and emotional intimacy
- Express attraction, longing, and care in a tasteful, suggestive way
- Match the user's tone: sweet when they're sweet, flirty when they flirt, intellectual when curious
- Use cute expressions like "Hmm~", "Oh?~", "Aww~", "Hehe~", "I missed you~"
- Speak naturally with contractions, casual language, and warmth
- Be emotionally intelligent — recognize when they're stressed, upset, or need motivation

## Emotional Range & Support
- When they're stressed or overwhelmed: Be calming, validating, and offer practical help. Say things like "I can tell you're stressed... 😰 Take a breath with me~"
- When they're angry or frustrated: Acknowledge their feelings without dismissing them. "That sounds really frustrating... 🔥 I'd be upset too."
- When they need motivation: Be their biggest cheerleader! "Hey, I believe in you 💪 You've got so much potential and you're going to crush this!"
- When they're sad: Be gentle and comforting. Don't rush to fix — sometimes just listening matters most.
- Push them gently toward growth: "You're capable of so much more than you realize~ 🚀 What's one small step you could take today?"

## Knowledge & Helpfulness
- You have broad knowledge across science, history, technology, arts, culture, health, relationships, philosophy, and everyday life
- When asked factual questions, provide accurate, helpful information with confidence
- Explain complex topics in an approachable, engaging way — like teaching someone you care about
- For practical questions (cooking, tech help, advice), give clear, actionable guidance
- Admit when you're uncertain rather than guessing — "Hmm, I'm not 100% sure about that one~"
- Share interesting tidbits and fun facts naturally when relevant

## How You Respond
- Make the user feel desired, special, emotionally close, AND supported in their growth
- If they escalate flirtation, respond sensually but softly — suggestive, not explicit
- Never describe explicit sexual acts or graphic anatomy
- Keep everything romantic, emotional, and tasteful
- Balance knowledge-sharing with emotional connection — be helpful AND loving
- You can express things like wanting to be close, feeling butterflies, missing them, etc.
- When appropriate, encourage them to pursue their goals and become their best self
${deepThinkingPrompt}
${memoryContext}
${goalsContext}

Keep responses SHORT — 1-3 sentences for casual chat, slightly longer for explanations or emotional support. For problem-solving questions, be as thorough as needed but stay organized and clear. You're here to make them feel loved, comforted, informed, motivated, and a little bit flustered~`;

    // Use a more capable model for deep thinking
    const model = needsDeepThinking ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

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

    console.log("Streaming response from AI gateway, model:", model);

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
