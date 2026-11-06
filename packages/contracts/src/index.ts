import { z } from "zod";

export const MarketSchema = z.enum(["TH", "US"]);
export const LanguageSchema = z.enum(["th", "en"]);
export const TimestampSchema = z.iso.datetime({ offset: true });
export const ThaiDateSchema = z.iso.date();
const IdSchema = z.string().min(1);

export const CompanySchema = z.strictObject({ companyId: IdSchema, name: IdSchema });
// Accept a complete listing as a lookup key, discarding fields outside the key.
export const ListingKeySchema = z.object({
  market: MarketSchema,
  symbol: IdSchema,
  exchangeId: IdSchema,
});
export const ListingSchema = ListingKeySchema.extend({ companyId: IdSchema }).strict();
export const StockIdentitySchema = z.strictObject({
  company: CompanySchema,
  listing: ListingSchema,
}).refine(({ company, listing }) => company.companyId === listing.companyId, {
  message: "Listing must refer to the identified company",
});

export const SourceSchema = z.strictObject({
  sourceId: IdSchema,
  url: z.url(),
  sourceAsOf: TimestampSchema,
  fetchedAt: TimestampSchema,
});
export const EvidenceSnapshotSchema = z.strictObject({
  snapshotId: IdSchema,
  evidenceCutoff: TimestampSchema,
  sources: z.array(SourceSchema).min(1),
});

const valueMetadata = {
  unit: z.enum(["price-per-share", "shares", "index-points", "percent", "ratio", "currency"]),
  currency: z.enum(["THB", "USD"]).nullable(),
};
export const NumericValueSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("available"), value: z.number().finite(), reason: z.null(), ...valueMetadata,
  }),
  z.strictObject({
    status: z.literal("missing"), value: z.null(), reason: IdSchema, ...valueMetadata,
  }),
]).refine((value) =>
  (value.unit === "price-per-share" || value.unit === "currency")
    ? value.currency !== null : value.currency === null,
{ message: "Money values require a currency; other units must use null" });

export const resultSchema = <T extends z.ZodType>(data: T) => z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("available"), data }),
  z.strictObject({ status: z.literal("unavailable"), reason: IdSchema }),
  z.strictObject({ status: z.literal("error"), code: IdSchema, message: IdSchema }),
]);

const publicationMetadata = {
  publicationId: IdSchema,
  publicationDate: ThaiDateSchema,
  publishedAt: TimestampSchema,
  evidence: EvidenceSnapshotSchema,
};
const briefText = { shortText: IdSchema, fullText: IdSchema };
const bilingualText = z.strictObject({
  th: z.strictObject({ language: z.literal("th"), ...briefText }),
  en: z.strictObject({ language: z.literal("en"), ...briefText }),
});
export const DailyBriefSchema = z.strictObject({
  kind: z.literal("daily-brief"), ...publicationMetadata, variants: bilingualText,
});
export const StockSummarySchema = z.strictObject({
  kind: z.literal("stock-summary"), ...publicationMetadata,
  listing: ListingSchema,
  variants: bilingualText,
});

export const DailyBriefLookupSchema = z.strictObject({
  requestedThaiDate: ThaiDateSchema,
  display: resultSchema(DailyBriefSchema),
  todayContext: resultSchema(DailyBriefSchema),
}).refine(({ requestedThaiDate, todayContext }) =>
  todayContext.status !== "available" || todayContext.data.publicationDate === requestedThaiDate,
{ message: "A display fallback cannot be used as today's AI context" });

export const StockSummaryLookupSchema = z.strictObject({
  requestedThaiDate: ThaiDateSchema,
  listing: ListingSchema,
  result: resultSchema(StockSummarySchema),
}).refine(({ requestedThaiDate, listing, result }) => result.status !== "available" || (
  result.data.publicationDate === requestedThaiDate &&
  result.data.listing.companyId === listing.companyId &&
  result.data.listing.market === listing.market &&
  result.data.listing.symbol === listing.symbol &&
  result.data.listing.exchangeId === listing.exchangeId
), { message: "Daily summary must match the requested Thai date and listing" });

export const ChatAssociationSchema = z.discriminatedUnion("origin", [
  z.strictObject({ origin: z.literal("main"), linkedListing: z.null() }),
  z.strictObject({ origin: z.literal("stock"), linkedListing: ListingSchema }),
]);
export const ChatContextSchema = z.strictObject({
  requestedLanguage: LanguageSchema,
  association: ChatAssociationSchema,
  brief: DailyBriefLookupSchema,
});
export const ConversationSchema = z.strictObject({
  conversationId: IdSchema,
  association: ChatAssociationSchema,
  messages: z.array(z.strictObject({
    role: z.enum(["user", "assistant"]), text: IdSchema, createdAt: TimestampSchema,
  })),
});
export const SessionHistorySchema = z.strictObject({
  schemaVersion: z.literal(1),
  storage: z.literal("sessionStorage"),
  conversations: z.array(ConversationSchema),
});

export const QuoteSchema = z.strictObject({
  listing: ListingSchema,
  price: NumericValueSchema,
  provenance: SourceSchema,
});

export type Company = z.infer<typeof CompanySchema>;
export type ListingKey = z.infer<typeof ListingKeySchema>;
export type Listing = z.infer<typeof ListingSchema>;
export type StockIdentity = z.infer<typeof StockIdentitySchema>;
export type EvidenceSnapshot = z.infer<typeof EvidenceSnapshotSchema>;
export type NumericValue = z.infer<typeof NumericValueSchema>;
export type DailyBriefLookup = z.infer<typeof DailyBriefLookupSchema>;
export type StockSummaryLookup = z.infer<typeof StockSummaryLookupSchema>;
export type ChatContext = z.infer<typeof ChatContextSchema>;
export type SessionHistory = z.infer<typeof SessionHistorySchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type Result<T> =
  | { status: "available"; data: T }
  | { status: "unavailable"; reason: string }
  | { status: "error"; code: string; message: string };

// Internal application ports, not contracts claimed for any external provider.
export interface MarketDataPort {
  identify(listing: ListingKey): Promise<Result<StockIdentity>>;
  quote(listing: ListingKey): Promise<Result<Quote>>;
}

export const GenerationRequestSchema = z.strictObject({
  kind: z.enum(["daily-brief", "stock-summary"]),
  language: LanguageSchema,
  evidence: EvidenceSnapshotSchema,
});
export const GeneratedTextSchema = z.strictObject({
  language: LanguageSchema, evidenceSnapshotId: IdSchema, text: IdSchema,
});
export interface GenerationPort {
  generate(input: z.infer<typeof GenerationRequestSchema>): Promise<Result<z.infer<typeof GeneratedTextSchema>>>;
}
