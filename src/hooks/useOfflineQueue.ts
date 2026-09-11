import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "amanai_offline_queue";

export interface QueuedPrompt {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

const read = (): QueuedPrompt[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedPrompt[]) : [];
  } catch {
    return [];
  }
};

const write = (items: QueuedPrompt[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full or unavailable */
  }
  window.dispatchEvent(new CustomEvent("amanai-queue-changed"));
};

export const enqueuePrompt = (content: string, imageUrl?: string): QueuedPrompt => {
  const item: QueuedPrompt = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content,
    imageUrl,
    createdAt: new Date().toISOString(),
  };
  write([...read(), item].slice(-25));
  return item;
};

export const dequeuePrompt = (id: string) => {
  write(read().filter((i) => i.id !== id));
};

export const peekQueue = (): QueuedPrompt[] => read();

export const clearQueue = () => write([]);

/** Reactive view of the pending queue. */
export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedPrompt[]>(() => read());

  useEffect(() => {
    const sync = () => setQueue(read());
    window.addEventListener("amanai-queue-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("amanai-queue-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const clear = useCallback(() => clearQueue(), []);

  return { queue, pendingCount: queue.length, clear };
};
