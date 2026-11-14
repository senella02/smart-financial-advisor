import { pathToFileURL } from "node:url";
import type { BriefFollowUps, DailyBrief, NewsItem, Result } from "@sfa/contracts";
import { fetchLiveMarketNews, isFixtureMode } from "../../web/src/server/adapters/live-market-data";
import { generateBilingualDailyBrief } from "../../web/src/server/brief-generator";
import {
  SqlitePublicationStore,
  computeNextHourlyScheduledIso,
  formatBangkokTimestamp,
  formatThaiDate,
  formatThaiHourSlot,
  resolveDefaultPublicationDbPath,
} from "../../web/src/server/publication-store";

export interface HourlyJobInput {
  store: SqlitePublicationStore;
  now?: Date;
  fetchMarketNews: (requestedThaiDate: string) => Promise<Result<NewsItem[]>>;
  generateBrief?: (input: {
    publicationDate: string;
    publishedAt: string;
    evidenceCutoff: string;
    newsItems: NewsItem[];
    geminiApiKey?: string;
  }) => Promise<{ brief: DailyBrief; followUps: BriefFollowUps }>;
  geminiApiKey?: string;
}

export type HourlyJobOutcome =
  | { status: "published"; publicationId: string; publicationDate: string; nextScheduledAt: string }
  | { status: "skipped"; reason: string; jobKey: string }
  | { status: "failed"; reason: string; nextScheduledAt: string };

/**
 * Executes one hourly Asia/Bangkok Daily Brief publication cycle (runs every day including weekends).
 * Prevents overlapping runs for the same hour slot and preserves previous readable publications on failure.
 */
export async function runHourlyBriefJob(input: HourlyJobInput): Promise<HourlyJobOutcome> {
  const now = input.now ?? new Date();
  const requestedThaiDate = formatThaiDate(now);
  const hourSlot = formatThaiHourSlot(now);
  const jobKey = `daily-brief:${hourSlot}`;
  const jobId = `JOB_${hourSlot.replace(/[-:T]/g, "_")}_${now.getTime()}`;
  const startedAt = formatBangkokTimestamp(now);
  const nextScheduledAt = computeNextHourlyScheduledIso(now);

  const lock = input.store.tryStartHourlyJob({
    jobKey,
    jobId,
    requestedThaiDate,
    startedAt,
  });

  if (!lock.acquired) {
    return { status: "skipped", reason: lock.reason, jobKey };
  }

  try {
    const newsResult = await input.fetchMarketNews(requestedThaiDate);
    if (newsResult.status !== "available") {
      const reason =
        newsResult.status === "unavailable"
          ? newsResult.reason
          : `${newsResult.code}: ${newsResult.message}`;
      throw new Error(`Market news unavailable: ${reason}`);
    }
    if (newsResult.data.length === 0) {
      throw new Error("Market news returned zero stories for Daily Brief");
    }

    const generator = input.generateBrief ?? generateBilingualDailyBrief;
    const { brief, followUps } = await generator({
      publicationDate: requestedThaiDate,
      publishedAt: startedAt,
      evidenceCutoff: startedAt,
      newsItems: newsResult.data,
      geminiApiKey: input.geminiApiKey,
    });

    input.store.publishDailyBriefAtomically({
      brief,
      followUps,
      nextScheduledAt,
    });

    input.store.finishHourlyJob({
      jobKey,
      status: "succeeded",
      finishedAt: formatBangkokTimestamp(new Date()),
    });

    return {
      status: "published",
      publicationId: brief.publicationId,
      publicationDate: brief.publicationDate,
      nextScheduledAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const finishedAt = formatBangkokTimestamp(now);
    input.store.recordFailedUpdate({
      attemptedAt: finishedAt,
      nextScheduledAt,
      errorMessage: message,
    });
    input.store.finishHourlyJob({
      jobKey,
      status: "failed",
      finishedAt,
      errorMessage: message,
    });
    return { status: "failed", reason: message, nextScheduledAt };
  }
}

/** Computes milliseconds until the next :00:00 Asia/Bangkok hour boundary. */
export function msUntilNextBangkokHour(now = new Date()): number {
  const nextIso = computeNextHourlyScheduledIso(now);
  return Math.max(1_000, Date.parse(nextIso) - now.getTime());
}

function buildDefaultFixtureNews(requestedThaiDate: string): NewsItem[] {
  return [
    {
      newsId: `MACRO_${requestedThaiDate}_FED`,
      headline: "Fed signals data-dependent rate path ahead of upcoming FOMC decision",
      language: "en",
      publishedAt: `${requestedThaiDate}T06:15:00+07:00`,
      source: {
        sourceId: "SRC_FED_WATCH",
        url: "https://example.invalid/macro/fomc-watch",
        sourceAsOf: `${requestedThaiDate}T06:10:00+07:00`,
        fetchedAt: `${requestedThaiDate}T06:16:00+07:00`,
      },
      listings: [],
    },
    {
      newsId: `ENERGY_${requestedThaiDate}_BRENT`,
      headline: "Brent crude eases over 2% on supply outlook while Thai baht firms slightly",
      language: "en",
      publishedAt: `${requestedThaiDate}T07:30:00+07:00`,
      source: {
        sourceId: "SRC_ENERGY_FX",
        url: "https://example.invalid/macro/brent-thb",
        sourceAsOf: `${requestedThaiDate}T07:25:00+07:00`,
        fetchedAt: `${requestedThaiDate}T07:31:00+07:00`,
      },
      listings: [],
    },
  ];
}

async function runCli(): Promise<void> {
  const once = process.argv.includes("--once");
  const dbPath = process.env.SFA_PUBLICATION_DB_PATH || resolveDefaultPublicationDbPath();
  const store = new SqlitePublicationStore(dbPath);
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const execute = async () => {
    const outcome = await runHourlyBriefJob({
      store,
      now: new Date(),
      geminiApiKey,
      fetchMarketNews: async (date) => {
        if (isFixtureMode()) {
          return {
            status: "available",
            data: buildDefaultFixtureNews(date),
          };
        }
        return fetchLiveMarketNews(new Date());
      },
    });
    console.log(JSON.stringify({ worker: "daily-brief", ...outcome }));
  };

  await execute();
  if (once) {
    store.close();
    return;
  }

  const scheduleNext = () => {
    const delayMs = msUntilNextBangkokHour(new Date());
    setTimeout(async () => {
      await execute();
      scheduleNext();
    }, delayMs);
  };
  scheduleNext();
}

const isEntrypoint =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  runCli().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
