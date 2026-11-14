import { afterEach, describe, expect, it, vi } from "vitest";
import { chatRequestFixture } from "@sfa/contracts/fixtures";
import { parseChatBody, respond } from "./chat";

vi.mock("server-only", () => ({}));

const request = {
  requestId: "REQ_1", conversationId: "CONV_1", language: "th" as const,
  association: { origin: "main" as const, linkedListing: null }, message: "P/E คืออะไร",
};
const history = [
  { role: "user" as const, text: "สวัสดี", createdAt: "2026-11-14T03:00:00.000Z" },
  { role: "assistant" as const, text: "สวัสดีครับ", createdAt: "2026-11-14T03:00:05.000Z" },
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("parseChatBody", () => {
  it("accepts a main-chat request with prior turns", () => {
    expect(parseChatBody({ request, history })).toEqual({ request, history });
    expect(parseChatBody({ request })?.history).toEqual([]);
  });

  it("rejects malformed, oversized, or not-yet-supported stock-bound requests", () => {
    expect(parseChatBody(null)).toBeNull();
    expect(parseChatBody({ request: { ...request, message: "" } })).toBeNull();
    expect(parseChatBody({ request: { ...request, message: "x".repeat(4001) } })).toBeNull();
    expect(parseChatBody({ request, history: Array(21).fill(history[0]) })).toBeNull();
    expect(parseChatBody({ request, history: [{ role: "system", text: "x", createdAt: history[0].createdAt }] })).toBeNull();
    expect(parseChatBody({ request: { ...request, evidence: [] } })).toBeNull();
    expect(parseChatBody({ request: chatRequestFixture.data })).toBeNull();
  });
});

describe("respond", () => {
  it("reports unavailable without calling a model when no key is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await respond(request, [])).toMatchObject({ status: "unavailable", reason: "MODEL_NOT_CONFIGURED" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends the conversation to Gemini and returns its text as a draft", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.spyOn(console, "info").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      candidates: [{ content: { parts: [{ text: "P/E คือ " }, { text: "อัตราส่วนราคาต่อกำไร" }] } }],
    }));
    expect(await respond(request, history)).toEqual({
      status: "draft", requestId: "REQ_1", language: "th", text: "P/E คือ อัตราส่วนราคาต่อกำไร",
    });
    const [, init] = fetchSpy.mock.calls[0];
    expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("test-key");
    const body = JSON.parse(String(init?.body));
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model", "user"]);
    expect(body.contents.at(-1).parts[0].text).toBe("P/E คืออะไร");
  });

  it("maps HTTP failures, empty answers and network errors to error responses", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(new Response("", { status: 429 }));
    expect(await respond(request, [])).toMatchObject({ status: "error", code: "MODEL_HTTP_429" });
    fetchSpy.mockResolvedValueOnce(Response.json({ candidates: [] }));
    expect(await respond(request, [])).toMatchObject({ status: "error", code: "EMPTY_ANSWER" });
    fetchSpy.mockRejectedValueOnce(new Error("offline"));
    expect(await respond(request, [])).toMatchObject({ status: "error", code: "MODEL_UNREACHABLE" });
  });
});
