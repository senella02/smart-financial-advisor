import {
  MarketOverviewSchema,
  NewsItemSchema,
  QuoteSchema,
  StockIdentitySchema,
  StockSearchResultSchema,
  type ChartRangeSchema,
  type FinancialMetricsSchema,
  type FinancialStatementSchema,
  type IndexQuote,
  type ListingKey,
  type MarketOverview,
  type NewsItem,
  type NumericValue,
  type PriceHistorySchema,
  type Quote,
  type ResearchDataPort,
  type Result,
  type StockIdentity,
  type StockSearchResult,
} from "@sfa/contracts";
import { formatBangkokTimestamp } from "../publication-store";

type PriceHistory = ReturnType<typeof PriceHistorySchema.parse>;
type FinancialStatement = ReturnType<typeof FinancialStatementSchema.parse>;
type FinancialMetrics = ReturnType<typeof FinancialMetricsSchema.parse>;
type ChartRange = ReturnType<typeof ChartRangeSchema.parse>;
type MarketIndexKey = keyof MarketOverview;

interface IndexFeedConfig {
  key: MarketIndexKey;
  yahooSymbol: string;
  yahooQuoteUrl: string;
  googleQuoteId: string;
}

const INDEX_FEEDS: IndexFeedConfig[] = [
  {
    key: "SET",
    yahooSymbol: "^SET.BK",
    yahooQuoteUrl: "https://finance.yahoo.com/quote/%5ESET.BK/",
    googleQuoteId: "SET:INDEXBKK",
  },
  {
    key: "SET50",
    yahooSymbol: "^SET50.BK",
    yahooQuoteUrl: "https://finance.yahoo.com/quote/%5ESET50.BK/",
    googleQuoteId: "SET50:INDEXBKK",
  },
  {
    key: "DOW_JONES",
    yahooSymbol: "^DJI",
    yahooQuoteUrl: "https://finance.yahoo.com/quote/%5EDJI/",
    googleQuoteId: ".DJI:INDEXDJX",
  },
  {
    key: "SP_500",
    yahooSymbol: "^GSPC",
    yahooQuoteUrl: "https://finance.yahoo.com/quote/%5EGSPC/",
    googleQuoteId: ".INX:INDEXSP",
  },
  {
    key: "NASDAQ",
    yahooSymbol: "^IXIC",
    yahooQuoteUrl: "https://finance.yahoo.com/quote/%5EIXIC/",
    googleQuoteId: ".IXIC:INDEXNASDAQ",
  },
];

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept-Language": "th,en-US;q=0.9,en;q=0.8",
};

const US_EXCHANGES = new Set(["NMS", "NYQ", "NGM", "NCM", "ASE", "PCX", "YHD"]);

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const GLOBAL_CACHE = new Map<string, CacheEntry>();
const IN_FLIGHT_PROMISES = new Map<string, Promise<unknown>>();

function toYahooTicker(listing: ListingKey): string {
  if (listing.market === "TH") {
    return listing.symbol.endsWith(".BK") ? listing.symbol : `${listing.symbol}.BK`;
  }
  return listing.symbol;
}

/**
 * Fetch with single-flight promise coalescing and optional in-memory TTL cache.
 * Set `ttlMs <= 0` or `bypassCache: true` to force a fresh network request.
 */
async function cachedFetchJson<T>(
  url: string,
  ttlMs: number,
  options?: { bypassCache?: boolean },
): Promise<T> {
  const bypass = options?.bypassCache || ttlMs <= 0;
  const now = Date.now();
  if (!bypass) {
    const cached = GLOBAL_CACHE.get(url);
    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }
    const existing = IN_FLIGHT_PROMISES.get(url);
    if (existing) {
      return existing as Promise<T>;
    }
  }

  const promise = (async () => {
    try {
      const res = await fetch(url, {
        headers: { ...BROWSER_HEADERS, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`HTTP_${res.status}`);
      }
      const data: unknown = await res.json();
      if (!bypass) {
        GLOBAL_CACHE.set(url, { data, expiresAt: Date.now() + ttlMs });
      }
      return data as T;
    } finally {
      if (!bypass) {
        IN_FLIGHT_PROMISES.delete(url);
      }
    }
  })();

  if (!bypass) {
    IN_FLIGHT_PROMISES.set(url, promise);
  }
  return promise;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        longName?: string;
        shortName?: string;
        exchangeName?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketTime?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
  };
}

interface YahooSearchResponse {
  quotes?: Array<{
    symbol?: string;
    exchange?: string;
    quoteType?: string;
    longname?: string;
    shortname?: string;
    exchDisp?: string;
  }>;
  news?: Array<{
    uuid?: string;
    title?: string;
    link?: string;
    publisher?: string;
    providerPublishTime?: number;
  }>;
}

function makeNumericAvailable(
  value: number,
  unit: "index-points" | "percent",
): NumericValue {
  return {
    status: "available",
    value: Number(value.toFixed(4)),
    reason: null,
    unit,
    currency: null,
  };
}

function makeNumericMissing(
  reason: string,
  unit: "index-points" | "percent",
): NumericValue {
  return {
    status: "missing",
    value: null,
    reason,
    unit,
    currency: null,
  };
}

function buildIndexQuoteSlot(input: {
  price: number;
  previousClose: number | null;
  sourceAsOf: string;
  fetchedAt: string;
  sourceId: string;
  url: string;
}): Result<IndexQuote> {
  if (!Number.isFinite(input.price) || input.price <= 0) {
    return { status: "unavailable", reason: "INVALID_UPSTREAM_PRICE" };
  }

  let change: NumericValue = makeNumericMissing("CHANGE_UNAVAILABLE", "index-points");
  let changePercent: NumericValue = makeNumericMissing("CHANGE_UNAVAILABLE", "percent");

  if (
    input.previousClose !== null &&
    Number.isFinite(input.previousClose) &&
    input.previousClose > 0
  ) {
    const diff = input.price - input.previousClose;
    const pct = (diff / input.previousClose) * 100;
    change = makeNumericAvailable(diff, "index-points");
    changePercent = makeNumericAvailable(pct, "percent");
  }

  return {
    status: "available",
    data: {
      value: makeNumericAvailable(input.price, "index-points"),
      change,
      changePercent,
      provenance: {
        sourceId: input.sourceId,
        url: input.url,
        sourceAsOf: input.sourceAsOf,
        fetchedAt: input.fetchedAt,
      },
    },
  };
}

async function fetchYahooIndex(
  config: IndexFeedConfig,
  fetchedAt: string,
  options?: { bypassCache?: boolean },
): Promise<Result<IndexQuote>> {
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    config.yahooSymbol,
  )}?interval=1d&range=5d`;
  const payload = await cachedFetchJson<YahooChartResponse>(endpoint, 20_000, options);
  const result = payload.chart?.result?.[0];
  const meta = result?.meta;
  if (
    !meta ||
    typeof meta.regularMarketPrice !== "number" ||
    !Number.isFinite(meta.regularMarketPrice)
  ) {
    throw new Error(`Yahoo missing regularMarketPrice for ${config.yahooSymbol}`);
  }

  const price = meta.regularMarketPrice;
  const marketTimeMs =
    typeof meta.regularMarketTime === "number" && Number.isFinite(meta.regularMarketTime)
      ? meta.regularMarketTime * 1000
      : Date.now();
  const sourceAsOf = formatBangkokTimestamp(new Date(marketTimeMs));

  let previousClose: number | null =
    typeof meta.previousClose === "number" && Number.isFinite(meta.previousClose)
      ? meta.previousClose
      : null;

  if (previousClose === null) {
    const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
      (n): n is number => typeof n === "number" && Number.isFinite(n),
    );
    if (closes.length >= 2) {
      previousClose = closes[closes.length - 2];
    } else if (
      typeof meta.chartPreviousClose === "number" &&
      Number.isFinite(meta.chartPreviousClose)
    ) {
      previousClose = meta.chartPreviousClose;
    }
  }

  return buildIndexQuoteSlot({
    price,
    previousClose,
    sourceAsOf,
    fetchedAt,
    sourceId: `YAHOO_${config.key}`,
    url: config.yahooQuoteUrl,
  });
}

async function fetchGoogleFinanceIndex(
  config: IndexFeedConfig,
  fetchedAt: string,
): Promise<Result<IndexQuote>> {
  const pageUrl = `https://www.google.com/finance/quote/${encodeURIComponent(config.googleQuoteId)}?hl=en`;
  const response = await fetch(pageUrl, {
    headers: { ...BROWSER_HEADERS, Accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Google Finance HTTP ${response.status} for ${config.googleQuoteId}`);
  }

  const html = await response.text();
  const priceMatch = html.match(/data-last-price="([0-9]+(?:\.[0-9]+)?)"/);
  if (!priceMatch) {
    throw new Error(`Google Finance missing data-last-price for ${config.googleQuoteId}`);
  }
  const price = Number.parseFloat(priceMatch[1]);

  const tsMatch = html.match(/data-last-normal-market-timestamp="([0-9]+)"/);
  const marketTimeMs = tsMatch ? Number.parseInt(tsMatch[1], 10) * 1000 : Date.now();
  const sourceAsOf = formatBangkokTimestamp(new Date(marketTimeMs));

  let previousClose: number | null = null;
  const prevMatch = html.match(/Previous close[\s\S]{0,250}?>\s*([0-9,]+(?:\.[0-9]+)?)\s*</i);
  if (prevMatch) {
    const parsedPrev = Number.parseFloat(prevMatch[1].replace(/,/g, ""));
    if (Number.isFinite(parsedPrev) && parsedPrev > 0) {
      previousClose = parsedPrev;
    }
  }

  return buildIndexQuoteSlot({
    price,
    previousClose,
    sourceAsOf,
    fetchedAt,
    sourceId: `GFIN_${config.key}`,
    url: `https://www.google.com/finance/quote/${config.googleQuoteId}`,
  });
}

async function fetchSingleIndex(
  config: IndexFeedConfig,
  fetchedAt: string,
  options?: { bypassCache?: boolean },
): Promise<Result<IndexQuote>> {
  try {
    return await fetchYahooIndex(config, fetchedAt, options);
  } catch {
    try {
      return await fetchGoogleFinanceIndex(config, fetchedAt);
    } catch {
      return {
        status: "unavailable",
        reason: "UPSTREAM_INDEX_UNAVAILABLE",
      };
    }
  }
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;|&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagValue(block: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = block.match(regex);
  return match ? decodeXmlEntities(match[1]) : null;
}

function detectLanguage(text: string): "th" | "en" {
  return /[\u0E00-\u0E7F]/.test(text) ? "th" : "en";
}

function makeEncodedPublisherSourceId(publisherName: string, index: number): string {
  const cleanName = publisherName.replace(/::/g, " ").trim() || "Market Source";
  return `SRC_PUB_${encodeURIComponent(cleanName)}::${index}`;
}

interface ParsedRssCandidate {
  headline: string;
  url: string;
  publisherName: string;
  publishedAt: string;
  language: "th" | "en";
}

function parseRssFeed(xml: string, defaultPublisher: string): ParsedRssCandidate[] {
  const items: ParsedRssCandidate[] = [];
  const itemMatches = xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi);
  for (const match of itemMatches) {
    const block = match[1];
    const rawTitle = extractTagValue(block, "title");
    const link = extractTagValue(block, "link");
    const pubDateRaw = extractTagValue(block, "pubDate");
    const sourceMatch = block.match(/<source(?:\s+url="([^"]*)")?[^>]*>([\s\S]*?)<\/source>/i);
    const publisherName = sourceMatch
      ? decodeXmlEntities(sourceMatch[2]) || defaultPublisher
      : defaultPublisher;

    if (!rawTitle || !link || !link.startsWith("http")) continue;

    let headline = rawTitle;
    if (publisherName && headline.endsWith(` - ${publisherName}`)) {
      headline = headline.slice(0, headline.length - ` - ${publisherName}`.length).trim();
    }
    if (!headline) continue;

    const parsedDateMs = pubDateRaw ? Date.parse(pubDateRaw) : Number.NaN;
    const publishedDate = Number.isFinite(parsedDateMs) ? new Date(parsedDateMs) : new Date();
    const publishedAt = formatBangkokTimestamp(publishedDate);

    items.push({
      headline,
      url: link,
      publisherName,
      publishedAt,
      language: detectLanguage(headline),
    });
  }
  return items;
}

async function fetchRssSafe(
  feedUrl: string,
  defaultPublisher: string,
): Promise<ParsedRssCandidate[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: { ...BROWSER_HEADERS, Accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const xml = await response.text();
    return parseRssFeed(xml, defaultPublisher);
  } catch {
    return [];
  }
}

async function fetchFinnhubOptionalNews(apiKey: string): Promise<ParsedRssCandidate[]> {
  try {
    const endpoint = `https://finnhub.io/api/v1/news?category=general&token=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const rows = (await response.json()) as Array<{
      headline?: string;
      url?: string;
      source?: string;
      datetime?: number;
    }>;
    return rows
      .filter(
        (r): r is { headline: string; url: string; source?: string; datetime?: number } =>
          typeof r.headline === "string" &&
          typeof r.url === "string" &&
          r.url.startsWith("http"),
      )
      .slice(0, 8)
      .map((r) => ({
        headline: r.headline.trim(),
        url: r.url,
        publisherName: r.source?.trim() || "Finnhub",
        publishedAt: formatBangkokTimestamp(
          typeof r.datetime === "number" ? new Date(r.datetime * 1000) : new Date(),
        ),
        language: detectLanguage(r.headline),
      }));
  } catch {
    return [];
  }
}

const RSS_FEEDS: Array<{ url: string; defaultPublisher: string; maxItems: number }> = [
  {
    url: "https://news.google.com/rss/search?q=%E0%B8%AB%E0%B8%B8%E0%B9%89%E0%B8%99%E0%B9%84%E0%B8%97%E0%B8%A2+OR+%22SET+Index%22+OR+%E0%B8%98%E0%B8%9B%E0%B8%97.+OR+%E0%B8%81%E0%B8%99%E0%B8%87.+OR+%E0%B9%80%E0%B8%A8%E0%B8%A3%E0%B8%A9%E0%B8%90%E0%B8%81%E0%B8%B4%E0%B8%88%E0%B9%84%E0%B8%97%E0%B8%A2&hl=th&gl=TH&ceid=TH:th",
    defaultPublisher: "Google News Thailand",
    maxItems: 6,
  },
  {
    url: "https://news.google.com/rss/search?q=%22S%26P+500%22+OR+%22Federal+Reserve%22+OR+%22Dow+Jones%22+OR+Nasdaq+OR+%22Treasury+yield%22+OR+%22oil+prices%22&hl=en-US&gl=US&ceid=US:en",
    defaultPublisher: "Google News US",
    maxItems: 6,
  },
  {
    url: "https://finance.yahoo.com/news/rssindex",
    defaultPublisher: "Yahoo Finance",
    maxItems: 4,
  },
];

function isAcceptableNewsItem(item: ParsedRssCandidate): boolean {
  if (/[^\u0000-\u024F\u0E00-\u0E7F\u2000-\u206F]/.test(item.headline)) {
    return false;
  }
  if (/[^\u0000-\u024F\u0E00-\u0E7F\u2000-\u206F]/.test(item.publisherName)) {
    return false;
  }
  if (/Minervini Trend Template/i.test(item.headline)) {
    return false;
  }
  return true;
}

/** Shared SFA-6 / SFA-4 live `ResearchDataPort` implementation backed by Yahoo Finance, Google Finance, and public news RSS feeds. */
export class LiveMarketDataAdapter implements ResearchDataPort {
  async identify(listing: ListingKey): Promise<Result<StockIdentity>> {
    try {
      const ticker = toYahooTicker(listing);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const json = await cachedFetchJson<YahooChartResponse>(url, 300_000);
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) {
        return { status: "unavailable", reason: "STOCK_NOT_FOUND" };
      }

      const companyName = meta.longName || meta.shortName || listing.symbol;
      const identity = StockIdentitySchema.parse({
        company: {
          companyId: `${listing.market}_${listing.symbol}`,
          name: companyName,
        },
        listing: {
          companyId: `${listing.market}_${listing.symbol}`,
          market: listing.market,
          symbol: listing.symbol,
          exchangeId: meta.exchangeName || (listing.market === "TH" ? "SET" : "US"),
        },
      });

      return { status: "available", data: identity };
    } catch (err) {
      return {
        status: "error",
        code: "FETCH_FAILED",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async quote(listing: ListingKey): Promise<Result<Quote>> {
    try {
      const ticker = toYahooTicker(listing);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const fetchedAt = new Date().toISOString();
      const json = await cachedFetchJson<YahooChartResponse>(url, 60_000);
      const result = json?.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta || meta.regularMarketPrice == null) {
        return { status: "unavailable", reason: "QUOTE_UNAVAILABLE" };
      }

      const sourceAsOf = meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : fetchedAt;

      const currency = listing.market === "TH" ? "THB" : "USD";
      const quote = QuoteSchema.parse({
        listing: {
          companyId: `${listing.market}_${listing.symbol}`,
          market: listing.market,
          symbol: listing.symbol,
          exchangeId: meta.exchangeName || (listing.market === "TH" ? "SET" : "US"),
        },
        price: {
          status: "available",
          value: Number(meta.regularMarketPrice),
          unit: "price-per-share",
          currency,
          reason: null,
        },
        provenance: {
          sourceId: "YAHOO_FINANCE",
          url: `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`,
          sourceAsOf,
          fetchedAt,
        },
      });

      return { status: "available", data: quote };
    } catch (err) {
      return {
        status: "error",
        code: "QUOTE_FETCH_FAILED",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async search(query: string): Promise<Result<StockSearchResult>> {
    try {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
      const json = await cachedFetchJson<YahooSearchResponse>(url, 300_000);
      const quotes = json?.quotes ?? [];

      const matches: StockSearchResult["matches"] = [];
      for (const q of quotes) {
        const symbol = q.symbol || "";
        const exchange = q.exchange || "";
        const quoteType = q.quoteType || "";

        let market: "TH" | "US" | null = null;
        let cleanSymbol = symbol;

        if (exchange === "SET" || symbol.endsWith(".BK")) {
          market = "TH";
          cleanSymbol = symbol.replace(/\.BK$/, "");
        } else if (US_EXCHANGES.has(exchange)) {
          market = "US";
        }

        if (market && quoteType === "EQUITY" && cleanSymbol) {
          matches.push({
            listing: {
              companyId: `${market}_${cleanSymbol}`,
              market,
              symbol: cleanSymbol,
              exchangeId: exchange || (market === "TH" ? "SET" : "US"),
            },
            name: q.longname || q.shortname || cleanSymbol,
            instrumentType: quoteType,
            exchangeDisplay: q.exchDisp || exchange,
          });
        }
      }

      const data = StockSearchResultSchema.parse({
        query,
        matches,
        isAmbiguous: matches.length > 1,
      });
      return { status: "available", data };
    } catch (err) {
      return {
        status: "error",
        code: "SEARCH_FAILED",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async indices(options?: { bypassCache?: boolean; now?: Date }): Promise<Result<MarketOverview>> {
    try {
      const fetchedAt = formatBangkokTimestamp(options?.now ?? new Date());
      const settled = await Promise.all(
        INDEX_FEEDS.map(async (config) => ({
          key: config.key,
          slot: await fetchSingleIndex(config, fetchedAt, {
            bypassCache: options?.bypassCache,
          }),
        })),
      );

      const rawOverview: Record<string, Result<IndexQuote>> = {};
      for (const entry of settled) {
        rawOverview[entry.key] = entry.slot;
      }

      const validated = MarketOverviewSchema.parse(rawOverview) as MarketOverview;
      return { status: "available", data: validated };
    } catch (err) {
      return {
        status: "error",
        code: "INDICES_FETCH_FAILED",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async priceHistory(
    listing: ListingKey,
    range: ChartRange,
  ): Promise<Result<PriceHistory>> {
    try {
      const ticker = toYahooTicker(listing);
      const yahooRangeMap: Record<ChartRange, { range: string; interval: string }> = {
        "1D": { range: "1d", interval: "5m" },
        "1M": { range: "1mo", interval: "1d" },
        "1Y": { range: "1y", interval: "1d" },
        "5Y": { range: "5y", interval: "1wk" },
      };

      const params = yahooRangeMap[range] || { range: "1y", interval: "1d" };
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${params.range}&interval=${params.interval}`;
      const fetchedAt = new Date().toISOString();
      const json = await cachedFetchJson<YahooChartResponse>(url, 60_000);
      const result = json?.chart?.result?.[0];
      const timestamps = result?.timestamp ?? [];
      const quotes = result?.indicators?.quote?.[0];
      const closes = quotes?.close ?? [];
      const volumes = quotes?.volume ?? [];

      if (timestamps.length === 0 || closes.length === 0) {
        return { status: "unavailable", reason: "NO_PRICE_HISTORY" };
      }

      const currency = listing.market === "TH" ? "THB" : "USD";
      const points: PriceHistory["points"] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const c = closes[i];
        const v = volumes[i];
        if (c != null && !Number.isNaN(c)) {
          points.push({
            sourceAsOf: new Date(timestamps[i] * 1000).toISOString(),
            price: {
              status: "available",
              value: Number(c),
              unit: "price-per-share",
              currency,
              reason: null,
            },
            volume: {
              status: "available",
              value: v != null ? Number(v) : 0,
              unit: "shares",
              currency: null,
              reason: null,
            },
          });
        }
      }

      if (points.length === 0) {
        return { status: "unavailable", reason: "VALID_POINTS_EMPTY" };
      }

      return {
        status: "available",
        data: {
          listing: {
            companyId: `${listing.market}_${listing.symbol}`,
            market: listing.market,
            symbol: listing.symbol,
            exchangeId: listing.exchangeId,
          },
          range,
          points,
          provenance: {
            sourceId: "YAHOO_FINANCE",
            url: `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`,
            sourceAsOf: points[points.length - 1].sourceAsOf,
            fetchedAt,
          },
        },
      };
    } catch (err) {
      return {
        status: "error",
        code: "HISTORY_FETCH_FAILED",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async statements(): Promise<Result<FinancialStatement[]>> {
    return {
      status: "unavailable",
      reason: "PROVIDER_RESTRICTED",
    };
  }

  async metrics(): Promise<Result<FinancialMetrics>> {
    return {
      status: "unavailable",
      reason: "PROVIDER_RESTRICTED",
    };
  }

  async news(listing: ListingKey): Promise<Result<NewsItem[]>> {
    try {
      const ticker = toYahooTicker(listing);
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=0&newsCount=5`;
      const fetchedAt = new Date().toISOString();
      const json = await cachedFetchJson<YahooSearchResponse>(url, 60_000);
      const rawNews = json?.news ?? [];

      const newsItems: NewsItem[] = [];
      for (const item of rawNews) {
        if (item.title && item.link && item.link.startsWith("http")) {
          const pubTime = item.providerPublishTime
            ? new Date(item.providerPublishTime * 1000).toISOString()
            : fetchedAt;

          newsItems.push(
            NewsItemSchema.parse({
              newsId: item.uuid || `NEWS_${Math.random().toString(36).substring(2, 9)}`,
              headline: item.title,
              language: "en",
              publishedAt: pubTime,
              source: {
                sourceId: item.publisher || "YAHOO_FINANCE",
                url: item.link,
                sourceAsOf: pubTime,
                fetchedAt,
              },
              listings: [
                {
                  companyId: `${listing.market}_${listing.symbol}`,
                  market: listing.market,
                  symbol: listing.symbol,
                  exchangeId: listing.exchangeId,
                },
              ],
            }),
          );
        }
      }

      return { status: "available", data: newsItems };
    } catch (err) {
      return {
        status: "error",
        code: "NEWS_FETCH_FAILED",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async marketNews(now = new Date()): Promise<Result<NewsItem[]>> {
    try {
      const fetchedAt = formatBangkokTimestamp(now);
      const finnhubKey = process.env.FINNHUB_API_KEY;
      const rssBuckets = await Promise.all(
        RSS_FEEDS.map(async (feed) => {
          const raw = await fetchRssSafe(feed.url, feed.defaultPublisher);
          return raw
            .filter(isAcceptableNewsItem)
            .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
            .slice(0, feed.maxItems);
        }),
      );
      if (finnhubKey) {
        const fh = (await fetchFinnhubOptionalNews(finnhubKey))
          .filter(isAcceptableNewsItem)
          .slice(0, 4);
        rssBuckets.push(fh);
      }

      const combined: ParsedRssCandidate[] = [];
      const seenHeadlines = new Set<string>();
      const maxLen = Math.max(0, ...rssBuckets.map((arr) => arr.length));
      for (let i = 0; i < maxLen; i += 1) {
        for (const feedItems of rssBuckets) {
          const candidate = feedItems[i];
          if (!candidate) continue;
          const normKey = candidate.headline.toLowerCase();
          if (seenHeadlines.has(normKey)) continue;
          seenHeadlines.add(normKey);
          combined.push(candidate);
        }
      }

      const selectedItems = combined.slice(0, 16);
      if (selectedItems.length === 0) {
        return {
          status: "unavailable",
          reason: "UPSTREAM_MARKET_NEWS_UNAVAILABLE",
        };
      }

      const validated: NewsItem[] = selectedItems.map((item, idx) =>
        NewsItemSchema.parse({
          newsId: `LIVE_NEWS_${now.getTime()}_${idx + 1}`,
          headline: item.headline,
          language: item.language,
          publishedAt: item.publishedAt,
          source: {
            sourceId: makeEncodedPublisherSourceId(item.publisherName, idx + 1),
            url: item.url,
            sourceAsOf: item.publishedAt,
            fetchedAt,
          },
          listings: [],
        }),
      );

      return { status: "available", data: validated };
    } catch (error) {
      return {
        status: "error",
        code: "LIVE_NEWS_FETCH_FAILED",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const liveMarketData = new LiveMarketDataAdapter();

/**
 * Returns true when tests or explicit SFA_USE_FIXTURES=1 forbid live external network calls.
 */
export function isFixtureMode(): boolean {
  return (
    process.env.SFA_USE_FIXTURES === "1" ||
    process.env.VITEST === "true" ||
    process.env.NODE_ENV === "test"
  );
}

/** Delegates Home 5-index overview retrieval to SFA-6's `liveMarketData.indices()`. */
export async function fetchLiveMarketOverview(
  now = new Date(),
  options?: { bypassCache?: boolean },
): Promise<{ fixture: false; fetchedAt: string; indices: MarketOverview }> {
  const fetchedAt = formatBangkokTimestamp(now);
  const result = await liveMarketData.indices({
    bypassCache: options?.bypassCache,
    now,
  });

  if (result.status === "available") {
    return {
      fixture: false,
      fetchedAt,
      indices: result.data,
    };
  }

  const unavailableSlot: Result<IndexQuote> = {
    status: "unavailable",
    reason: result.status === "unavailable" ? result.reason : result.code,
  };
  return {
    fixture: false,
    fetchedAt,
    indices: {
      SET: unavailableSlot,
      SET50: unavailableSlot,
      DOW_JONES: unavailableSlot,
      SP_500: unavailableSlot,
      NASDAQ: unavailableSlot,
    },
  };
}

/** Delegates broad Thai/US/global market news retrieval to `liveMarketData.marketNews()`. */
export async function fetchLiveMarketNews(now = new Date()): Promise<Result<NewsItem[]>> {
  return liveMarketData.marketNews(now);
}
