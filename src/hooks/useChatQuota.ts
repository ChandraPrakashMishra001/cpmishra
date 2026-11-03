import { useSyncExternalStore } from "react";

// Shared, module-level store for the visitor's daily chat budget.
// Updated from useLiaChat when the backend responds, read by the UI
// (ChatInput) without prop drilling.

export interface ChatQuotaState {
  remaining: number | null;
  limit: number;
  exceeded: boolean;
  resetAt: string | null;
}

const STORAGE_KEY = "amanai_chat_quota";

const today = () => new Date().toISOString().slice(0, 10);

function readStored(): ChatQuotaState {
  const base: ChatQuotaState = { remaining: null, limit: 30, exceeded: false, resetAt: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as { day?: string; remaining?: number; limit?: number; exceeded?: boolean; resetAt?: string | null };
    // A stored counter from a previous day is stale — start unknown.
    if (parsed.day !== today() || typeof parsed.remaining !== "number") return base;
    return {
      remaining: parsed.remaining,
      limit: typeof parsed.limit === "number" ? parsed.limit : 30,
      exceeded: parsed.exceeded === true,
      resetAt: parsed.resetAt ?? null,
    };
  } catch {
    return base;
  }
}

let state: ChatQuotaState = readStored();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: today(), ...state }));
  } catch {
    // storage unavailable — state stays in memory
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const chatQuotaStore = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setRemaining: (remaining: number, limit?: number) => {
    state = {
      ...state,
      remaining: Number.isFinite(remaining) ? remaining : state.remaining,
      limit: typeof limit === "number" && limit > 0 ? limit : state.limit,
      exceeded: remaining <= 0,
      // Fresh remaining clears a previous day's exceeded flag
      resetAt: remaining <= 0 ? state.resetAt : null,
    };
    emit();
  },
  setExceeded: (resetAt: string | null, limit?: number) => {
    state = { ...state, remaining: 0, exceeded: true, resetAt: resetAt ?? state.resetAt, limit: typeof limit === "number" && limit > 0 ? limit : state.limit };
    emit();
  },
};

export const useChatQuota = (): ChatQuotaState => useSyncExternalStore(chatQuotaStore.subscribe, chatQuotaStore.getState);
