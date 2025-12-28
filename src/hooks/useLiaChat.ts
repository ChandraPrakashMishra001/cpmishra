import { useState, useCallback } from "react";
import { Message } from "@/components/ChatInterface";
import { Emotion } from "@/components/LiaAvatar";

// Lia's personality responses (demo mode without AI backend)
const liaResponses = [
  { text: "Hehe, that's so interesting! Tell me more~ ✨", emotion: "happy" as Emotion },
  { text: "Hmm, let me think about that for a moment... 💭", emotion: "thinking" as Emotion },
  { text: "Oh wow, really?! That's amazing! ⭐", emotion: "surprised" as Emotion },
  { text: "I love chatting with you! You always say the coolest things~ 💖", emotion: "happy" as Emotion },
  { text: "Aww, that's so sweet of you to say! *blushes* 🌸", emotion: "happy" as Emotion },
  { text: "Interesting perspective! I never thought of it that way before~", emotion: "thinking" as Emotion },
  { text: "You know what? You're really fun to talk to! ✨", emotion: "happy" as Emotion },
  { text: "Ooh, that gives me an idea! What if we...", emotion: "surprised" as Emotion },
];

const greetings = [
  "Hiii~! I'm Lia, your AI companion! 💖 So happy to meet you! What's on your mind today?",
  "Welcome welcome~! ✨ I'm Lia! Let's have a fun chat together, shall we?",
  "Oh, a new friend! I'm Lia~ 🌸 Tell me everything about yourself!",
];

export const useLiaChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: greetings[Math.floor(Math.random() * greetings.length)],
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>("happy");
  const [isTalking, setIsTalking] = useState(false);

  const analyzeUserMessage = (message: string): Emotion => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes("sad") || lowerMsg.includes("upset") || lowerMsg.includes("sorry")) {
      return "sad";
    }
    if (lowerMsg.includes("?") || lowerMsg.includes("how") || lowerMsg.includes("what") || lowerMsg.includes("why")) {
      return "thinking";
    }
    if (lowerMsg.includes("!") || lowerMsg.includes("wow") || lowerMsg.includes("amazing") || lowerMsg.includes("cool")) {
      return "surprised";
    }
    if (lowerMsg.includes("love") || lowerMsg.includes("happy") || lowerMsg.includes("cute") || lowerMsg.includes("like")) {
      return "happy";
    }
    return "neutral";
  };

  const getLiaResponse = (userEmotion: Emotion): { text: string; emotion: Emotion } => {
    // Filter responses based on context
    if (userEmotion === "sad") {
      return {
        text: "Oh no, I'm sorry to hear that... 💫 I'm here for you! Want to talk about it?",
        emotion: "sad",
      };
    }
    
    return liaResponses[Math.floor(Math.random() * liaResponses.length)];
  };

  const sendMessage = useCallback((content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setCurrentEmotion("thinking");

    // Analyze user emotion
    const userEmotion = analyzeUserMessage(content);

    // Simulate Lia's response delay
    const typingDelay = 1000 + Math.random() * 1500;
    
    setTimeout(() => {
      const response = getLiaResponse(userEmotion);
      setCurrentEmotion(response.emotion);
      setIsTalking(true);

      const liaMessage: Message = {
        id: `lia-${Date.now()}`,
        content: response.text,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, liaMessage]);
      setIsTyping(false);

      // Stop talking animation after message appears
      setTimeout(() => {
        setIsTalking(false);
      }, 2000);
    }, typingDelay);
  }, []);

  return {
    messages,
    sendMessage,
    isTyping,
    currentEmotion,
    isTalking,
  };
};
