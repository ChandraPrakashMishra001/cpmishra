import { useState, useCallback, useRef, useEffect } from "react";
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

export const useLiaChat = (companionName: string = "Lia") => {
  const { memory, addMessage, setUserName, addTopics, getTimeSinceLastVisit, hasHistory, clearMemory } = useConversationMemory();
  
  const getWelcomeMessage = () => {
    const timeSince = getTimeSinceLastVisit();
    
    if (hasHistory && memory.userName) {
      if (timeSince.unit === "days" && timeSince.value > 0) {
        return `${memory.userName}! 💖 It's been ${timeSince.value} ${timeSince.unit}! I missed you so much~ How have you been?`;
      }
      if (timeSince.unit === "hours" && timeSince.value > 2) {
        return `Welcome back, ${memory.userName}! ✨ I was hoping you'd come chat with me again~`;
      }
      return `Hey ${memory.userName}! 🌸 Back so soon? Yay! I love talking to you~`;
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

  const [messages, setMessages] = useState<Message[]>(() => {
    // Load from memory if available
    if (memory.messages.length > 0) {
      return memory.messages;
    }
    // Otherwise start with welcome
    const welcomeMsg: Message = {
      id: "welcome",
      content: getWelcomeMessage(),
      isUser: false,
      timestamp: new Date(),
    };
    return [welcomeMsg];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>("happy");
  const [isTalking, setIsTalking] = useState(false);

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
    const topicKeywords = {
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

  // Stream chat with AI
  const streamChat = async (
    userMessages: { role: "user" | "assistant"; content: string }[],
    onDelta: (deltaText: string) => void,
    onDone: () => void
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
    let streamDone = false;

    while (!streamDone) {
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
          streamDone = true;
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

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  };

  const sendMessage = useCallback(async (content: string) => {
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

    // Build conversation history for AI (last 10 messages for context)
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.isUser ? "user" as const : "assistant" as const,
      content: msg.content,
    }));
    conversationHistory.push({ role: "user", content });

    let assistantContent = "";

    const upsertAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      setIsTalking(true);
      
      // Update emotion based on content
      const emotion = detectEmotionFromResponse(assistantContent);
      setCurrentEmotion(emotion);

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && !last.isUser) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { 
          id: `assistant-${Date.now()}`, 
          content: assistantContent, 
          isUser: false, 
          timestamp: new Date() 
        }];
      });
    };

    try {
      await streamChat(
        conversationHistory,
        (chunk) => upsertAssistant(chunk),
        () => {
          setIsTyping(false);
          setIsTalking(false);
          
          // Save final message to memory
          if (assistantContent) {
            const finalMessage: Message = {
              id: `assistant-${Date.now()}`,
              content: assistantContent,
              isUser: false,
              timestamp: new Date(),
            };
            addMessage(finalMessage);
          }
        }
      );
    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
      setIsTalking(false);
      setCurrentEmotion("sad");
      
      // Add error message
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
