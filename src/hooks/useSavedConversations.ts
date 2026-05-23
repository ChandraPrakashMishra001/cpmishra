import { useCallback, useEffect, useState } from "react";
import { Message } from "@/components/ChatInterface";

export interface SavedConversation {
  id: string;
  title: string;
  savedAt: string;
  messages: Message[];
}

const STORAGE_KEY = "amanai-saved-conversations";
export const MAX_SAVED_CONVERSATIONS = 10;

const reviveMessages = (raw: unknown): Message[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((m: any) => ({
    ...m,
    timestamp: new Date(m.timestamp),
  }));
};

const deriveTitle = (messages: Message[]): string => {
  const firstUser = messages.find((m) => m.isUser && m.content?.trim());
  const base = (firstUser?.content ?? messages.find((m) => m.content?.trim())?.content ?? "Conversation").trim();
  const oneLine = base.replace(/\s+/g, " ");
  return oneLine.length > 60 ? `${oneLine.slice(0, 57)}…` : oneLine;
};

export const useSavedConversations = () => {
  const [conversations, setConversations] = useState<SavedConversation[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedConversation[];
      return parsed.map((c) => ({ ...c, messages: reviveMessages(c.messages) }));
    } catch (e) {
      console.error("Failed to load saved conversations:", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error("Failed to persist saved conversations:", e);
    }
  }, [conversations]);

  const saveConversation = useCallback((messages: Message[], customTitle?: string): SavedConversation | null => {
    const meaningful = messages.filter(
      (m) => !m.id.startsWith("welcome") && !m.id.startsWith("error") && (m.content?.trim() || m.imageUrl),
    );
    if (meaningful.length === 0) return null;

    const entry: SavedConversation = {
      id: `convo-${Date.now()}`,
      title: customTitle?.trim() || deriveTitle(meaningful),
      savedAt: new Date().toISOString(),
      messages: meaningful,
    };

    setConversations((prev) => [entry, ...prev].slice(0, MAX_SAVED_CONVERSATIONS));
    return entry;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => setConversations([]), []);

  return {
    conversations,
    saveConversation,
    deleteConversation,
    clearAll,
    capacity: MAX_SAVED_CONVERSATIONS,
  };
};
