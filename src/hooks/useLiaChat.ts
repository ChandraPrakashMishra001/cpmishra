import { useState, useCallback, useRef } from "react";
import { Message } from "@/components/ChatInterface";
import { Emotion } from "@/components/LiaAvatar";
import { useConversationMemory } from "./useConversationMemory";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Emotion detection from AI response
const detectEmotionFromResponse = (text: string): Emotion => {
  const lowerText = text.toLowerCase();
  
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

// Generate welcome message based on memory state
const generateWelcomeMessage = (
  companionName: string,
  userName: string | null,
  hasHistory: boolean,
  timeSinceLastVisit: { value: number; unit: string }
): string => {
  if (hasHistory && userName) {
    if (timeSinceLastVisit.unit === "days" && timeSinceLastVisit.value > 0) {
      return `${userName}! 💖 It's been ${timeSinceLastVisit.value} ${timeSinceLastVisit.unit}! I missed you so much~ How have you been?`;
    }
    if (timeSinceLastVisit.unit === "hours" && timeSinceLastVisit.value > 2) {
      return `Welcome back, ${userName}! ✨ I was hoping you'd come chat with me again~`;
    }
    return `Hey ${userName}! 🌸 Back so soon? Yay! I love talking to you~`;
  }
  
  if (hasHistory) {
    return `Welcome back~! ✨ I remember our chats! So happy to see you again!`;
  }
  
  const greetings = [
    `Hiii~! I'm ${companionName}, your AI companion! 💖 So happy to meet you! What's on your mind today?`,
    `Welcome welcome~! ✨ I'm ${companionName}! Let's have a fun chat together, shall we?`,
    `Oh, a new friend! I'm ${companionName}~ 🌸 Tell me everything about yourself!`,
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

export const useLiaChat = (companionName: string = "Lia") => {
  const { memory, addMessage, setUserName, addTopics, getTimeSinceLastVisit, hasHistory, clearMemory } = useConversationMemory();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize messages with stable logic
  const [messages, setMessages] = useState<Message[]>(() => {
    if (memory.messages.length > 0) {
      return memory.messages;
    }
    const timeSince = getTimeSinceLastVisit();
    const welcomeMsg: Message = {
      id: "welcome",
      content: generateWelcomeMessage(companionName, memory.userName, hasHistory, timeSince),
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
        memory: {
          userName: memory.userName,
          topics: memory.topics,
          totalMessages: memory.totalMessages,
        }
      }),
      signal,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        toast.error("Rate limit reached! Please wait a moment~ 💫");
      } else if (resp.status === 402) {
        toast.error("Usage limit reached. Please add credits to continue! 💖");
      } else {
        toast.error(errorData.error || "Something went wrong... 😢");
      }
      throw new Error(errorData.error || "Failed to get response");
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

  const sendMessage = useCallback(async (content: string) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Extract name if mentioned
    const extractedName = extractName(content);
    if (extractedName) {
      setUserName(extractedName);
    }
    
    // Detect topics
    const newTopics = detectTopics(content);
    if (newTopics.length > 0) {
      addTopics(newTopics);
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    addMessage(userMessage);
    setIsTyping(true);
    setCurrentEmotion("thinking");

    // Build conversation history - exclude welcome messages and only keep recent context
    const recentMessages = messages
      .filter(msg => !msg.id.startsWith("welcome") && !msg.id.startsWith("error"))
      .slice(-8);
    
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.isUser ? "user" as const : "assistant" as const,
      content: msg.content,
    }));
    conversationHistory.push({ role: "user", content });

    let assistantContent = "";
    const assistantMsgId = `assistant-${Date.now()}`;

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
        content: "Oh no... Something went wrong! 😢 Can you try again?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [messages, companionName, memory, addMessage, setUserName, addTopics]);

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
  };
};
