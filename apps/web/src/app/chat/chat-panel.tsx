"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { Messages } from "../../messages/index";
import { addMessage, removeLastMessage, updateHistory, useSessionHistory, type Conversation } from "./session-history";

const MAIN: Conversation["association"] = { origin: "main", linkedListing: null };

export function ChatPanel({ t, language }: { t: Messages; language: string }) {
  const history = useSessionHistory();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = history.conversations.find((c) => c.conversationId === activeId);
  const turns = active?.messages ?? [];
  // Keep message dates visible so older answers are not mistaken for fresh ones.
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(language, { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" });

  function open(conversationId: string | null) {
    setActiveId(conversationId);
    setError(null);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || pending) return;
    const conversationId = activeId ?? crypto.randomUUID();
    const association = active?.association ?? MAIN;
    const previous = turns.slice(-20);
    setActiveId(conversationId);
    updateHistory((h) => addMessage(h, conversationId, association, { role: "user", text: message, createdAt: new Date().toISOString() }));
    setDraft("");
    setPending(true);
    setError(null);
    // Put the question back so the visitor can resend it.
    const fail = (text: string) => {
      updateHistory((h) => removeLastMessage(h, conversationId));
      setDraft(message);
      setError(text);
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

  function sendOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Thai IMEs use Enter to confirm composition, so only plain Enter sends.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <>
      <div className="chat">
        <div aria-live="polite">
          {turns.length === 0 ? <p>{t.chatEmpty}</p> : (
            <ol className="chat-log">
              {turns.map((turn) => (
                <li key={turn.createdAt + turn.role} className={`turn ${turn.role}`}>
                  <strong>{turn.role === "user" ? t.chatYou : t.chatAssistant}</strong>{" "}
                  <time dateTime={turn.createdAt}>{formatTime(turn.createdAt)}</time>
                  <p>{turn.text}</p>
                </li>
              ))}
            </ol>
          )}
          {pending && <p role="status">{t.chatSending}</p>}
        </div>
        {error && <p role="alert" className="chat-error">{error}</p>}
        <form onSubmit={send}>
          <label htmlFor="chat-input">{t.chatInputLabel}</label>
          <textarea
            id="chat-input" rows={3} maxLength={4000} value={draft}
            onChange={(event) => setDraft(event.target.value)} onKeyDown={sendOnEnter}
          />
          <button type="submit" disabled={pending || !draft.trim()}>{t.chatSend}</button>
        </form>
        <p className="chat-disclaimer">{t.chatDisclaimer}</p>
      </div>
      <section aria-labelledby="history-heading">
        <h2 id="history-heading">{t.history}</h2>
        <p>{t.historySessionNote}</p>
        <button type="button" onClick={() => open(null)} disabled={pending}>{t.chatNew}</button>
        {history.conversations.length === 0 ? <p>{t.historyEmpty}</p> : (
          <ul className="history-list">
            {history.conversations.map((c) => (
              <li key={c.conversationId}>
                <button
                  type="button" disabled={pending} onClick={() => open(c.conversationId)}
                  aria-current={c.conversationId === activeId ? "true" : undefined}
                >
                  <span>{c.messages[0].text}</span>
                  <time dateTime={c.messages[c.messages.length - 1].createdAt}>
                    {formatTime(c.messages[c.messages.length - 1].createdAt)}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
