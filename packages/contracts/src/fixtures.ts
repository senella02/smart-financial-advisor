import {
  ChatContextSchema, DailyBriefLookupSchema, DailyBriefSchema, EvidenceSnapshotSchema,
  NumericValueSchema, QuoteSchema, SessionHistorySchema, StockIdentitySchema,
  StockSummaryLookupSchema, StockSummarySchema, resultSchema,
  MarketOverviewSchema, PriceHistorySchema, FinancialStatementSchema, FinancialMetricsSchema,
  NewsItemSchema, RetrievedEvidenceSchema, ChatRequestSchema, ChatResponseSchema,
  PublicationJobSchema, IngestionJobSchema, BriefFollowUpsSchema,
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

const unavailable = { status: "unavailable", reason: "FIXTURE_ONLY" } as const;
export const marketOverviewFixture = {
  fixture: true,
  data: MarketOverviewSchema.parse({
    SET: unavailable, SET50: unavailable, DOW_JONES: unavailable, SP_500: unavailable, NASDAQ: unavailable,
  }),
} as const;
export const priceHistoryFixture = {
  fixture: true,
  data: resultSchema(PriceHistorySchema).parse(unavailable),
} as const;
export const financialStatementsFixture = {
  fixture: true,
  data: resultSchema(FinancialStatementSchema.array()).parse(unavailable),
} as const;
export const financialMetricsFixture = {
  fixture: true,
  data: FinancialMetricsSchema.parse({
    listing: stockIdentityFixture.data.listing,
    metrics: { pe: unavailable, pbv: unavailable, roe: unavailable, debtToEquity: unavailable, dividendYield: unavailable, marketCap: unavailable },
  }),
} as const;
export const newsFixture = {
  fixture: true,
  data: NewsItemSchema.parse({
    newsId: "FIXTURE_NEWS", headline: "Structure example; no real news", language: "en",
    publishedAt: "2000-01-01T16:00:00+07:00", source: evidenceFixture.data.sources[0],
    listings: [stockIdentityFixture.data.listing],
  }),
} as const;
export const retrievedEvidenceFixture = {
  fixture: true,
  data: RetrievedEvidenceSchema.parse({
    snapshot: evidenceFixture.data,
    passages: [{
      passageId: "FIXTURE_PASSAGE", sourceId: "FIXTURE_SOURCE",
      text: "This fixture has no financial data or investment analysis.", locator: "fixture paragraph 1",
      listing: stockIdentityFixture.data.listing, period: null,
    }],
  }),
} as const;
export const chatRequestFixture = {
  fixture: true,
  data: ChatRequestSchema.parse({
    requestId: "FIXTURE_REQUEST", conversationId: "FIXTURE_STOCK_CHAT", language: "en",
    association: chatContextFixture.data.association, message: "What does this demo contain?",
  }),
} as const;
export const chatResponseFixture = {
  fixture: true,
  data: ChatResponseSchema.parse({
    status: "answered",
    answer: {
      requestId: "FIXTURE_REQUEST", language: "en", createdAt: "2000-01-02T10:04:00+07:00",
      evidence: retrievedEvidenceFixture.data,
      claims: [{ text: "This demo has no financial data or investment analysis.", passageIds: ["FIXTURE_PASSAGE"] }],
      limitations: ["FIXTURE_ONLY: structural example, not an AI-generated financial answer"],
    },
  }),
} as const;
export const clarificationFixture = {
  fixture: true,
  data: ChatResponseSchema.parse({
    status: "clarification", requestId: "FIXTURE_REQUEST", language: "en", question: "Which company do you mean?",
  }),
} as const;
export const unavailableChatFixture = {
  fixture: true,
  data: ChatResponseSchema.parse({
    status: "unavailable", requestId: "FIXTURE_REQUEST", language: "en", reason: "FIXTURE_ONLY_NO_GENERATION",
  }),
} as const;
export const publicationJobFixture = {
  fixture: true,
  data: PublicationJobSchema.parse({ kind: "daily-brief", jobId: "FIXTURE_JOB", requestedThaiDate: "2000-01-02" }),
} as const;
export const stockSummaryJobFixture = {
  fixture: true,
  data: PublicationJobSchema.parse({
    kind: "stock-summary", jobId: "FIXTURE_SUMMARY_JOB", requestedThaiDate: "2000-01-02",
    listing: { market: "TH", symbol: "FIXTURE_TH_A", exchangeId: "FIXTURE_EXCHANGE_TH" },
  }),
} as const;
export const ingestionJobFixture = {
  fixture: true,
  data: IngestionJobSchema.parse({ kind: "ingestion", jobId: "FIXTURE_INGESTION", sourceIds: ["FIXTURE_SOURCE"] }),
} as const;
export const briefFollowUpsFixture = {
  fixture: true,
  data: BriefFollowUpsSchema.parse({
    publicationId: dailyBriefFixture.data.publicationId,
    publicationDate: dailyBriefFixture.data.publicationDate,
    cards: [{
      cardId: "FIXTURE_CARD",
      variants: {
        th: { title: "ข้อมูลสาธิต", question: "ข้อมูลสาธิตนี้มีอะไรบ้าง?" },
        en: { title: "Demo content", question: "What does this demo contain?" },
      },
    }],
  }),
} as const;
