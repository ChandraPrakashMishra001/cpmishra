import { useState, useEffect, useCallback } from "react";
import { Message } from "@/components/ChatInterface";

interface ImportantFact {
  fact: string;
  category: "personal" | "preference" | "life_event" | "relationship" | "goal";
  timestamp: string;
}

interface MoodEntry {
  mood: "happy" | "sad" | "stressed" | "excited" | "neutral";
  timestamp: string;
}

interface ConversationSummary {
  date: string;
  highlights: string[];
  topTopics: string[];
}

interface RelationshipMilestone {
  type: "first_chat" | "shared_name" | "deep_conversation" | "daily_streak" | "weekly_streak" | "milestone_messages";
  achieved: string;
  value?: number;
}

interface ConversationMemory {
  messages: Message[];
  lastActive: string;
  userName: string | null;
  topics: string[];
  totalMessages: number;
  // Enhanced memory fields
  importantFacts: ImportantFact[];
  moodHistory: MoodEntry[];
  conversationSummaries: ConversationSummary[];
  milestones: RelationshipMilestone[];
  preferences: Record<string, string>;
  dailyStreak: number;
  lastVisitDate: string;
  firstChatDate: string | null;
  favoriteTopics: string[];
  sharedExperiences: string[];
}

const STORAGE_KEY = "companion-memory";
const MAX_STORED_MESSAGES = 100;
const MAX_FACTS = 50;
const MAX_MOOD_ENTRIES = 30;
const MAX_SUMMARIES = 10;

// Extract important facts from messages
const extractFacts = (message: string): ImportantFact[] => {
  const facts: ImportantFact[] = [];
  const lowerMsg = message.toLowerCase();
  const timestamp = new Date().toISOString();

  // Personal facts
  const personalPatterns = [
    { pattern: /i(?:'m| am) (\d+) years? old/i, category: "personal" as const },
    { pattern: /my birthday is ([^.!?]+)/i, category: "personal" as const },
    { pattern: /i live in ([^.!?]+)/i, category: "personal" as const },
    { pattern: /i(?:'m| am) from ([^.!?]+)/i, category: "personal" as const },
    { pattern: /i work (?:as|at|in) ([^.!?]+)/i, category: "personal" as const },
    { pattern: /i(?:'m| am) a ([^.!?]+(?:student|developer|teacher|artist|nurse|doctor|engineer|designer))/i, category: "personal" as const },
  ];

  // Preferences
  const preferencePatterns = [
    { pattern: /my favorite ([^.!?]+) is ([^.!?]+)/i, category: "preference" as const },
    { pattern: /i (?:really )?love ([^.!?]+)/i, category: "preference" as const },
    { pattern: /i (?:really )?hate ([^.!?]+)/i, category: "preference" as const },
    { pattern: /i prefer ([^.!?]+)/i, category: "preference" as const },
  ];

  // Life events
  const lifeEventPatterns = [
    { pattern: /i just (?:got|started|finished|moved|broke up|graduated)/i, category: "life_event" as const },
    { pattern: /(?:today|yesterday|recently) i ([^.!?]+)/i, category: "life_event" as const },
  ];

  // Relationship mentions
  const relationshipPatterns = [
    { pattern: /my (?:boyfriend|girlfriend|partner|husband|wife|mom|dad|brother|sister|friend) ([^.!?]+)/i, category: "relationship" as const },
  ];

  // Goal mentions
  const goalPatterns = [
    { pattern: /i want to ([^.!?]+)/i, category: "goal" as const },
    { pattern: /my goal is ([^.!?]+)/i, category: "goal" as const },
    { pattern: /i(?:'m| am) trying to ([^.!?]+)/i, category: "goal" as const },
  ];

  const allPatterns = [...personalPatterns, ...preferencePatterns, ...lifeEventPatterns, ...relationshipPatterns, ...goalPatterns];

  for (const { pattern, category } of allPatterns) {
    const match = message.match(pattern);
    if (match) {
      facts.push({
        fact: match[0].trim(),
        category,
        timestamp,
      });
    }
  }

  return facts;
};

// Detect mood from message
const detectMood = (message: string): MoodEntry["mood"] => {
  const lowerMsg = message.toLowerCase();
  
  if (/😢|😭|sad|depressed|unhappy|crying|hurt|lonely|miss|lost/.test(lowerMsg)) return "sad";
  if (/😰|stressed|anxious|worried|overwhelmed|nervous|panic/.test(lowerMsg)) return "stressed";
  if (/🎉|excited|amazing|awesome|can't wait|so happy|yay|!!!/.test(lowerMsg)) return "excited";
  if (/😊|happy|great|good|fine|nice|love|wonderful/.test(lowerMsg)) return "happy";
  
  return "neutral";
};

// Check for milestone achievements
const checkMilestones = (memory: ConversationMemory): RelationshipMilestone[] => {
  const newMilestones: RelationshipMilestone[] = [];
  const now = new Date().toISOString();
  const existingTypes = memory.milestones.map(m => m.type);

  // First chat milestone
  if (!existingTypes.includes("first_chat") && memory.totalMessages === 1) {
    newMilestones.push({ type: "first_chat", achieved: now });
  }

  // Shared name milestone
  if (!existingTypes.includes("shared_name") && memory.userName) {
    newMilestones.push({ type: "shared_name", achieved: now });
  }

  // Message count milestones
  const messageThresholds = [50, 100, 250, 500, 1000];
  for (const threshold of messageThresholds) {
    if (memory.totalMessages >= threshold && !memory.milestones.some(m => m.type === "milestone_messages" && m.value === threshold)) {
      newMilestones.push({ type: "milestone_messages", achieved: now, value: threshold });
    }
  }

  // Daily streak milestone (7 days)
  if (!existingTypes.includes("weekly_streak") && memory.dailyStreak >= 7) {
    newMilestones.push({ type: "weekly_streak", achieved: now, value: 7 });
  }

  return newMilestones;
};

// Generate conversation summary from recent messages
const generateSummary = (messages: Message[]): ConversationSummary | null => {
  if (messages.length < 5) return null;

  const recentMessages = messages.slice(-20);
  const userMessages = recentMessages.filter(m => m.isUser).map(m => m.content);
  
  // Extract key topics and highlights
  const allText = userMessages.join(" ").toLowerCase();
  const highlights: string[] = [];
  
  // Detect conversation themes
  if (/help|solve|explain|how to/.test(allText)) highlights.push("Asked for help");
  if (/thank|thanks|appreciate/.test(allText)) highlights.push("Expressed gratitude");
  if (/sad|worried|stressed/.test(allText)) highlights.push("Shared feelings");
  if (/excited|happy|great news/.test(allText)) highlights.push("Shared good news");
  if (/draw|image|picture/.test(allText)) highlights.push("Requested artwork");

  const topicKeywords: Record<string, string[]> = {
    "Work/School": ["work", "job", "school", "study", "homework", "exam", "project"],
    "Relationships": ["friend", "family", "love", "dating", "relationship"],
    "Hobbies": ["game", "music", "movie", "book", "art", "sport"],
    "Personal Growth": ["goal", "learn", "improve", "habit", "routine"],
    "Emotions": ["feel", "happy", "sad", "stressed", "excited"],
  };

  const topTopics: string[] = [];
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => allText.includes(kw))) {
      topTopics.push(topic);
    }
  }

  if (highlights.length === 0 && topTopics.length === 0) return null;

  return {
    date: new Date().toISOString().split("T")[0],
    highlights: highlights.slice(0, 3),
    topTopics: topTopics.slice(0, 3),
  };
};

export const useConversationMemory = () => {
  const [memory, setMemory] = useState<ConversationMemory>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Calculate streak
        const lastVisit = parsed.lastVisitDate ? new Date(parsed.lastVisitDate) : null;
        const today = new Date().toISOString().split("T")[0];
        const lastVisitDay = lastVisit?.toISOString().split("T")[0];
        
        let dailyStreak = parsed.dailyStreak || 0;
        if (lastVisitDay && lastVisitDay !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          
          if (lastVisitDay === yesterdayStr) {
            dailyStreak += 1; // Continue streak
          } else {
            dailyStreak = 1; // Reset streak
          }
        }

        return {
          ...parsed,
          messages: parsed.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
          dailyStreak,
          lastVisitDate: today,
          // Ensure new fields exist
          importantFacts: parsed.importantFacts || [],
          moodHistory: parsed.moodHistory || [],
          conversationSummaries: parsed.conversationSummaries || [],
          milestones: parsed.milestones || [],
          preferences: parsed.preferences || {},
          favoriteTopics: parsed.favoriteTopics || [],
          sharedExperiences: parsed.sharedExperiences || [],
          firstChatDate: parsed.firstChatDate || null,
        };
      }
    } catch (e) {
      console.error("Failed to load memory:", e);
    }
    
    const today = new Date().toISOString().split("T")[0];
    return {
      messages: [],
      lastActive: new Date().toISOString(),
      userName: null,
      topics: [],
      totalMessages: 0,
      importantFacts: [],
      moodHistory: [],
      conversationSummaries: [],
      milestones: [],
      preferences: {},
      dailyStreak: 1,
      lastVisitDate: today,
      firstChatDate: null,
      favoriteTopics: [],
      sharedExperiences: [],
    };
  });

  // Save to localStorage whenever memory changes
  useEffect(() => {
    try {
      const toSave = {
        ...memory,
        messages: memory.messages.slice(-MAX_STORED_MESSAGES),
        importantFacts: memory.importantFacts.slice(-MAX_FACTS),
        moodHistory: memory.moodHistory.slice(-MAX_MOOD_ENTRIES),
        conversationSummaries: memory.conversationSummaries.slice(-MAX_SUMMARIES),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save memory:", e);
    }
  }, [memory]);

  const addMessage = useCallback((message: Message) => {
    setMemory((prev) => {
      const newMessages = [...prev.messages, message].slice(-MAX_STORED_MESSAGES);
      const isFirstMessage = prev.totalMessages === 0;
      
      // Extract facts and mood from user messages
      let newFacts = prev.importantFacts;
      let newMoodHistory = prev.moodHistory;
      
      if (message.isUser) {
        const extractedFacts = extractFacts(message.content);
        if (extractedFacts.length > 0) {
          newFacts = [...prev.importantFacts, ...extractedFacts].slice(-MAX_FACTS);
        }
        
        const mood = detectMood(message.content);
        newMoodHistory = [...prev.moodHistory, { mood, timestamp: new Date().toISOString() }].slice(-MAX_MOOD_ENTRIES);
      }
      
      // Check for new milestones
      const updatedMemory = {
        ...prev,
        messages: newMessages,
        lastActive: new Date().toISOString(),
        totalMessages: prev.totalMessages + 1,
        importantFacts: newFacts,
        moodHistory: newMoodHistory,
        firstChatDate: isFirstMessage ? new Date().toISOString() : prev.firstChatDate,
      };
      
      const newMilestones = checkMilestones(updatedMemory);
      
      // Generate summary every 20 messages
      let newSummaries = prev.conversationSummaries;
      if (updatedMemory.totalMessages % 20 === 0) {
        const summary = generateSummary(newMessages);
        if (summary) {
          newSummaries = [...prev.conversationSummaries, summary].slice(-MAX_SUMMARIES);
        }
      }
      
      // Update favorite topics
      const topicCounts: Record<string, number> = {};
      for (const topic of prev.topics) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
      const favoriteTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic);

      return {
        ...updatedMemory,
        milestones: [...prev.milestones, ...newMilestones],
        conversationSummaries: newSummaries,
        favoriteTopics,
      };
    });
  }, []);

  const setUserName = useCallback((name: string | null) => {
    setMemory((prev) => ({ ...prev, userName: name }));
  }, []);

  const addTopics = useCallback((newTopics: string[]) => {
    setMemory((prev) => ({
      ...prev,
      topics: [...new Set([...prev.topics, ...newTopics])].slice(-50),
    }));
  }, []);

  const addPreference = useCallback((key: string, value: string) => {
    setMemory((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  }, []);

  const addSharedExperience = useCallback((experience: string) => {
    setMemory((prev) => ({
      ...prev,
      sharedExperiences: [...new Set([...prev.sharedExperiences, experience])].slice(-20),
    }));
  }, []);

  const clearMemory = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setMemory({
      messages: [],
      lastActive: new Date().toISOString(),
      userName: null,
      topics: [],
      totalMessages: 0,
      importantFacts: [],
      moodHistory: [],
      conversationSummaries: [],
      milestones: [],
      preferences: {},
      dailyStreak: 1,
      lastVisitDate: today,
      firstChatDate: null,
      favoriteTopics: [],
      sharedExperiences: [],
    });
  }, []);

  const getTimeSinceLastVisit = useCallback(() => {
    const lastActive = new Date(memory.lastActive);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return { value: diffDays, unit: "days" };
    if (diffHours > 0) return { value: diffHours, unit: "hours" };
    if (diffMins > 0) return { value: diffMins, unit: "minutes" };
    return { value: 0, unit: "now" };
  }, [memory.lastActive]);

  const getRecentMoodTrend = useCallback(() => {
    const recentMoods = memory.moodHistory.slice(-10);
    if (recentMoods.length === 0) return null;
    
    const moodCounts: Record<string, number> = {};
    for (const entry of recentMoods) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
    
    return Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0][0] as MoodEntry["mood"];
  }, [memory.moodHistory]);

  const getRelationshipAge = useCallback(() => {
    if (!memory.firstChatDate) return null;
    
    const firstChat = new Date(memory.firstChatDate);
    const now = new Date();
    const diffMs = now.getTime() - firstChat.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return { value: diffDays, unit: "days" };
    if (diffDays < 30) return { value: Math.floor(diffDays / 7), unit: "weeks" };
    return { value: Math.floor(diffDays / 30), unit: "months" };
  }, [memory.firstChatDate]);

  const getMemoryContext = useCallback(() => {
    // Returns a rich context object for the AI to use
    return {
      userName: memory.userName,
      favoriteTopics: memory.favoriteTopics,
      recentMood: getRecentMoodTrend(),
      importantFacts: memory.importantFacts.slice(-10),
      preferences: memory.preferences,
      milestones: memory.milestones,
      dailyStreak: memory.dailyStreak,
      relationshipAge: getRelationshipAge(),
      totalMessages: memory.totalMessages,
      sharedExperiences: memory.sharedExperiences,
      recentSummary: memory.conversationSummaries.slice(-1)[0],
    };
  }, [memory, getRecentMoodTrend, getRelationshipAge]);

  return {
    memory,
    addMessage,
    setUserName,
    addTopics,
    addPreference,
    addSharedExperience,
    clearMemory,
    getTimeSinceLastVisit,
    getRecentMoodTrend,
    getRelationshipAge,
    getMemoryContext,
    hasHistory: memory.messages.length > 0,
  };
};
