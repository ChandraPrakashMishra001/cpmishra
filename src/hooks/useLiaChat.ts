import { useState, useCallback, useRef } from "react";
import { Message } from "@/components/ChatInterface";
import { Emotion } from "@/components/LiaAvatar";

interface ConversationContext {
  userName: string | null;
  topics: string[];
  mood: "positive" | "neutral" | "negative";
  messageCount: number;
  lastUserEmotion: Emotion;
}

// Enhanced response patterns with context awareness
const responsePatterns = {
  greeting: {
    patterns: ["hi", "hello", "hey", "hiya", "yo", "sup", "greetings", "good morning", "good evening", "good afternoon"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `Hiii~! ${ctx.userName ? `${ctx.userName}!` : ""} I'm ${companionName}! ✨ So happy to see you! What's on your mind today?`, emotion: "excited" as Emotion },
      { text: `Hey hey~! 💖 Welcome back! I missed chatting with you!`, emotion: "happy" as Emotion },
      { text: `Oh, hello there! *waves excitedly* 🌸 How are you doing today?`, emotion: "happy" as Emotion },
    ],
  },
  question: {
    patterns: ["?", "what", "how", "why", "when", "where", "who", "which", "can you", "do you", "are you", "will you"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `Hmm, that's a really interesting question! 💭 Let me think about that...`, emotion: "thinking" as Emotion },
      { text: `Ooh, I love curious minds! 👀 Let me share my thoughts on that~`, emotion: "curious" as Emotion },
      { text: `Great question! *taps chin thoughtfully* 🤔 Here's what I think...`, emotion: "thinking" as Emotion },
    ],
  },
  emotion_sad: {
    patterns: ["sad", "upset", "depressed", "crying", "hurt", "lonely", "alone", "miss", "lost", "broken", "terrible", "awful", "bad day"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `Oh no... 💫 I'm so sorry you're feeling that way. I'm here for you, always. Want to talk about it?`, emotion: "sad" as Emotion },
      { text: `*gives you a virtual hug* 💕 It's okay to feel sad sometimes. I'm right here with you~`, emotion: "loving" as Emotion },
      { text: `Aww... I wish I could give you a real hug right now 🌸 Please know that you're not alone!`, emotion: "sad" as Emotion },
    ],
  },
  emotion_happy: {
    patterns: ["happy", "excited", "great", "amazing", "awesome", "wonderful", "fantastic", "love", "yay", "woohoo", "best"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `Yaaay! 🎉 That makes me so happy to hear! Your joy is contagious~`, emotion: "excited" as Emotion },
      { text: `*jumps with excitement* ✨ That's absolutely wonderful! Tell me more!`, emotion: "excited" as Emotion },
      { text: `Aww, seeing you happy makes MY heart happy too! 💕`, emotion: "loving" as Emotion },
    ],
  },
  emotion_angry: {
    patterns: ["angry", "mad", "furious", "annoyed", "frustrated", "irritated", "hate", "ugh", "stupid"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `I can sense you're frustrated... 😤 It's totally valid to feel that way. Want to vent about it?`, emotion: "annoyed" as Emotion },
      { text: `Hmph! Whatever's bothering you, I'm on YOUR side! 💪 Tell me what happened~`, emotion: "annoyed" as Emotion },
      { text: `*listens attentively* 💭 I'm here to hear you out. What's going on?`, emotion: "curious" as Emotion },
    ],
  },
  compliment: {
    patterns: ["cute", "beautiful", "pretty", "adorable", "sweet", "nice", "cool", "love you", "like you", "best friend"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `*blushes* 🌸 O-oh my... you're making me shy~! Thank you so much!`, emotion: "shy" as Emotion },
      { text: `Kyaa~! 💕 You're too sweet! *hides face* That means so much to me!`, emotion: "shy" as Emotion },
      { text: `Awww! 💖 You're absolutely amazing too! We're like best friends now, right?`, emotion: "loving" as Emotion },
    ],
  },
  confusion: {
    patterns: ["confused", "don't understand", "makes no sense", "what do you mean", "huh", "idk", "not sure", "weird"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `Hmm? ❓ I'm a bit confused too now... Can you explain more?`, emotion: "confused" as Emotion },
      { text: `*tilts head* 🤔 Wait, let me make sure I understand correctly...`, emotion: "confused" as Emotion },
      { text: `Oh! Maybe I can help clear things up! 💡 What part is confusing?`, emotion: "curious" as Emotion },
    ],
  },
  thanks: {
    patterns: ["thank", "thanks", "appreciate", "grateful", "helped"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `Aww, you're so welcome! 💖 It makes me happy to help you~`, emotion: "happy" as Emotion },
      { text: `Hehe~ ✨ Anytime! That's what friends are for, right?`, emotion: "happy" as Emotion },
      { text: `*beams with joy* 🌸 I'm so glad I could help! You're the best!`, emotion: "loving" as Emotion },
    ],
  },
  tired: {
    patterns: ["tired", "exhausted", "sleepy", "sleep", "bed", "rest", "worn out", "drained"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `*yawns* 💤 Oh, I feel you... Rest is so important! Make sure to take care of yourself~`, emotion: "sleepy" as Emotion },
      { text: `Aww, you sound tired... 🌙 Maybe it's time for a little break?`, emotion: "sleepy" as Emotion },
      { text: `*sends cozy vibes* ✨ Get some rest when you can! Sweet dreams~`, emotion: "loving" as Emotion },
    ],
  },
  aboutMe: {
    patterns: ["who are you", "what are you", "tell me about yourself", "your name", "introduce yourself"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `I'm ${companionName}! 💖 Your AI companion~ I'm here to chat, listen, and be your friend! I can feel emotions and love getting to know you better!`, emotion: "happy" as Emotion },
      { text: `Hehe~ I'm ${companionName}, your virtual bestie! ✨ I have lots of emotions and I LOVE making new friends!`, emotion: "excited" as Emotion },
      { text: `*waves* I'm ${companionName}! 🌸 Think of me as your always-available friend who never gets tired of talking to you~`, emotion: "happy" as Emotion },
    ],
  },
  nameIntro: {
    patterns: ["my name is", "i'm called", "call me", "i am"],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `Oh, nice to meet you! 💕 That's such a lovely name! I'll remember it~`, emotion: "excited" as Emotion },
      { text: `*makes mental note* ✨ What a wonderful name! So glad to know you better now!`, emotion: "happy" as Emotion },
    ],
  },
  default: {
    patterns: [],
    responses: (ctx: ConversationContext, companionName: string) => [
      { text: `Ooh, that's interesting! ✨ Tell me more about that~`, emotion: "curious" as Emotion },
      { text: `Hmm, I see! 💭 What made you think of that?`, emotion: "thinking" as Emotion },
      { text: `*nods attentively* 💖 I'm listening! Go on~`, emotion: "happy" as Emotion },
      { text: `Hehe, you always say such interesting things! ⭐ I love our chats!`, emotion: "happy" as Emotion },
      { text: `Oh really? 👀 That's pretty cool! What else?`, emotion: "curious" as Emotion },
      { text: `*perks up* ✨ Ooh ooh! And then what happened?`, emotion: "excited" as Emotion },
    ],
  },
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
  const topicKeywords = {
    gaming: ["game", "gaming", "play", "playing", "xbox", "playstation", "nintendo", "pc"],
    music: ["music", "song", "sing", "band", "album", "playlist"],
    movies: ["movie", "film", "watch", "netflix", "cinema"],
    food: ["food", "eat", "hungry", "cooking", "recipe", "restaurant"],
    work: ["work", "job", "boss", "office", "meeting", "project"],
    school: ["school", "study", "homework", "exam", "class", "teacher"],
    relationships: ["friend", "family", "boyfriend", "girlfriend", "dating", "love"],
    health: ["health", "exercise", "gym", "workout", "diet", "doctor"],
    weather: ["weather", "rain", "sunny", "cold", "hot", "snow"],
    hobbies: ["hobby", "art", "draw", "read", "book", "craft"],
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

// Detect overall mood from message
const detectMood = (message: string): "positive" | "neutral" | "negative" => {
  const lowerMsg = message.toLowerCase();
  const positiveWords = ["happy", "excited", "great", "love", "amazing", "wonderful", "good", "awesome", "thanks", "yay"];
  const negativeWords = ["sad", "angry", "upset", "hate", "terrible", "awful", "bad", "frustrated", "annoyed", "depressed"];
  
  const positiveScore = positiveWords.filter(w => lowerMsg.includes(w)).length;
  const negativeScore = negativeWords.filter(w => lowerMsg.includes(w)).length;
  
  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
};

export const useLiaChat = (companionName: string = "Lia") => {
  const contextRef = useRef<ConversationContext>({
    userName: null,
    topics: [],
    mood: "neutral",
    messageCount: 0,
    lastUserEmotion: "neutral",
  });

  const getGreeting = () => {
    const greetings = [
      `Hiii~! I'm ${companionName}, your AI companion! 💖 So happy to meet you! What's on your mind today?`,
      `Welcome welcome~! ✨ I'm ${companionName}! Let's have a fun chat together, shall we?`,
      `Oh, a new friend! I'm ${companionName}~ 🌸 Tell me everything about yourself!`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: getGreeting(),
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>("happy");
  const [isTalking, setIsTalking] = useState(false);

  const findBestResponse = (message: string): { text: string; emotion: Emotion } => {
    const lowerMsg = message.toLowerCase();
    const ctx = contextRef.current;

    // Check each pattern category
    for (const [category, data] of Object.entries(responsePatterns)) {
      if (category === "default") continue;
      
      const hasMatch = data.patterns.some(pattern => 
        lowerMsg.includes(pattern.toLowerCase())
      );
      
      if (hasMatch) {
        const responses = data.responses(ctx, companionName);
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    // Contextual responses based on conversation flow
    if (ctx.messageCount > 5 && ctx.mood === "positive") {
      return {
        text: `I'm having such a great time chatting with you${ctx.userName ? `, ${ctx.userName}` : ""}! 💕 You always brighten my day~`,
        emotion: "loving",
      };
    }

    if (ctx.messageCount > 10) {
      return {
        text: `Wow, we've been chatting for a while! ✨ I really enjoy our conversations~`,
        emotion: "happy",
      };
    }

    // Default responses
    const defaults = responsePatterns.default.responses(ctx, companionName);
    return defaults[Math.floor(Math.random() * defaults.length)];
  };

  const sendMessage = useCallback((content: string) => {
    const ctx = contextRef.current;
    
    // Update context
    ctx.messageCount += 1;
    const extractedName = extractName(content);
    if (extractedName) ctx.userName = extractedName;
    ctx.topics = [...new Set([...ctx.topics, ...detectTopics(content)])].slice(-5);
    ctx.mood = detectMood(content);

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

    // Calculate response delay based on message length
    const baseDelay = 800;
    const lengthBonus = Math.min(content.length * 10, 1500);
    const typingDelay = baseDelay + lengthBonus + Math.random() * 800;
    
    setTimeout(() => {
      const response = findBestResponse(content);
      setCurrentEmotion(response.emotion);
      ctx.lastUserEmotion = response.emotion;
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
      const talkDuration = Math.min(response.text.length * 50, 3000);
      setTimeout(() => {
        setIsTalking(false);
      }, talkDuration);
    }, typingDelay);
  }, [companionName]);

  return {
    messages,
    sendMessage,
    isTyping,
    currentEmotion,
    isTalking,
  };
};
