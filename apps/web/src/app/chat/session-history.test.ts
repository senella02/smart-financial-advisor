import { describe, expect, it } from "vitest";
import { sessionHistoryFixture } from "@sfa/contracts/fixtures";
import { addMessage, EMPTY_HISTORY, parseStoredHistory, removeLastMessage } from "./session-history";

const MAIN = { origin: "main" as const, linkedListing: null };
const message = (text: string) => ({ role: "user" as const, text, createdAt: "2026-11-14T08:00:00.000Z" });

describe("parseStoredHistory", () => {
  it("accepts valid stored history and treats anything else as an empty session", () => {
    expect(parseStoredHistory(JSON.stringify(sessionHistoryFixture.data))).toEqual(sessionHistoryFixture.data);
    for (const raw of [null, "not json", "{}", JSON.stringify({ ...sessionHistoryFixture.data, schemaVersion: 2 })]) {
      expect(parseStoredHistory(raw)).toEqual(EMPTY_HISTORY);
    }
  });

  it("drops conversations without messages", () => {
    const stored = { ...EMPTY_HISTORY, conversations: [{ conversationId: "EMPTY", association: MAIN, messages: [] }] };
    expect(parseStoredHistory(JSON.stringify(stored)).conversations).toEqual([]);
  });
});

describe("addMessage / removeLastMessage", () => {
  it("starts a conversation at the top and keeps an existing conversation's stock binding", () => {
    const fixture = sessionHistoryFixture.data;
    const stockChat = fixture.conversations.find((c) => c.association.origin === "stock")!;
    const withNew = addMessage(fixture, "NEW", MAIN, message("hi"));
    expect(withNew.conversations[0]).toEqual({ conversationId: "NEW", association: MAIN, messages: [message("hi")] });

    const continued = addMessage(withNew, stockChat.conversationId, MAIN, message("and its debt?"));
    expect(continued.conversations[0].association).toEqual(stockChat.association);
    expect(continued.conversations[0].messages.at(-1)?.text).toBe("and its debt?");
    expect(continued.conversations).toHaveLength(fixture.conversations.length + 1);
  });

  it("keeps only the newest 30 conversations", () => {
    let history = EMPTY_HISTORY;
    for (let i = 0; i < 31; i++) history = addMessage(history, `C${i}`, MAIN, message(`q${i}`));
    expect(history.conversations).toHaveLength(30);
    expect(history.conversations[0].conversationId).toBe("C30");
    expect(history.conversations.some((c) => c.conversationId === "C0")).toBe(false);
  });

  it("removes an unanswered question and drops a conversation left empty", () => {
    const history = addMessage(addMessage(EMPTY_HISTORY, "A", MAIN, message("one")), "A", MAIN, message("two"));
    expect(removeLastMessage(history, "A").conversations[0].messages.map((m) => m.text)).toEqual(["one"]);
    expect(removeLastMessage(removeLastMessage(history, "A"), "A").conversations).toEqual([]);
  });
});
