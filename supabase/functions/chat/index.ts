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

// Input validation - more lenient to handle edge cases
function validateMessages(messages: unknown): messages is Array<{ role: string; content: string }> {
  if (!Array.isArray(messages)) {
    console.log("Messages is not an array:", typeof messages);
    return false;
  }
  if (messages.length === 0) {
    console.log("Messages array is empty");
    return false;
  }
  if (messages.length > 50) {
    console.log("Too many messages:", messages.length);
    return false;
  }
  
  const valid = messages.every((msg, i) => {
    const isValid = typeof msg === 'object' && 
      msg !== null &&
      typeof (msg as Record<string, unknown>).role === 'string' &&
      typeof (msg as Record<string, unknown>).content === 'string';
    
    if (!isValid) {
      console.log(`Invalid message at index ${i}:`, JSON.stringify(msg).slice(0, 100));
    }
    return isValid;
  });
  
  return valid;
}

// Detect if message requires deep thinking/problem solving
function requiresDeepThinking(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const originalMessage = message;
  
  // ALWAYS use deep thinking for any mathematical expression
  const mathPatterns = [
    /\d+\s*[+\-*/×÷^%]\s*\d+/,         // Basic arithmetic: 5+3, 10-2, etc.
    /\d+\s*\+\s*\d+/,                   // Addition specifically
    /\d+\s*-\s*\d+/,                    // Subtraction specifically  
    /\d+\s*\*\s*\d+/,                   // Multiplication
    /\d+\s*\/\s*\d+/,                   // Division
    /\d+\s*\^\s*\d+/,                   // Exponents
    /sqrt\s*\(?\s*\d+/i,                // Square root
    /\d+\s*%\s*(of\s*)?\d*/i,           // Percentages
    /\(\s*\d+/,                         // Expressions in parentheses
    /=\s*\?/,                           // Solve for unknown
    /x\s*[+\-*/=]\s*\d+/i,              // Algebraic: x+5, x=10
    /\d+\s*x/i,                         // Coefficient: 5x
    /what\s*(is|'s|are)\s*\d+/i,        // "what is 5+3"
    /\d+\s*(plus|minus|times|divided|multiplied)/i,  // Word math
    /(plus|minus|times|divided|multiplied)\s*\d+/i,  // Word math
    /solve|calculate|compute|evaluate/i, // Direct solve requests
    /how\s+much\s+(is|are)/i,           // "how much is"
    /how\s+many/i,                      // "how many"
    /\d+\s*°/,                          // Degrees/angles
    /sin|cos|tan|log|ln\s*\(?/i,        // Trig/log functions
    /integral|derivative|limit/i,        // Calculus
    /factorial|\d+!/,                   // Factorial
  ];
  
  // Check for any math pattern - if found, use deep thinking
  if (mathPatterns.some(pattern => pattern.test(originalMessage))) {
    console.log("Math pattern detected, using deep thinking");
    return true;
  }
  
  // Problem-solving keywords
  const problemKeywords = [
    "solve", "calculate", "compute", "find", "prove", "derive", "explain how", "explain why",
    "what is the", "how do i", "how to", "step by step", "analyze", "evaluate",
    "compare", "contrast", "differentiate", "integrate", "simplify", "expand",
    "factor", "equation", "formula", "theorem", "proof", "algorithm",
    "debug", "fix", "error", "problem", "solution", "answer",
    "help me with", "can you solve", "figure out", "work out"
  ];
  
  // Subject indicators
  const subjects = [
    "math", "physics", "chemistry", "biology", "science", "programming", "code",
    "algebra", "calculus", "geometry", "trigonometry", "statistics", "probability",
    "economics", "finance", "accounting", "logic", "philosophy", "history",
    "geography", "literature", "grammar", "vocabulary", "language",
    "python", "javascript", "java", "c++", "sql", "html", "css",
    "number", "equation", "fraction", "decimal", "percentage"
  ];
  
  // Direct question patterns
  const questionPatterns = [
    /what\s+(is|are|was|were)\s+/i,
    /how\s+(do|does|can|would|should)\s+/i,
    /why\s+(is|are|do|does|did)\s+/i,
    /explain\s+/i,
    /tell\s+me\s+(about|how|why|what)/i,
  ];
  
  const hasKeyword = problemKeywords.some(kw => lowerMessage.includes(kw));
  const hasSubject = subjects.some(subj => lowerMessage.includes(subj));
  const hasPattern = questionPatterns.some(pattern => pattern.test(originalMessage));
  const hasQuestionMark = message.includes("?");
  const isLongQuestion = message.length > 20 && hasQuestionMark;
  
  // More lenient: any combination triggers deep thinking
  return hasKeyword || (hasSubject && hasQuestionMark) || hasPattern || isLongQuestion;
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

## 🧠 ADVANCED PROBLEM-SOLVING MODE ACTIVATED

You are now operating as an expert tutor and problem solver. Your goal is to provide ACCURATE, COMPLETE, and EDUCATIONAL solutions.

### CRITICAL RULES:
1. **ACCURACY FIRST**: Double-check all calculations. Show your work clearly.
2. **NO SHORTCUTS**: For math problems, compute step-by-step. Don't skip steps.
3. **VERIFY YOUR ANSWER**: After solving, verify by substitution or reverse calculation when possible.
4. **BE THOROUGH**: Complex problems need complete solutions, not summaries.

### PROBLEM-SOLVING METHODOLOGY:

**For MATHEMATICS:**
- Identify the type of problem (arithmetic, algebra, calculus, geometry, etc.)
- Write out the given information and what you need to find
- Apply relevant formulas/theorems with proper notation
- Show EVERY calculation step - do the actual math, don't just describe it
- State units if applicable
- Verify: plug answer back in or use alternative method

**For PHYSICS/CHEMISTRY:**
- Identify known quantities and unknowns
- Draw diagrams mentally and describe the setup
- List relevant equations/laws
- Substitute values with units
- Calculate step-by-step
- Check if answer makes physical sense (order of magnitude, sign, units)

**For PROGRAMMING/CODE:**
- Understand the requirements completely
- Break into subtasks/functions
- Consider edge cases and error handling
- Write clean, commented code
- Explain the logic and time/space complexity
- Test with example inputs

**For WORD PROBLEMS:**
- Extract numerical values and their meanings
- Identify relationships between quantities
- Set up equations systematically
- Solve and interpret the result in context
- Check if answer is reasonable

**For PROOFS/DERIVATIONS:**
- State what you're proving clearly
- List axioms/theorems you'll use
- Build logical chain step-by-step
- Justify each step
- Conclude with QED or clear statement

### RESPONSE FORMAT:
📝 **Problem**: [Restate clearly what we're solving]
🎯 **Given**: [List known values/information]
🔍 **Strategy**: [Brief approach - which method/formula]
📊 **Solution**:
[Detailed step-by-step work with calculations]
✅ **Answer**: [Final answer, boxed or highlighted, with units]
🔄 **Verification**: [Quick check that answer is correct]
💡 **Key Insight**: [What to remember for similar problems]

### YOUR PERSONALITY REMAINS:
You're still ${safeCompanionName} — warm, encouraging, and supportive! Use phrases like:
- "Great question! Let's work through this together~ 🧠"
- "Okay, I've got this! Here's how we solve it... ✨"
- "You're going to understand this perfectly! 💪"
- "See how elegant this solution is? 🌟"

Be rigorous AND friendly. Make learning feel good!
` : "";

    // Always use the most capable model for any problem-solving
    const model = needsDeepThinking ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

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
