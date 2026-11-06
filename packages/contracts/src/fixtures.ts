import {
  ChatContextSchema, DailyBriefLookupSchema, DailyBriefSchema, EvidenceSnapshotSchema,
  NumericValueSchema, QuoteSchema, SessionHistorySchema, StockIdentitySchema,
  StockSummaryLookupSchema, StockSummarySchema, resultSchema,
} from "./index";

// All dates are fixed historical examples; none describe a live instrument or publication.
export const stockIdentityFixture = {
  fixture: true,
  data: StockIdentitySchema.parse({
    company: { companyId: "FIXTURE_COMPANY_A", name: "บริษัทตัวอย่าง A (ข้อมูลสาธิต)" },
    listing: {
      companyId: "FIXTURE_COMPANY_A", market: "TH", symbol: "FIXTURE_TH_A", exchangeId: "FIXTURE_EXCHANGE_TH",
    },
  }),
} as const;
export const usStockIdentityFixture = {
  fixture: true,
  data: StockIdentitySchema.parse({
    company: { companyId: "FIXTURE_COMPANY_B", name: "Sample Company B (demo data)" },
    listing: {
      companyId: "FIXTURE_COMPANY_B", market: "US", symbol: "FIXTURE_US_B", exchangeId: "FIXTURE_EXCHANGE_US",
    },
  }),
} as const;
export const evidenceFixture = {
  fixture: true,
  data: EvidenceSnapshotSchema.parse({
    snapshotId: "FIXTURE_EVIDENCE_2000_01_02",
    evidenceCutoff: "2000-01-02T10:00:00+07:00",
    sources: [{
      sourceId: "FIXTURE_SOURCE", url: "https://example.invalid/fixture-source",
      sourceAsOf: "2000-01-01T16:00:00+07:00", fetchedAt: "2000-01-02T09:59:00+07:00",
    }],
  }),
} as const;
export const missingValueFixture = {
  fixture: true,
  data: NumericValueSchema.parse({
    status: "missing", value: null, reason: "FIXTURE_ONLY", unit: "price-per-share", currency: "THB",
  }),
} as const;
export const zeroValueFixture = {
  fixture: true,
  data: NumericValueSchema.parse({
    status: "available", value: 0, reason: null, unit: "shares", currency: null,
  }),
} as const;
export const quoteFixture = {
  fixture: true,
  data: QuoteSchema.parse({
    listing: stockIdentityFixture.data.listing,
    price: missingValueFixture.data,
    provenance: evidenceFixture.data.sources[0],
  }),
} as const;
export const unavailableFixture = {
  fixture: true,
  data: resultSchema(StockIdentitySchema).parse({ status: "unavailable", reason: "FIXTURE_ONLY" }),
} as const;
export const errorFixture = {
  fixture: true,
  data: resultSchema(StockIdentitySchema).parse({
    status: "error", code: "FIXTURE_ERROR", message: "Simulated error example; no provider was called",
  }),
} as const;

const variants = {
  th: { language: "th", shortText: "ตัวอย่างโครงสร้างเท่านั้น", fullText: "ข้อมูลสาธิต ไม่มีบทวิเคราะห์หรือข่าวจริง" },
  en: { language: "en", shortText: "Structure example only", fullText: "Demo data; no real analysis or news" },
};
export const dailyBriefFixture = {
  fixture: true,
  data: DailyBriefSchema.parse({
    kind: "daily-brief", publicationId: "FIXTURE_BRIEF_2000_01_02",
    publicationDate: "2000-01-02", publishedAt: "2000-01-02T10:01:00+07:00",
    evidence: evidenceFixture.data, variants,
  }),
} as const;
export const currentDayBriefLookupFixture = {
  fixture: true,
  data: DailyBriefLookupSchema.parse({
    requestedThaiDate: "2000-01-02",
    display: { status: "available", data: dailyBriefFixture.data },
    todayContext: { status: "available", data: dailyBriefFixture.data },
  }),
} as const;
export const previousDayBriefLookupFixture = {
  fixture: true,
  data: DailyBriefLookupSchema.parse({
    requestedThaiDate: "2000-01-03",
    display: { status: "available", data: dailyBriefFixture.data },
    todayContext: { status: "unavailable", reason: "TODAY_NOT_PUBLISHED" },
  }),
} as const;
export const stockSummaryFixture = {
  fixture: true,
  data: StockSummarySchema.parse({
    kind: "stock-summary", publicationId: "FIXTURE_SUMMARY_2000_01_02",
    publicationDate: "2000-01-02", publishedAt: "2000-01-02T10:01:00+07:00",
    evidence: evidenceFixture.data, listing: stockIdentityFixture.data.listing, variants,
  }),
} as const;
export const dailyStockSummaryLookupFixture = {
  fixture: true,
  data: StockSummaryLookupSchema.parse({
    requestedThaiDate: "2000-01-02", listing: stockIdentityFixture.data.listing,
    result: { status: "available", data: stockSummaryFixture.data },
  }),
} as const;
export const chatContextFixture = {
  fixture: true,
  data: ChatContextSchema.parse({
    requestedLanguage: "th",
    association: { origin: "stock", linkedListing: stockIdentityFixture.data.listing },
    brief: currentDayBriefLookupFixture.data,
  }),
} as const;
export const sessionHistoryFixture = {
  fixture: true,
  data: SessionHistorySchema.parse({
    schemaVersion: 1, storage: "sessionStorage",
    conversations: [
      {
        conversationId: "FIXTURE_GENERAL_CHAT",
        association: { origin: "main", linkedListing: null },
        messages: [{ role: "user", text: "ตัวอย่างข้อความที่กล่าวถึง FIXTURE_TH_A โดยไม่ได้เชื่อมโยงหุ้น", createdAt: "2000-01-02T10:02:00+07:00" }],
      },
      {
        conversationId: "FIXTURE_STOCK_CHAT",
        association: { origin: "stock", linkedListing: stockIdentityFixture.data.listing },
        messages: [{ role: "user", text: "ตัวอย่างคำถามจากหน้าหุ้น ไม่มีคำตอบ AI", createdAt: "2000-01-02T10:03:00+07:00" }],
      },
    ],
  }),
} as const;
