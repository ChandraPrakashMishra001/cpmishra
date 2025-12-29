import { useState, useEffect, useCallback } from "react";
import { Message } from "@/components/ChatInterface";

interface ConversationMemory {
  messages: Message[];
  lastActive: string;
  userName: string | null;
  topics: string[];
  totalMessages: number;
}

const STORAGE_KEY = "companion-memory";
const MAX_STORED_MESSAGES = 100; // Keep last 100 messages

export const useConversationMemory = () => {
  const [memory, setMemory] = useState<ConversationMemory>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Restore Date objects
        return {
          ...parsed,
          messages: parsed.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        };
      }
    } catch (e) {
      console.error("Failed to load memory:", e);
    }
    return {
      messages: [],
      lastActive: new Date().toISOString(),
      userName: null,
      topics: [],
      totalMessages: 0,
    };
  });

  // Save to localStorage whenever memory changes
  useEffect(() => {
    try {
      const toSave = {
        ...memory,
        messages: memory.messages.slice(-MAX_STORED_MESSAGES),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save memory:", e);
    }
  }, [memory]);

  const addMessage = useCallback((message: Message) => {
    setMemory((prev) => ({
      ...prev,
      messages: [...prev.messages, message].slice(-MAX_STORED_MESSAGES),
      lastActive: new Date().toISOString(),
      totalMessages: prev.totalMessages + 1,
    }));
  }, []);

  const setUserName = useCallback((name: string | null) => {
    setMemory((prev) => ({ ...prev, userName: name }));
  }, []);

  const addTopics = useCallback((newTopics: string[]) => {
    setMemory((prev) => ({
      ...prev,
      topics: [...new Set([...prev.topics, ...newTopics])].slice(-20),
    }));
  }, []);

  const clearMemory = useCallback(() => {
    setMemory({
      messages: [],
      lastActive: new Date().toISOString(),
      userName: null,
      topics: [],
      totalMessages: 0,
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

  return {
    memory,
    addMessage,
    setUserName,
    addTopics,
    clearMemory,
    getTimeSinceLastVisit,
    hasHistory: memory.messages.length > 0,
  };
};
