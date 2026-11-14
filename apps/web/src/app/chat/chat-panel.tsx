"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Messages } from "../../messages/index";
import { addMessage, removeLastMessage, updateHistory, useSessionHistory, type Conversation } from "./session-history";

const MAIN: Conversation["association"] = { origin: "main", linkedListing: null };

export function ChatPanel({ t, language }: { t: Messages; language: string }) {
  const history = useSessionHistory();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const following = useRef(true);
  const active = history.conversations.find((c) => c.conversationId === activeId);
  const turns = active?.messages ?? [];
  const prompts = [t.chatPromptStart, t.chatPromptTerms, t.chatPromptStatements, t.chatPromptCompare];
  // Explicit Gregorian year with its era label (e.g. "14 พ.ย. ค.ศ. 2026 16:07 น."), per docs/ui-conventions.md.
  const formatTime = (iso: string) => new Date(iso).toLocaleString(`${language}-u-ca-gregory`, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", era: "short", timeZone: "Asia/Bangkok",
  });

  // Auto-scroll only while the reader is already at the latest message.
  useEffect(() => {
    const track = () => {
      following.current = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
    };
    window.addEventListener("scroll", track, { passive: true });
    return () => window.removeEventListener("scroll", track);
  }, []);
  useEffect(() => {
    if (following.current) window.scrollTo({ top: document.documentElement.scrollHeight });
  }, [turns.length, pending]);

  function open(conversationId: string | null) {
    setActiveId(conversationId);
    setError(null);
  }

  async function submit(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    const conversationId = activeId ?? crypto.randomUUID();
    const association = active?.association ?? MAIN;
    const previous = turns.slice(-20);
    setActiveId(conversationId);
    updateHistory((h) => addMessage(h, conversationId, association, { role: "user", text: message, createdAt: new Date().toISOString() }));
    setDraft("");
    setPending(true);
    setError(null);
    composer.current?.focus();
    // Take the question back out of the log and keep it as the draft, so retrying never shows it twice.
    const fail = (errorText: string) => {
      updateHistory((h) => removeLastMessage(h, conversationId));
      setDraft(message);
      setError(errorText);
    };
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request: { requestId: crypto.randomUUID(), conversationId, language: "th", association, message },
          history: previous,
        }),
      });
      const reply = res.ok ? await res.json() : null;
      if (reply?.status === "draft") {
        updateHistory((h) => addMessage(h, conversationId, association, { role: "assistant", text: reply.text, createdAt: new Date().toISOString() }));
      } else {
        fail(reply?.status === "unavailable" ? t.chatUnavailable : t.chatError);
      }
    } catch {
      fail(t.chatError);
    } finally {
      setPending(false);
    }
  }

  function sendOnCtrlEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter adds a new line; Ctrl/Cmd+Enter sends, but never while a Thai input method is composing.
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit(draft);
    }
  }

  const historyList = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.historySessionNote}</p>
      {history.conversations.length === 0 ? <p className="text-sm">{t.historyEmpty}</p> : (
        <ul className="space-y-2">
          {history.conversations.map((c) => (
            <li key={c.conversationId}>
              <Button
                type="button" variant="ghost" disabled={pending} onClick={() => open(c.conversationId)}
                aria-current={c.conversationId === activeId ? "true" : undefined}
                className="h-auto min-h-11 w-full flex-col items-start gap-1 px-3 py-3 text-left aria-[current=true]:bg-card aria-[current=true]:shadow-xs"
              >
                <span className="w-full truncate">{c.messages[0].text}</span>
                <time dateTime={c.messages[c.messages.length - 1].createdAt} className="text-xs font-normal text-muted-foreground">
                  {formatTime(c.messages[c.messages.length - 1].createdAt)}
                </time>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-10">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <h1 className="my-0">{t.mainChat}</h1>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => open(null)} disabled={pending}>{t.chatNew}</Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{t.mainChatIntro}</p>
        <details className="mt-6 rounded-lg bg-secondary px-4 lg:hidden">
          <summary className="flex min-h-11 cursor-pointer items-center font-medium">
            {t.history} ({history.conversations.length})
          </summary>
          <div className="pb-4">{historyList}</div>
        </details>

        <div aria-live="polite" className="py-8">
          {turns.length === 0 ? (
            <p className="max-w-[88%] rounded-2xl border bg-card px-5 py-4">{t.chatEmpty}</p>
          ) : (
            <ol className="flex flex-col gap-6">
              {turns.map((turn) => (
                <li
                  key={turn.createdAt + turn.role}
                  className={`max-w-[88%] rounded-2xl px-5 py-4 ${turn.role === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : "border bg-card"}`}
                >
                  <span className="sr-only">{turn.role === "user" ? t.chatYou : t.chatAssistant}</span>
                  <p className="whitespace-pre-wrap break-words">{turn.text}</p>
                  <time
                    dateTime={turn.createdAt}
                    className={`mt-2 block text-xs ${turn.role === "user" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {formatTime(turn.createdAt)}
                  </time>
                </li>
              ))}
            </ol>
          )}
          {pending && (
            <p role="status" className="mt-6 w-fit rounded-2xl border bg-card px-5 py-4 text-muted-foreground motion-safe:animate-pulse">
              {t.chatSending}
            </p>
          )}
        </div>

        <p className="mb-5 text-sm text-muted-foreground">{t.chatDisclaimer}</p>
        <div role="group" aria-label={t.chatPromptsLabel} className="mb-6 flex flex-wrap gap-3">
          {prompts.map((prompt) => (
            <Button
              key={prompt} type="button" variant="outline" size="sm" disabled={pending}
              className="h-auto min-h-11 whitespace-normal rounded-full px-4" onClick={() => void submit(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>

        {/* Only the input is pinned, and only on wide screens: on phones it would cover the answer, especially with the keyboard open. */}
        <form
          onSubmit={(event) => { event.preventDefault(); void submit(draft); }}
          className="grid gap-3 border-t bg-background pb-5 pt-5 lg:sticky lg:bottom-0"
        >
          <label htmlFor="chat-input" className="font-medium">{t.chatInputLabel}</label>
          <div className="flex items-end gap-3">
            <textarea
              id="chat-input" ref={composer} rows={2} maxLength={4000} value={draft} aria-describedby="chat-hint"
              onChange={(event) => setDraft(event.target.value)} onKeyDown={sendOnCtrlEnter}
              className="min-w-0 flex-1 resize-y rounded-md border border-input bg-card px-4 py-3"
            />
            <Button type="submit" className="min-h-11 px-5" disabled={pending || !draft.trim()}>{t.chatSend}</Button>
          </div>
          <p id="chat-hint" className="text-sm text-muted-foreground">{t.chatSendHint}</p>
          {error && (
            <div role="alert" className="flex flex-wrap items-center gap-3">
              <p className="font-medium text-destructive">{error}</p>
              <Button type="submit" variant="outline" size="sm" className="min-h-11" disabled={pending}>{t.chatRetry}</Button>
            </div>
          )}
        </form>
      </div>

      <aside aria-labelledby="history-heading" className="hidden rounded-lg bg-secondary p-5 lg:sticky lg:top-6 lg:order-first lg:block">
        <h2 id="history-heading" className="mb-3 mt-0">{t.history}</h2>
        {historyList}
      </aside>
    </div>
  );
}
