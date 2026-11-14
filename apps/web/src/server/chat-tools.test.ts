import { describe, expect, it, vi } from "vitest";
import { stockIdentityFixture } from "@sfa/contracts/fixtures";
import { runTool, samplePoints } from "./chat-tools";

vi.mock("server-only", () => ({}));
vi.mock("./research", () => ({
  getStock: vi.fn(async (_market: string, symbol: string) =>
    symbol === "FIXTURE_TH_A" ? { fixture: true, data: stockIdentityFixture.data } : null),
  liveMarketData: {
    search: vi.fn(async (query: string) => ({ status: "available", data: { query, matches: [], isAmbiguous: false } })),
    quote: vi.fn(async () => ({ status: "unavailable", reason: "QUOTE_UNAVAILABLE" })),
    priceHistory: vi.fn(async () => ({
      status: "available",
      // A spike at index 50, which the 40-point sample skips, must still be the reported high.
      data: {
        points: Array.from({ length: 100 }, (_, i) => ({
          sourceAsOf: `T${i}`, price: { value: i === 50 ? 1000 : i === 30 ? null : i + 1 },
        })),
      },
    })),
  },
}));

describe("samplePoints", () => {
  it("keeps short series and thins long ones to 40 points including both ends", () => {
    expect(samplePoints([1, 2, 3])).toEqual([1, 2, 3]);
    const sampled = samplePoints(Array.from({ length: 100 }, (_, i) => i));
    expect(sampled).toHaveLength(40);
    expect([sampled[0], sampled.at(-1)]).toEqual([0, 99]);
  });
});

describe("runTool", () => {
  it("rejects bad arguments and unknown tools before calling the data layer", async () => {
    expect(await runTool("get_quote", { market: "JP", symbol: "7203" })).toMatchObject({ reason: "INVALID_TOOL_ARGUMENTS" });
    expect(await runTool("get_quote", { market: "TH", symbol: "PTT; DROP" })).toMatchObject({ reason: "INVALID_TOOL_ARGUMENTS" });
    expect(await runTool("get_price_history", { market: "TH", symbol: "FIXTURE_TH_A", range: "10Y" })).toMatchObject({ reason: "INVALID_TOOL_ARGUMENTS" });
    expect(await runTool("search_stocks", { query: "" })).toMatchObject({ reason: "INVALID_TOOL_ARGUMENTS" });
    expect(await runTool("place_order", {})).toMatchObject({ code: "UNKNOWN_TOOL" });
  });

  it("reports an unknown stock as unavailable and returns the resolved identity with results", async () => {
    expect(await runTool("get_quote", { market: "TH", symbol: "NOPE" })).toEqual({ status: "unavailable", reason: "STOCK_NOT_FOUND" });
    expect(await runTool("get_quote", { market: "TH", symbol: "fixture_th_a" })).toEqual({
      stock: stockIdentityFixture.data,
      result: { status: "unavailable", reason: "QUOTE_UNAVAILABLE" },
    });
    expect(await runTool("search_stocks", { query: " PTT " })).toMatchObject({ data: { query: "PTT" } });
  });

  it("thins price history but reports exact range figures from the full series", async () => {
    const out = await runTool("get_price_history", { market: "TH", symbol: "FIXTURE_TH_A", range: "1Y" }) as {
      result: { summary: unknown; data: { points: { sourceAsOf: string }[] } };
    };
    expect(out.result.data.points).toHaveLength(40);
    expect(out.result.data.points.some((p) => p.sourceAsOf === "T50")).toBe(false);
    expect(out.result.summary).toEqual({
      first: { sourceAsOf: "T0", value: 1 },
      last: { sourceAsOf: "T99", value: 100 },
      high: { sourceAsOf: "T50", value: 1000 },
      low: { sourceAsOf: "T0", value: 1 },
      changePercent: 9900,
    });
  });
});
