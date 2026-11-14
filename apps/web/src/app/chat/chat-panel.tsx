"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Messages } from "../../messages/index";

type Turn = { role: "user" | "assistant"; text: string; createdAt: string };

export function ChatPanel({ t }: { t: Messages }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useRef<string | null>(null);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || pending) return;
    conversationId.current ??= crypto.randomUUID();
    setTurns((prev) => [...prev, { role: "user", text: message, createdAt: new Date().toISOString() }]);
    setDraft("");
    setPending(true);
    setError(null);
    // Put the question back so the visitor can resend it.
    const fail = (text: string) => {
      setTurns((prev) => prev.slice(0, -1));
      setDraft(message);
      setError(text);
    };
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request: {
            requestId: crypto.randomUUID(), conversationId: conversationId.current, language: "th",
            association: { origin: "main", linkedListing: null }, message,
          },
          history: turns.slice(-20),
        }),
      });
      const reply = res.ok ? await res.json() : null;
      if (reply?.status === "draft") {
        setTurns((prev) => [...prev, { role: "assistant", text: reply.text, createdAt: new Date().toISOString() }]);
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
    <div className="chat">
      <div aria-live="polite">
        {turns.length === 0 ? <p>{t.chatEmpty}</p> : (
          <ol className="chat-log">
            {turns.map((turn) => (
              <li key={turn.createdAt + turn.role} className={`turn ${turn.role}`}>
                <strong>{turn.role === "user" ? t.chatYou : t.chatAssistant}</strong>
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
  );
}
