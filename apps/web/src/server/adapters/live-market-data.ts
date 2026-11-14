import "server-only";
import {
  type ResearchDataPort,
  type Result,
  type ListingKey,
  type StockIdentity,
  type Quote,
  type StockSearchResultSchema,
  type MarketOverviewSchema,
  type PriceHistorySchema,
  type FinancialStatementSchema,
  type FinancialMetricsSchema,
  type NewsItemSchema,
  type ChartRangeSchema,
  StockIdentitySchema,
  QuoteSchema,
} from "@sfa/contracts";

type StockSearchResult = ReturnType<typeof StockSearchResultSchema.parse>;
type MarketOverview = ReturnType<typeof MarketOverviewSchema.parse>;
type PriceHistory = ReturnType<typeof PriceHistorySchema.parse>;
type FinancialStatement = ReturnType<typeof FinancialStatementSchema.parse>;
type FinancialMetrics = ReturnType<typeof FinancialMetricsSchema.parse>;
type NewsItem = ReturnType<typeof NewsItemSchema.parse>;
type ChartRange = ReturnType<typeof ChartRangeSchema.parse>;

// Mapping internal index symbol to Yahoo Finance ticker
const INDEX_TICKERS = {
  SET: "^SET.BK",
  SET50: "^SET50.BK",
  DOW_JONES: "^DJI",
  SP_500: "^GSPC",
  NASDAQ: "^IXIC",
} as const;

function toYahooTicker(listing: ListingKey): string {
  if (listing.market === "TH") {
    return listing.symbol.endsWith(".BK") ? listing.symbol : `${listing.symbol}.BK`;
  }
  return listing.symbol;
}

// Global In-Memory Cache Store (Server Singleton)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const GLOBAL_CACHE = new Map<string, CacheEntry<any>>();
const IN_FLIGHT_PROMISES = new Map<string, Promise<any>>();

/**
 * Fetch with Coalescing (Single-flight) & 60-second TTL In-Memory Cache.
 * Prevents Cache Stampede: Even if 1,000,000 users request at the exact same millisecond,
 * only ONE upstream network request is fired to Yahoo Finance.
 */
async function cachedFetchJson<T>(url: string, ttlMs: number = 60_000, userAgent: string): Promise<T> {
  const now = Date.now();
  const cached = GLOBAL_CACHE.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  // If a request for this exact URL is already in-flight, reuse it (Promise deduplication)
  if (IN_FLIGHT_PROMISES.has(url)) {
    return IN_FLIGHT_PROMISES.get(url) as Promise<T>;
  }

  const promise = (async () => {
    try {
      const res = await fetch(url, { headers: { "User-Agent": userAgent } });
      if (!res.ok) {
        throw new Error(`HTTP_${res.status}`);
      }
      const data = await res.json();
      GLOBAL_CACHE.set(url, { data, expiresAt: Date.now() + ttlMs });
      return data as T;
    } finally {
      IN_FLIGHT_PROMISES.delete(url);
    }
  })();

  IN_FLIGHT_PROMISES.set(url, promise);
  return promise;
}

export class LiveMarketDataAdapter implements ResearchDataPort {
  private userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

  async identify(listing: ListingKey): Promise<Result<StockIdentity>> {
    try {
      const ticker = toYahooTicker(listing);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const json = await cachedFetchJson<any>(url, 300_000, this.userAgent); // Company info cached 5 mins
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
      return { status: "error", code: "FETCH_FAILED", message: err instanceof Error ? err.message : String(err) };
    }
  }

  async quote(listing: ListingKey): Promise<Result<Quote>> {
    try {
      const ticker = toYahooTicker(listing);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const fetchedAt = new Date().toISOString();
      const json = await cachedFetchJson<any>(url, 60_000, this.userAgent); // Quote cached 60 seconds
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
      return { status: "error", code: "QUOTE_FETCH_FAILED", message: err instanceof Error ? err.message : String(err) };
    }
  }

  async search(query: string): Promise<Result<StockSearchResult>> {
    try {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
      const json = await cachedFetchJson<any>(url, 300_000, this.userAgent); // Search cached 5 mins
      const quotes = json?.quotes || [];

      // Filter only Equity / Common stocks and supported markets (TH or US)
      const matches: StockSearchResult["matches"] = [];
      for (const q of quotes) {
        const symbol: string = q.symbol || "";
        const exchange: string = q.exchange || "";
        const quoteType: string = q.quoteType || "";

        let market: "TH" | "US" | null = null;
        let cleanSymbol = symbol;

        if (exchange === "SET" || symbol.endsWith(".BK")) {
          market = "TH";
          cleanSymbol = symbol.replace(/\.BK$/, "");
        } else if (["NMS", "NYQ", "NGM", "NCM", "ASE", "PCX", "YHD"].includes(exchange)) {
          market = "US";
        }

        if (market && quoteType === "EQUITY") {
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

      return {
        status: "available",
        data: {
          query,
          matches,
          isAmbiguous: matches.length > 1,
        },
      };
    } catch (err) {
      return { status: "error", code: "SEARCH_FAILED", message: err instanceof Error ? err.message : String(err) };
    }
  }

  async indices(): Promise<Result<MarketOverview>> {
    try {
      const entries = Object.entries(INDEX_TICKERS) as [keyof typeof INDEX_TICKERS, string][];
      const overview: Record<string, any> = {};
      const fetchedAt = new Date().toISOString();

      await Promise.all(
        entries.map(async ([key, ticker]) => {
          try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
            const json = await cachedFetchJson<any>(url, 60_000, this.userAgent); // Indices cached 60 seconds
            const meta = json?.chart?.result?.[0]?.meta;
            if (!meta || meta.regularMarketPrice == null) {
              overview[key] = { status: "unavailable", reason: "PRICE_MISSING" };
              return;
            }

            const sourceAsOf = meta.regularMarketTime
              ? new Date(meta.regularMarketTime * 1000).toISOString()
              : fetchedAt;

            overview[key] = {
              status: "available",
              data: {
                value: {
                  status: "available",
                  value: Number(meta.regularMarketPrice),
                  unit: "index-points",
                  currency: null,
                  reason: null,
                },
                provenance: {
                  sourceId: "YAHOO_FINANCE",
                  url: `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`,
                  sourceAsOf,
                  fetchedAt,
                },
              },
            };
          } catch {
            overview[key] = { status: "unavailable", reason: "NETWORK_ERROR" };
          }
        })
      );

      return { status: "available", data: overview as MarketOverview };
    } catch (err) {
      return { status: "error", code: "INDICES_FETCH_FAILED", message: err instanceof Error ? err.message : String(err) };
    }
  }

  async priceHistory(
    listing: ListingKey,
    range: ChartRange
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
      const json = await cachedFetchJson<any>(url, 60_000, this.userAgent); // Chart history cached 60 seconds
      const result = json?.chart?.result?.[0];
      const timestamps: number[] = result?.timestamp || [];
      const quotes = result?.indicators?.quote?.[0];
      const closes: (number | null)[] = quotes?.close || [];
      const volumes: (number | null)[] = quotes?.volume || [];

      if (!timestamps.length || !closes.length) {
        return { status: "unavailable", reason: "NO_PRICE_HISTORY" };
      }

      const currency = listing.market === "TH" ? "THB" : "USD";
      const points: PriceHistory["points"] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const c = closes[i];
        const v = volumes[i];
        if (c != null && !isNaN(c)) {
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
      return { status: "error", code: "HISTORY_FETCH_FAILED", message: err instanceof Error ? err.message : String(err) };
    }
  }

  async statements(
    _listing: ListingKey,
    _frequency: "annual" | "quarterly"
  ): Promise<Result<FinancialStatement[]>> {
    // Statement API on Yahoo anonymous is restricted (401); explicit boundary result
    return {
      status: "unavailable",
      reason: "PROVIDER_RESTRICTED",
    };
  }

  async metrics(
    _listing: ListingKey
  ): Promise<Result<FinancialMetrics>> {
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
      const res = await fetch(url, { headers: { "User-Agent": this.userAgent } });
      if (!res.ok) {
        return { status: "unavailable", reason: `HTTP_${res.status}` };
      }
      const json = await res.json();
      const rawNews = json?.news || [];

      const newsItems: NewsItem[] = [];
      for (const item of rawNews) {
        if (item.title && item.link) {
          const pubTime = item.providerPublishTime
            ? new Date(item.providerPublishTime * 1000).toISOString()
            : fetchedAt;

          newsItems.push({
            newsId: item.uuid || `NEWS_${Math.random().toString(36).substring(2, 9)}`,
            headline: item.title,
            language: "en", // Yahoo global news stream defaults to English
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
          });
        }
      }

      return { status: "available", data: newsItems };
    } catch (err) {
      return { status: "error", code: "NEWS_FETCH_FAILED", message: err instanceof Error ? err.message : String(err) };
    }
  }
}

export const liveMarketData = new LiveMarketDataAdapter();
