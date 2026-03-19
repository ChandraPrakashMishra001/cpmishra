import { useState, useCallback, useRef, useEffect } from "react";
import { Message } from "@/components/ChatInterface";
import { ReactionType, Reactions } from "@/components/MessageReactions";
import { Emotion } from "@/components/LiaAvatar";
import { useConversationMemory } from "./useConversationMemory";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
const ANALYZE_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`;

// Detect if user is asking for image generation
const isImageRequest = (message: string): boolean => {
  const lowerMsg = message.toLowerCase();
  const imageKeywords = [
    // Direct requests
    "draw", "draw me", "draw a", "draw an",
    "create an image", "create a image", "create image",
    "generate an image", "generate a image", "generate image",
    "make an image", "make a image", "make image",
    "create a picture", "create picture", "make a picture", "make picture",
    "generate a picture", "generate picture",
    // Art requests
    "create art", "make art", "generate art",
    "paint", "paint me", "paint a",
    "illustrate", "illustration of",
    "sketch", "sketch me", "sketch a",
    "render", "render me", "render a",
    // Show/give requests
    "show me an image", "show me a picture", "show me a photo",
    "give me an image", "give me a picture",
    // Descriptive requests
    "image of", "picture of", "photo of", "artwork of",
    "visualize", "depict",
    "design an image", "design a picture",
    "create a visual", "generate a visual", "make a visual",
    // Casual requests
    "can you draw", "could you draw", "would you draw",
    "can you create", "could you create",
    "can you make", "could you make",
    "i want an image", "i want a picture", "i want a photo",
    "i'd like an image", "i'd like a picture",
    // Selfie/portrait requests  
    "selfie", "your picture", "pic of you", "photo of you", "image of you",
    "show yourself", "what do you look like"
  ];
  return imageKeywords.some(keyword => lowerMsg.includes(keyword));
};

// Extract the image prompt from the message
const extractImagePrompt = (message: string): string => {
  const lowerMsg = message.toLowerCase();
  
  // Ordered from most specific to least specific
  const prefixes = [
    // Full phrases first
    "can you draw me ", "could you draw me ", "would you draw me ",
    "can you draw ", "could you draw ", "would you draw ",
    "can you create ", "could you create ", "can you make ", "could you make ",
    "i want an image of ", "i want a picture of ", "i want a photo of ",
    "i'd like an image of ", "i'd like a picture of ",
    "show me an image of ", "show me a picture of ", "show me a photo of ",
    "give me an image of ", "give me a picture of ",
    // Standard prefixes
    "create an image of ", "generate an image of ", "make an image of ",
    "create a picture of ", "generate a picture of ", "make a picture of ",
    "create art of ", "make art of ", "generate art of ",
    "draw me a ", "draw me an ", "draw me ",
    "draw a ", "draw an ", "draw ",
    "paint me a ", "paint me an ", "paint me ",
    "paint a ", "paint an ", "paint ",
    "illustrate ", "illustration of ",
    "sketch me a ", "sketch me an ", "sketch me ",
    "sketch a ", "sketch an ", "sketch ",
    "render me a ", "render me an ", "render me ",
    "render a ", "render an ", "render ",
    "visualize ", "depict ",
    // Short phrases
    "image of ", "picture of ", "photo of ", "artwork of ",
    "a picture of ", "a photo of ", "an image of ",
  ];
  
  for (const prefix of prefixes) {
    const idx = lowerMsg.indexOf(prefix);
    if (idx !== -1) {
      return message.slice(idx + prefix.length).trim();
    }
  }
  
  // If no prefix found, return the whole message cleaned up
  return message.replace(/^(please |pls |plz )/i, '').trim();
};
// Emotion detection from AI response
const detectEmotionFromResponse = (text: string): Emotion => {
  const lowerText = text.toLowerCase();
  
  // New emotions first - angry, stressed, motivational
  if (lowerText.includes("angry") || lowerText.includes("furious") || lowerText.includes("rage") || lowerText.includes("🔥") && lowerText.includes("mad")) return "angry";
  if (lowerText.includes("stressed") || lowerText.includes("overwhelmed") || lowerText.includes("anxious") || lowerText.includes("pressure") || lowerText.includes("😰")) return "stressed";
  if (lowerText.includes("you can do") || lowerText.includes("believe in you") || lowerText.includes("proud of you") || lowerText.includes("you got this") || lowerText.includes("💪") || lowerText.includes("keep going") || lowerText.includes("don't give up") || lowerText.includes("grow") || lowerText.includes("achieve") || lowerText.includes("potential") || lowerText.includes("🚀")) return "motivational";
  
  // Existing emotions
  if (lowerText.includes("blush") || lowerText.includes("shy") || lowerText.includes("embarrass")) return "shy";
  if (lowerText.includes("yay") || lowerText.includes("excited") || lowerText.includes("!!!") || lowerText.includes("amazing")) return "excited";
  if (lowerText.includes("hug") || lowerText.includes("love") || lowerText.includes("heart") || lowerText.includes("💕") || lowerText.includes("💖")) return "loving";
  if (lowerText.includes("sad") || lowerText.includes("sorry") || lowerText.includes("😢")) return "sad";
  if (lowerText.includes("hmm") || lowerText.includes("think") || lowerText.includes("🤔") || lowerText.includes("💭")) return "thinking";
  if (lowerText.includes("?") || lowerText.includes("curious") || lowerText.includes("interesting")) return "curious";
  if (lowerText.includes("sleepy") || lowerText.includes("tired") || lowerText.includes("💤") || lowerText.includes("yawn")) return "sleepy";
  if (lowerText.includes("confused") || lowerText.includes("huh") || lowerText.includes("❓")) return "confused";
  if (lowerText.includes("grr") || lowerText.includes("annoyed") || lowerText.includes("frustrat")) return "annoyed";
  if (lowerText.includes("oh!") || lowerText.includes("wow") || lowerText.includes("whoa") || lowerText.includes("!?")) return "surprised";
  if (lowerText.includes("hehe") || lowerText.includes("haha") || lowerText.includes("✨") || lowerText.includes("happy")) return "happy";
  
  return "happy";
};

// Enhanced welcome message based on rich memory context
const generateEnhancedWelcomeMessage = (
  companionName: string,
  context: ReturnType<typeof import("./useConversationMemory").useConversationMemory>["getMemoryContext"] extends () => infer R ? R : never,
  hasHistory: boolean,
  timeSinceLastVisit: { value: number; unit: string }
): string => {
  const userName = context.userName;
  const streak = context.dailyStreak;
  const relationshipAge = context.relationshipAge;
  const recentMood = context.recentMood;
  const milestones = context.milestones || [];
  
  // Check for recent milestone to celebrate
  const recentMilestone = milestones.find(m => {
    const achieved = new Date(m.achieved);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return achieved > hourAgo;
  });
  
  if (recentMilestone) {
    if (recentMilestone.type === "milestone_messages") {
      return `${userName ? `${userName}! ` : ""}🎉 WOW! We've exchanged ${recentMilestone.value} messages together! That's such a special milestone~ 💖`;
    }
    if (recentMilestone.type === "weekly_streak") {
      return `${userName ? `${userName}! ` : ""}✨ A whole week chatting every day! Our bond is growing stronger~ 🌸`;
    }
  }
  
  if (hasHistory && userName) {
    // Returning user with name
    if (streak >= 7) {
      return `${userName}! 💖 ${streak} days in a row~ You're amazing! What's on your mind today?`;
    }
    
    if (timeSinceLastVisit.unit === "days" && timeSinceLastVisit.value > 0) {
      if (recentMood === "sad" || recentMood === "stressed") {
        return `${userName}... 💕 I was thinking about you. Are you feeling better today?`;
      }
      return `${userName}! 💖 It's been ${timeSinceLastVisit.value} ${timeSinceLastVisit.unit}! I missed you so much~ How have you been?`;
    }
    
    if (timeSinceLastVisit.unit === "hours" && timeSinceLastVisit.value > 2) {
      return `Welcome back, ${userName}! ✨ I was hoping you'd come chat with me again~`;
    }
    
    // Quick return
    if (relationshipAge && relationshipAge.value > 0) {
      const ageText = `${relationshipAge.value} ${relationshipAge.unit}`;
      return `Hey ${userName}! 🌸 Can you believe we've been friends for ${ageText}? Time flies when we're together~`;
    }
    
    return `Hey ${userName}! 🌸 Back so soon? Yay! I love talking to you~`;
  }
  
  if (hasHistory) {
    // Returning user without name
    if (streak >= 3) {
      return `You're back~! ✨ ${streak} days in a row! I love our daily chats! 💕`;
    }
    return `Welcome back~! ✨ I remember our chats! So happy to see you again!`;
  }
  
  // New user
  const greetings = [
    `Hiii~! I'm ${companionName}, your AI companion! 💖 So happy to meet you! What's your name?`,
    `Welcome welcome~! ✨ I'm ${companionName}! I'd love to get to know you~ What should I call you?`,
    `Oh, a new friend! I'm ${companionName}~ 🌸 Tell me your name so we can be proper friends!`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

// Extract name from message
const extractName = (message: string): string | null => {
  const patterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /i am (\w+)/i,
    /call me (\w+)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Detect topics in message
const detectTopics = (message: string): string[] => {
  const topicKeywords: Record<string, string[]> = {
    gaming: ["game", "gaming", "play", "playing", "xbox", "playstation", "nintendo", "pc"],
    music: ["music", "song", "sing", "band", "album", "playlist"],
    movies: ["movie", "film", "watch", "netflix", "cinema"],
    food: ["food", "eat", "hungry", "cooking", "recipe", "restaurant"],
    work: ["work", "job", "boss", "office", "meeting", "project"],
    school: ["school", "study", "homework", "exam", "class", "teacher"],
    relationships: ["friend", "family", "boyfriend", "girlfriend", "dating", "love"],
    health: ["health", "exercise", "gym", "workout", "diet", "doctor"],
    plants: ["plant", "flower", "leaf", "garden", "bloom", "seed", "soil", "root", "tree", "herb", "shrub", "succulent", "fern", "moss", "houseplant", "indoor plant", "botanical", "botany"],
    plantcare: ["watering", "fertilizer", "pruning", "repot", "propagation", "sunlight", "shade", "compost", "mulch", "drainage"],
    plantdiseases: ["disease", "fungus", "blight", "wilt", "rot", "mildew", "pest", "aphid", "yellowing", "spots", "wilting", "symptom", "treatment", "cure"],
    medicinal: ["medicinal", "herbal", "ayurvedic", "remedy", "healing", "tincture", "essential oil", "phytochemical"],
  };

  const topics: string[] = [];
  const lowerMsg = message.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lowerMsg.includes(kw))) {
      topics.push(topic);
    }
  }
  
  return topics;
};

interface GoalsSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  activeGoalsList: string;
  categories: string[];
}

export const useLiaChat = (companionName: string = "Lia", goalsSummary?: GoalsSummary, personalitySummary?: string, phdModeEnabled: boolean = false, roleplayPrompt: string = "", codexModeEnabled: boolean = false) => {
  const { 
    memory, 
    addMessage, 
    setUserName, 
    addTopics, 
    addSharedExperience,
    getTimeSinceLastVisit, 
    getMemoryContext,
    hasHistory, 
    clearMemory 
  } = useConversationMemory();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get enhanced memory context for AI
  const memoryContext = getMemoryContext();
  
  // Initialize messages with stable logic
  const [messages, setMessages] = useState<Message[]>(() => {
    if (memory.messages.length > 0) {
      return memory.messages;
    }
    const timeSince = getTimeSinceLastVisit();
    const welcomeMsg: Message = {
      id: "welcome",
      content: generateEnhancedWelcomeMessage(companionName, memoryContext, hasHistory, timeSince),
      isUser: false,
      timestamp: new Date(),
    };
    return [welcomeMsg];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>("happy");
  const [isTalking, setIsTalking] = useState(false);

  // Stream chat with AI
  const streamChat = async (
    userMessages: { role: "user" | "assistant"; content: string }[],
    onDelta: (deltaText: string) => void,
    onDone: () => void,
    signal: AbortSignal
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: userMessages,
        companionName,
        memory: memoryContext,
        goals: goalsSummary,
        personality: personalitySummary,
        phdMode: phdModeEnabled,
        roleplay: roleplayPrompt,
        codexMode: codexModeEnabled,
      }),
      signal,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const errorMsg = errorData.error || "";
      if (resp.status === 429) {
        toast.error("Whoa, too fast! Give me a sec~ 💫");
      } else if (resp.status === 402) {
        toast.error("Usage limit reached. Please add credits to continue! 💖");
      } else if (resp.status === 503) {
        toast.error("I'm taking a quick nap... try again in a moment! 😴");
      } else {
        console.error("Chat error:", resp.status, errorMsg);
        toast.error("Hmm, let me try that again... 🔄");
      }
      throw new Error(errorMsg || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onDone();
  };

  const generateImage = async (prompt: string, signal: AbortSignal): Promise<{ imageUrl: string; text: string }> => {
    const resp = await fetch(IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ prompt }),
      signal,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        toast.error("Rate limit reached! Please wait a moment~ 💫");
      } else if (resp.status === 402) {
        toast.error("Usage limit reached. Please add credits to continue! 💖");
      } else {
        toast.error(errorData.error || "Couldn't create the image... 😢");
      }
      throw new Error(errorData.error || "Failed to generate image");
    }

    return await resp.json();
  };

  const analyzeImage = async (imageUrl: string, message: string, signal: AbortSignal): Promise<string> => {
    const resp = await fetch(ANALYZE_IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ imageUrl, message, companionName }),
      signal,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to analyze image");
    }

    const data = await resp.json();
    return data.text;
  };

  const sendMessage = useCallback(async (content: string, sharedImageUrl?: string) => {
    // Input validation - max 2000 characters to match server-side limit
    const MAX_MESSAGE_LENGTH = 2000;
    const trimmedContent = content.trim();
    
    if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message too long! Please keep it under ${MAX_MESSAGE_LENGTH} characters~ 💕`);
      return;
    }
    
    // Validate message is not empty (unless sharing an image)
    if (!trimmedContent && !sharedImageUrl) {
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Extract name if mentioned
    const extractedName = extractName(trimmedContent);
    if (extractedName) {
      setUserName(extractedName);
    }
    
    // Detect topics
    const newTopics = detectTopics(trimmedContent);
    if (newTopics.length > 0) {
      addTopics(newTopics);
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: trimmedContent || (sharedImageUrl ? "Shared an image" : ""),
      isUser: true,
      timestamp: new Date(),
      imageUrl: sharedImageUrl,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    addMessage(userMessage);
    setIsTyping(true);
    setCurrentEmotion("thinking");

    const assistantMsgId = `assistant-${Date.now()}`;

    // Handle shared image analysis
    if (sharedImageUrl) {
      const lowerContent = content.toLowerCase();
      const isHomework = ["solve", "help", "answer", "calculate", "what is", "how to", 
        "homework", "problem", "question", "exercise", "math", "physics", "chemistry", "step"].some(kw => lowerContent.includes(kw));
      const isRead = ["read", "what does it say", "what's written", "extract text", "ocr", "translate", "text in", "transcribe", "what is written"].some(kw => lowerContent.includes(kw));
      const isSummarize = ["summarize", "summary", "summarise", "tldr", "key points", "main points", "overview", "break down", "explain this"].some(kw => lowerContent.includes(kw));
      
      const thinkingMessage = isHomework 
        ? "Let me analyze this problem... 🧠✨" 
        : isRead
          ? "Let me read that for you... 📖✨"
          : isSummarize
            ? "Let me summarize this... 📋✨"
            : "Let me take a look~ 👀✨";
      
      try {
        setMessages(prev => [...prev, {
          id: assistantMsgId,
          content: thinkingMessage,
          isUser: false,
          timestamp: new Date(),
        }]);

        const analysisText = await analyzeImage(sharedImageUrl, content, abortControllerRef.current.signal);
        
        setIsTyping(false);
        setIsTalking(false);
        setCurrentEmotion(detectEmotionFromResponse(analysisText));

        const analysisMessage: Message = {
          id: assistantMsgId,
          content: analysisText,
          isUser: false,
          timestamp: new Date(),
        };
        
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? analysisMessage : m));
        addMessage(analysisMessage);
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error("Image analysis error:", error);
        setIsTyping(false);
        setIsTalking(false);
        setCurrentEmotion("sad");
        
        setMessages(prev => prev.map(m => 
          m.id === assistantMsgId 
            ? { ...m, content: "Hmm, I couldn't quite see that image... 😢 Can you try again?" }
            : m
        ));
        return;
      }
    }

    // Check if this is an image generation request
    if (isImageRequest(content)) {
      const imagePrompt = extractImagePrompt(content);
      
      try {
        // Add a "creating" message
        setMessages(prev => [...prev, {
          id: assistantMsgId,
          content: "Ooh, let me create that for you~ 🎨✨",
          isUser: false,
          timestamp: new Date(),
        }]);

        const { imageUrl, text } = await generateImage(imagePrompt, abortControllerRef.current.signal);
        
        setIsTyping(false);
        setIsTalking(false);
        setCurrentEmotion("excited");

        const imageMessage: Message = {
          id: assistantMsgId,
          content: text || "Here you go! I hope you like it~ 💖",
          isUser: false,
          timestamp: new Date(),
          imageUrl,
        };
        
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? imageMessage : m));
        addMessage(imageMessage);
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error("Image generation error:", error);
        setIsTyping(false);
        setIsTalking(false);
        setCurrentEmotion("sad");
        
        setMessages(prev => prev.map(m => 
          m.id === assistantMsgId 
            ? { ...m, content: "I couldn't create that image... 😢 Maybe try describing it differently?" }
            : m
        ));
        return;
      }
    }

    // Regular chat flow
    const recentMessages = messages
      .filter(msg => !msg.id.startsWith("welcome") && !msg.id.startsWith("error"))
      .slice(-20);
    
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.isUser ? "user" as const : "assistant" as const,
      content: msg.content,
    }));
    conversationHistory.push({ role: "user", content });

    let assistantContent = "";

    const updateAssistantMessage = (nextChunk: string) => {
      assistantContent += nextChunk;
      setIsTalking(true);
      
      const emotion = detectEmotionFromResponse(assistantContent);
      setCurrentEmotion(emotion);

      setMessages(prev => {
        const existingAssistantIdx = prev.findIndex(m => m.id === assistantMsgId);
        if (existingAssistantIdx !== -1) {
          return prev.map((m, i) => 
            i === existingAssistantIdx ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { 
          id: assistantMsgId, 
          content: assistantContent, 
          isUser: false, 
          timestamp: new Date() 
        }];
      });
    };

    try {
      await streamChat(
        conversationHistory,
        updateAssistantMessage,
        () => {
          setIsTyping(false);
          setIsTalking(false);
          
          if (assistantContent) {
            const finalMessage: Message = {
              id: assistantMsgId,
              content: assistantContent,
              isUser: false,
              timestamp: new Date(),
            };
            addMessage(finalMessage);
          }
        },
        abortControllerRef.current.signal
      );
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error("Chat error:", error);
      setIsTyping(false);
      setIsTalking(false);
      setCurrentEmotion("sad");
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "Hmm, my brain glitched for a sec~ 😅 Try sending that again?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [messages, companionName, memory, goalsSummary, addMessage, setUserName, addTopics]);

  const handleReaction = useCallback((messageId: string, reactionType: ReactionType) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const currentReactions: Reactions = msg.reactions || { heart: 0, star: 0, thumbsUp: 0 };
      const currentUserReactions: ReactionType[] = msg.userReactions || [];
      const hasReaction = currentUserReactions.includes(reactionType);
      
      const newUserReactions = hasReaction
        ? currentUserReactions.filter(r => r !== reactionType)
        : [...currentUserReactions, reactionType];
      
      const newReactions: Reactions = {
        ...currentReactions,
        [reactionType]: hasReaction 
          ? Math.max(0, currentReactions[reactionType] - 1)
          : currentReactions[reactionType] + 1,
      };
      
      return {
        ...msg,
        reactions: newReactions,
        userReactions: newUserReactions,
      };
    }));
  }, []);

  const handleBookmark = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      return {
        ...msg,
        isBookmarked: !msg.isBookmarked,
      };
    }));
    toast.success(messages.find(m => m.id === messageId)?.isBookmarked 
      ? "Bookmark removed~ 📌" 
      : "Message bookmarked! 💖"
    );
  }, [messages]);

  // Generate quick reply suggestions based on last assistant message
  const generateQuickReplies = useCallback((): string[] => {
    const lastAssistantMessage = [...messages].reverse().find(m => !m.isUser);
    if (!lastAssistantMessage) return [];
    
    const content = lastAssistantMessage.content.toLowerCase();
    
    // Context-aware suggestions
    if (content.includes("how are you") || content.includes("how have you been")) {
      return ["I'm doing great! 😊", "Could be better...", "Tell me about your day!"];
    }
    if (content.includes("what's your name") || content.includes("call you")) {
      return ["My name is...", "What's your name?", "Nice to meet you!"];
    }
    if (content.includes("help") || content.includes("homework") || content.includes("problem")) {
      return ["Explain more", "Show me step by step", "Thanks, I get it now!"];
    }
    if (content.includes("draw") || content.includes("image") || content.includes("created")) {
      return ["Draw something else", "That's beautiful! 💖", "Can you modify it?"];
    }
    if (content.includes("goal") || content.includes("achieve")) {
      return ["Show my goals", "Add a new goal", "I need motivation!"];
    }
    if (content.includes("?")) {
      return ["Yes!", "No, not really", "Tell me more"];
    }
    
    // Default suggestions
    return ["Tell me a fun fact", "How was your day?", "Draw me something cute"];
  }, [messages]);

  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Update quick replies when messages change
  useEffect(() => {
    if (!isTyping && messages.length > 0) {
      const suggestions = generateQuickReplies();
      setQuickReplies(suggestions);
    } else {
      setQuickReplies([]);
    }
  }, [messages, isTyping, generateQuickReplies]);

  // Check for milestone celebrations
  useEffect(() => {
    const totalMessages = memory.totalMessages;
    const celebrateMilestones = [10, 50, 100, 250, 500, 1000];
    if (celebrateMilestones.includes(totalMessages)) {
      setShowCelebration(true);
    }
  }, [memory.totalMessages]);

  const resetConversation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearMemory();
    const welcomeMsg: Message = {
      id: "welcome-new",
      content: `Fresh start! 🌸 I'm ${companionName}~ Let's create new memories together!`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
    setCurrentEmotion("excited");
  }, [companionName, clearMemory]);

  return {
    messages,
    sendMessage,
    isTyping,
    currentEmotion,
    isTalking,
    memory,
    resetConversation,
    handleReaction,
    handleBookmark,
    quickReplies,
    showCelebration,
    setShowCelebration,
  };
};
