import { useSyncExternalStore } from "react";
import { SessionHistorySchema, type SessionHistory } from "@sfa/contracts";

export type Conversation = SessionHistory["conversations"][number];
export type ChatMessage = Conversation["messages"][number];

const KEY = "sfa.chatHistory.v1";
// shortcut: keep the newest 30 conversations to stay well inside sessionStorage's ~5 MB; revisit when Q05 sets limits.
const MAX_CONVERSATIONS = 30;
export const EMPTY_HISTORY: SessionHistory = { schemaVersion: 1, storage: "sessionStorage", conversations: [] };

// Stored history is untrusted browser data: anything that fails the shared schema starts an empty session.
export function parseStoredHistory(raw: string | null): SessionHistory {
  try {
    const parsed = SessionHistorySchema.safeParse(JSON.parse(raw ?? "null"));
    if (!parsed.success) return EMPTY_HISTORY;
    return { ...parsed.data, conversations: parsed.data.conversations.filter((c) => c.messages.length > 0) };
  } catch {
    return EMPTY_HISTORY;
  }
}

// Appends to an existing conversation without changing its association; most recently used comes first.
export function addMessage(
  history: SessionHistory, conversationId: string, association: Conversation["association"], message: ChatMessage,
): SessionHistory {
  const existing = history.conversations.find((c) => c.conversationId === conversationId);
  const updated = existing
    ? { ...existing, messages: [...existing.messages, message] }
    : { conversationId, association, messages: [message] };
  const others = history.conversations.filter((c) => c.conversationId !== conversationId);
  return { ...history, conversations: [updated, ...others].slice(0, MAX_CONVERSATIONS) };
}

// Undoes an unanswered question; a conversation left empty is dropped.
export function removeLastMessage(history: SessionHistory, conversationId: string): SessionHistory {
  return {
    ...history,
    conversations: history.conversations.flatMap((c) => {
      if (c.conversationId !== conversationId) return [c];
      const messages = c.messages.slice(0, -1);
      return messages.length > 0 ? [{ ...c, messages }] : [];
    }),
  };
}

let cache: SessionHistory | undefined;
const listeners = new Set<() => void>();

function snapshot() {
  if (!cache) {
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(KEY); } catch { /* storage blocked: start empty */ }
    cache = parseStoredHistory(raw);
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function updateHistory(change: (history: SessionHistory) => SessionHistory) {
  cache = change(snapshot());
  try { sessionStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* full or blocked: history lasts until the page closes */ }
  for (const listener of listeners) listener();
}

// sessionStorage exists only in the browser, so the server render always sees an empty history.
export function useSessionHistory() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_HISTORY);
}
