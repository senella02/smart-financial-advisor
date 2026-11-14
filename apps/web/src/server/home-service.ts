import type {
  BriefFollowUps,
  DailyBrief,
  DailyBriefLookup,
  MarketOverview,
  NewsItem,
  Result,
} from "@sfa/contracts";
import {
  fetchLiveMarketNews,
  fetchLiveMarketOverview,
  isFixtureMode,
} from "./adapters/live-market-data";
import { generateBilingualDailyBrief } from "./brief-generator";
import {
  SqlitePublicationStore,
  computeNextHourlyScheduledIso,
  formatBangkokTimestamp,
  formatThaiDate,
  resolveDefaultPublicationDbPath,
} from "./publication-store";

export type MarketIndexKey = keyof MarketOverview;

export interface HomeMarketOverviewResponse {
  fixture: boolean;
  fetchedAt: string;
  indices: MarketOverview;
}

export interface HomeBriefPayload {
  fixture: boolean;
  requestedThaiDate: string;
  currentThaiDate: string;
  isArchive: boolean;
  isFallback: boolean;
  lookup: DailyBriefLookup;
  displayBrief: Result<DailyBrief>;
  followUps: BriefFollowUps | null;
  availableDates: string[];
}

export type ChatHandoffResolution =
  | {
      status: "accepted";
      topic: string;
      cardId: string;
      publicationId: string;
      publicationDate: string;
      todayContext: DailyBrief;
    }
  | {
      status: "rejected";
      reason: "ARCHIVED_OR_FALLBACK_BRIEF_NO_QA" | "TODAY_NOT_PUBLISHED" | "CARD_NOT_FOUND" | "INVALID_PARAMS";
      todayContext: Result<DailyBrief>;
    };

function subtractThaiDays(thaiDate: string, days: number): string {
  const utcMs = Date.parse(`${thaiDate}T00:00:00+07:00`) - days * 86_400_000;
  return formatThaiDate(new Date(utcMs));
}

function buildDemoMarketNewsForDate(thaiDate: string, variant: "today" | "yesterday" | "older"): NewsItem[] {
  if (variant === "yesterday") {
    return [
      {
        newsId: `NEWS_${thaiDate}_US_TECH`,
        headline: "US technology stocks advance ahead of quarterly earnings",
        language: "en",
        publishedAt: `${thaiDate}T21:15:00+07:00`,
        source: {
          sourceId: `SRC_${thaiDate}_1`,
          url: "https://example.invalid/news/us-tech-close",
          sourceAsOf: `${thaiDate}T21:10:00+07:00`,
          fetchedAt: `${thaiDate}T21:16:00+07:00`,
        },
        listings: [],
      },
      {
        newsId: `NEWS_${thaiDate}_TH_EXPORT`,
        headline: "Thailand monthly export figures expand above consensus",
        language: "en",
        publishedAt: `${thaiDate}T14:30:00+07:00`,
        source: {
          sourceId: `SRC_${thaiDate}_2`,
          url: "https://example.invalid/news/thai-exports",
          sourceAsOf: `${thaiDate}T14:25:00+07:00`,
          fetchedAt: `${thaiDate}T14:32:00+07:00`,
        },
        listings: [],
      },
    ];
  }

  if (variant === "older") {
    return [
      {
        newsId: `NEWS_${thaiDate}_THB`,
        headline: "Thai baht trades near 35.9 per USD amid cautious bond yields",
        language: "en",
        publishedAt: `${thaiDate}T16:40:00+07:00`,
        source: {
          sourceId: `SRC_${thaiDate}_1`,
          url: "https://example.invalid/news/thb-fx",
          sourceAsOf: `${thaiDate}T16:35:00+07:00`,
          fetchedAt: `${thaiDate}T16:42:00+07:00`,
        },
        listings: [],
      },
    ];
  }

  return [
    {
      newsId: `NEWS_${thaiDate}_OIL_OPEC`,
      headline: "OPEC+ signals potential output increase as Brent crude falls 2.3%",
      language: "en",
      publishedAt: `${thaiDate}T00:40:00+07:00`,
      source: {
        sourceId: `SRC_${thaiDate}_OP`,
        url: "https://example.invalid/news/opec-brent",
        sourceAsOf: `${thaiDate}T00:35:00+07:00`,
        fetchedAt: `${thaiDate}T00:42:00+07:00`,
      },
      listings: [
        { companyId: "FIXTURE_PTT", market: "TH", symbol: "PTT", exchangeId: "SET" },
        { companyId: "FIXTURE_PTTEP", market: "TH", symbol: "PTTEP", exchangeId: "SET" },
      ],
    },
    {
      newsId: `NEWS_${thaiDate}_FED_FOMC`,
      headline: "Fed expected to hold policy rate at FOMC meeting as markets watch Dot Plot",
      language: "en",
      publishedAt: `${thaiDate}T06:15:00+07:00`,
      source: {
        sourceId: `SRC_${thaiDate}_FED`,
        url: "https://example.invalid/news/fomc-dot-plot",
        sourceAsOf: `${thaiDate}T06:10:00+07:00`,
        fetchedAt: `${thaiDate}T06:18:00+07:00`,
      },
      listings: [
        { companyId: "FIXTURE_KBANK", market: "TH", symbol: "KBANK", exchangeId: "SET" },
        { companyId: "FIXTURE_NVDA", market: "US", symbol: "NVDA", exchangeId: "NASDAQ" },
      ],
    },
    {
      newsId: `NEWS_${thaiDate}_BOT_TH`,
      headline: "Bank of Thailand MPC notes readiness to ease policy if domestic growth slows",
      language: "en",
      publishedAt: `${thaiDate}T09:50:00+07:00`,
      source: {
        sourceId: `SRC_${thaiDate}_BOT`,
        url: "https://example.invalid/news/bot-mpc",
        sourceAsOf: `${thaiDate}T09:45:00+07:00`,
        fetchedAt: `${thaiDate}T09:52:00+07:00`,
      },
      listings: [
        { companyId: "FIXTURE_SCB", market: "TH", symbol: "SCB", exchangeId: "SET" },
        { companyId: "FIXTURE_KBANK", market: "TH", symbol: "KBANK", exchangeId: "SET" },
      ],
    },
    {
      newsId: `NEWS_${thaiDate}_TOURISM`,
      headline: "China unveils consumption stimulus package supportive of Thai tourism and retail",
      language: "en",
      publishedAt: `${thaiDate}T11:05:00+07:00`,
      source: {
        sourceId: `SRC_${thaiDate}_CN`,
        url: "https://example.invalid/news/china-stimulus",
        sourceAsOf: `${thaiDate}T11:00:00+07:00`,
        fetchedAt: `${thaiDate}T11:07:00+07:00`,
      },
      listings: [
        { companyId: "FIXTURE_AOT", market: "TH", symbol: "AOT", exchangeId: "SET" },
        { companyId: "FIXTURE_CPALL", market: "TH", symbol: "CPALL", exchangeId: "SET" },
      ],
    },
  ];
}

/**
 * Returns the 5 required Home market overview indices (SET, SET50, Dow Jones, S&P 500, Nasdaq).
 * Preserves upstream `sourceAsOf` independently of `fetchedAt` so delayed quotes are never mislabeled real-time.
 */
export function buildHomeMarketOverview(input?: {
  now?: Date;
  unavailableKeys?: MarketIndexKey[];
}): HomeMarketOverviewResponse {
  const now = input?.now ?? new Date();
  const fetchedAt = formatBangkokTimestamp(now);
  const currentDate = formatThaiDate(now);
  const unavailable = new Set<MarketIndexKey>(input?.unavailableKeys ?? []);

  // Fixed upstream source timestamps to demonstrate delayed market data without faking real-time timestamps.
  const thSourceAsOf = `${currentDate}T16:30:00+07:00`;
  const usSourceAsOf = `${subtractThaiDays(currentDate, 1)}T21:00:00-05:00`;

  const makeIndex = (
    key: MarketIndexKey,
    value: number,
    change: number,
    changePercent: number,
    sourceId: string,
    url: string,
    sourceAsOf: string,
  ): MarketOverview[MarketIndexKey] => {
    if (unavailable.has(key)) {
      return { status: "unavailable", reason: "SOURCE_TEMP_UNAVAILABLE" };
    }
    return {
      status: "available",
      data: {
        value: { status: "available", value, reason: null, unit: "index-points", currency: null },
        change: { status: "available", value: change, reason: null, unit: "index-points", currency: null },
        changePercent: { status: "available", value: changePercent, reason: null, unit: "percent", currency: null },
        provenance: { sourceId, url, sourceAsOf, fetchedAt },
      },
    };
  };

  return {
    fixture: true,
    fetchedAt,
    indices: {
      SET: makeIndex("SET", 1342.18, -6.42, -0.48, "FIXTURE_INDEX_SET", "https://example.invalid/indices/set", thSourceAsOf),
      SET50: makeIndex("SET50", 872.44, -4.46, -0.51, "FIXTURE_INDEX_SET50", "https://example.invalid/indices/set50", thSourceAsOf),
      DOW_JONES: makeIndex("DOW_JONES", 43218.5, 113.3, 0.26, "FIXTURE_INDEX_DJI", "https://example.invalid/indices/dji", usSourceAsOf),
      SP_500: makeIndex("SP_500", 5912.3, 16.6, 0.28, "FIXTURE_INDEX_SPX", "https://example.invalid/indices/spx", usSourceAsOf),
      NASDAQ: makeIndex("NASDAQ", 19244.9, 84.8, 0.44, "FIXTURE_INDEX_IXIC", "https://example.invalid/indices/ixic", usSourceAsOf),
    },
  };
}

/**
 * Returns live 5-index Home overview in dev/production, or fixture data when
 * SFA_USE_FIXTURES=1 or inside automated unit tests.
 */
export async function getLiveOrFixtureMarketOverview(
  now = new Date(),
): Promise<HomeMarketOverviewResponse> {
  if (isFixtureMode()) {
    return buildHomeMarketOverview({ now });
  }
  return fetchLiveMarketOverview(now);
}

function hasLiveEvidenceSources(brief: DailyBrief): boolean {
  return brief.evidence.sources.some((src) => !src.url.includes("example.invalid"));
}

/**
 * Opens the shared SQLite publication store (defaulting to `<workspace>/.data/publications.sqlite`).
 * In live mode, if today has no real-news publication yet, fetches live market news and publishes
 * today's initial Daily Brief immediately on cold start so `pnpm dev` shows live news.
 */
export async function ensureLivePublicationStore(
  dbPath?: string,
  now = new Date(),
): Promise<SqlitePublicationStore> {
  if (isFixtureMode()) {
    return createSeededPublicationStore(now, dbPath || ":memory:");
  }

  const resolvedPath = dbPath || resolveDefaultPublicationDbPath();
  const store = new SqlitePublicationStore(resolvedPath);
  const currentThaiDate = formatThaiDate(now);
  const existing = await store.brief(currentThaiDate);

  if (existing.todayContext.status === "available" && hasLiveEvidenceSources(existing.todayContext.data)) {
    return store;
  }

  try {
    const newsResult = await fetchLiveMarketNews(now);
    if (newsResult.status === "available" && newsResult.data.length > 0) {
      const timestamp = formatBangkokTimestamp(now);
      const { brief, followUps } = await generateBilingualDailyBrief({
        publicationDate: currentThaiDate,
        publishedAt: timestamp,
        evidenceCutoff: timestamp,
        newsItems: newsResult.data,
        geminiApiKey: process.env.GEMINI_API_KEY,
      });
      store.publishDailyBriefAtomically({
        brief,
        followUps,
        nextScheduledAt: computeNextHourlyScheduledIso(now),
      });
    } else {
      const reason =
        newsResult.status === "unavailable"
          ? newsResult.reason
          : newsResult.status === "error"
            ? `${newsResult.code}: ${newsResult.message}`
            : "EMPTY_LIVE_NEWS";
      store.recordFailedUpdate({
        attemptedAt: formatBangkokTimestamp(now),
        nextScheduledAt: computeNextHourlyScheduledIso(now),
        errorMessage: reason,
      });
    }
  } catch (error) {
    store.recordFailedUpdate({
      attemptedAt: formatBangkokTimestamp(now),
      nextScheduledAt: computeNextHourlyScheduledIso(now),
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }

  return store;
}

/** Seeds a SqlitePublicationStore with today + 2 archive dates for immediate Phase 1 demo browsing. */
export async function createSeededPublicationStore(now = new Date(), dbPath = ":memory:"): Promise<SqlitePublicationStore> {
  const store = new SqlitePublicationStore(dbPath);
  const today = formatThaiDate(now);
  const yesterday = subtractThaiDays(today, 1);
  const twoDaysAgo = subtractThaiDays(today, 2);

  const olderResult = await generateBilingualDailyBrief({
    publicationDate: twoDaysAgo,
    publishedAt: `${twoDaysAgo}T17:00:00+07:00`,
    evidenceCutoff: `${twoDaysAgo}T17:00:00+07:00`,
    newsItems: buildDemoMarketNewsForDate(twoDaysAgo, "older"),
  });
  store.publishDailyBriefAtomically({
    brief: olderResult.brief,
    followUps: olderResult.followUps,
    nextScheduledAt: `${twoDaysAgo}T18:00:00+07:00`,
  });

  const yesterdayResult = await generateBilingualDailyBrief({
    publicationDate: yesterday,
    publishedAt: `${yesterday}T22:00:00+07:00`,
    evidenceCutoff: `${yesterday}T22:00:00+07:00`,
    newsItems: buildDemoMarketNewsForDate(yesterday, "yesterday"),
  });
  store.publishDailyBriefAtomically({
    brief: yesterdayResult.brief,
    followUps: yesterdayResult.followUps,
    nextScheduledAt: `${yesterday}T23:00:00+07:00`,
  });

  const todayPublishedAt = formatBangkokTimestamp(now);
  const todayResult = await generateBilingualDailyBrief({
    publicationDate: today,
    publishedAt: todayPublishedAt,
    evidenceCutoff: todayPublishedAt,
    newsItems: buildDemoMarketNewsForDate(today, "today"),
  });
  store.publishDailyBriefAtomically({
    brief: todayResult.brief,
    followUps: todayResult.followUps,
    nextScheduledAt: computeNextHourlyScheduledIso(now),
  });

  return store;
}

export async function getHomeBriefPayloadFromStore(
  store: SqlitePublicationStore,
  currentThaiDate: string,
  requestedDate?: string,
): Promise<HomeBriefPayload> {
  const targetDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    ? requestedDate
    : currentThaiDate;
  const isArchive = targetDate !== currentThaiDate;
  const availableDates = store.listAvailableDates();
  const lookup = await store.brief(currentThaiDate);

  if (isArchive) {
    const archiveResult = await store.archive(targetDate);
    return {
      fixture:
        archiveResult.status === "available"
          ? !hasLiveEvidenceSources(archiveResult.data)
          : isFixtureMode(),
      requestedThaiDate: targetDate,
      currentThaiDate,
      isArchive: true,
      isFallback: false,
      lookup,
      displayBrief: archiveResult,
      followUps: null,
      availableDates,
    };
  }

  const isFallback =
    lookup.todayContext.status !== "available" && lookup.display.status === "available";
  let followUps: BriefFollowUps | null = null;
  if (lookup.todayContext.status === "available") {
    const fu = await store.followUps(lookup.todayContext.data.publicationId);
    if (fu.status === "available") {
      followUps = fu.data;
    }
  }

  return {
    fixture:
      lookup.display.status === "available"
        ? !hasLiveEvidenceSources(lookup.display.data)
        : isFixtureMode(),
    requestedThaiDate: currentThaiDate,
    currentThaiDate,
    isArchive: false,
    isFallback,
    lookup,
    displayBrief: lookup.display,
    followUps,
    availableDates,
  };
}

export async function resolveChatHandoffFromStore(
  store: SqlitePublicationStore,
  currentThaiDate: string,
  params: { cardId?: string; publicationId?: string; date?: string; topic?: string },
): Promise<ChatHandoffResolution | null> {
  if (!params.cardId && !params.publicationId && !params.date && !params.topic) {
    return null;
  }

  const lookup = await store.brief(currentThaiDate);
  if (!params.cardId || !params.publicationId || !params.date) {
    return {
      status: "rejected",
      reason: "INVALID_PARAMS",
      todayContext: lookup.todayContext,
    };
  }

  const validation = await store.validateFollowUpHandoff({
    cardId: params.cardId,
    publicationId: params.publicationId,
    requestedDate: params.date,
    currentThaiDate,
  });

  if (validation.status !== "available") {
    return {
      status: "rejected",
      reason: validation.reason,
      todayContext: lookup.todayContext,
    };
  }

  return {
    status: "accepted",
    topic: validation.data.card.variants.th.question,
    cardId: validation.data.card.cardId,
    publicationId: validation.data.brief.publicationId,
    publicationDate: validation.data.brief.publicationDate,
    todayContext: validation.data.todayContext,
  };
}
