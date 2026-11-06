import { describe, expect, it } from "vitest";
import * as fixtures from "./fixtures";
import {
  DailyBriefLookupSchema, NumericValueSchema, SessionHistorySchema,
  StockIdentitySchema, StockSummaryLookupSchema, TimestampSchema,
} from "./index";

describe("identity and provenance contracts", () => {
  it("keeps a company distinct from its listings, market, and exchange", () => {
    const stock = fixtures.stockIdentityFixture.data;
    const secondListing = StockIdentitySchema.parse({
      company: stock.company,
      listing: { ...stock.listing, market: "US", symbol: "FIXTURE_SECOND_LISTING", exchangeId: "FIXTURE_OTHER_EXCHANGE" },
    });
    expect(secondListing.company.companyId).toBe(stock.company.companyId);
    expect(secondListing.listing).not.toEqual(stock.listing);
    expect(StockIdentitySchema.safeParse({ ...stock, listing: { ...stock.listing, companyId: "OTHER_COMPANY" } }).success).toBe(false);
    expect(StockIdentitySchema.safeParse({ ...stock, listing: { ...stock.listing, market: "SET" } }).success).toBe(false);
  });

  it("requires an explicit timestamp offset and retains separate source and fetch times", () => {
    for (const value of ["2000-01-02T10:00:00+07:00", "2000-01-02T03:00:00Z"]) {
      expect(TimestampSchema.safeParse(value).success).toBe(true);
    }
    for (const value of ["2000-01-02T10:00:00", "2000-02-30T10:00:00+07:00", "yesterday"]) {
      expect(TimestampSchema.safeParse(value).success).toBe(false);
    }
    const source = fixtures.evidenceFixture.data.sources[0];
    expect(source.sourceAsOf).not.toBe(source.fetchedAt);
  });
});

describe("numeric values", () => {
  it("preserves available zero and missing null with a reason", () => {
    expect(NumericValueSchema.parse(fixtures.zeroValueFixture.data).value).toBe(0);
    expect(NumericValueSchema.parse(fixtures.missingValueFixture.data).value).toBeNull();
  });

  it.each([
    { ...fixtures.missingValueFixture.data, value: 0 },
    { ...fixtures.missingValueFixture.data, reason: "" },
    { ...fixtures.zeroValueFixture.data, value: null },
    { ...fixtures.zeroValueFixture.data, reason: "missing" },
    { ...fixtures.zeroValueFixture.data, value: Infinity },
    { ...fixtures.missingValueFixture.data, currency: null },
    { ...fixtures.zeroValueFixture.data, currency: "THB" },
  ])("rejects inconsistent values: %j", (value) => {
    expect(NumericValueSchema.safeParse(value).success).toBe(false);
  });
});

describe("shared publication and private session boundaries", () => {
  it("does not promote a previous-day display fallback to today's context", () => {
    const fallback = fixtures.previousDayBriefLookupFixture.data;
    expect(fallback.todayContext.status).toBe("unavailable");
    expect(DailyBriefLookupSchema.safeParse({ ...fallback, todayContext: fallback.display }).success).toBe(false);
  });

  it("shares one evidence snapshot between Thai and English variants", () => {
    const publication = fixtures.dailyBriefFixture.data;
    expect(Object.keys(publication.variants)).toEqual(["th", "en"]);
    expect(publication.evidence.snapshotId).toBe(fixtures.evidenceFixture.data.snapshotId);
    expect(publication.variants.th.language).toBe("th");
    expect(publication.variants.en.language).toBe("en");
  });

  it("rejects daily summaries for a different date or listing", () => {
    const lookup = fixtures.dailyStockSummaryLookupFixture.data;
    expect(StockSummaryLookupSchema.safeParse({ ...lookup, requestedThaiDate: "2000-01-03" }).success).toBe(false);
    for (const change of [{ symbol: "OTHER" }, { exchangeId: "OTHER" }, { market: "US" }, { companyId: "OTHER" }]) {
      expect(StockSummaryLookupSchema.safeParse({ ...lookup, listing: { ...lookup.listing, ...change } }).success).toBe(false);
    }
  });

  it("keeps ticker mentions separate from explicit stock associations", () => {
    const history = SessionHistorySchema.parse(fixtures.sessionHistoryFixture.data);
    expect(history.conversations).toHaveLength(2);
    const stockHistory = history.conversations.filter((conversation) => conversation.association.linkedListing !== null);
    expect(stockHistory.map((conversation) => conversation.conversationId)).toEqual(["FIXTURE_STOCK_CHAT"]);
    expect(SessionHistorySchema.safeParse({ ...history, holdings: [] }).success).toBe(false);
  });

  it("marks every exported fixture as demo data", () => {
    for (const fixture of Object.values(fixtures)) expect(fixture.fixture).toBe(true);
  });
});
