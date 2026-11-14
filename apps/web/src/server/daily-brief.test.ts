import { describe, expect, it, vi } from "vitest";
import { broadMarketNewsFixture } from "@sfa/contracts/fixtures";
import {
  fetchLiveMarketNews,
  fetchLiveMarketOverview,
  isFixtureMode,
} from "./adapters/live-market-data";
import { generateBilingualDailyBrief, scoreNewsImportance } from "./brief-generator";
import {
  buildHomeMarketOverview,
  createSeededPublicationStore,
  getHomeBriefPayloadFromStore,
  resolveChatHandoffFromStore,
} from "./home-service";
import {
  SqlitePublicationStore,
  computeNextHourlyScheduledIso,
  formatThaiDate,
} from "./publication-store";
import { runHourlyBriefJob } from "../../../worker/src/index";

describe("Home market overview", () => {
  it("returns all five required indices and preserves sourceAsOf across minute refreshes", () => {
    const first = buildHomeMarketOverview({ now: new Date("2026-11-14T10:00:00+07:00") });
    const second = buildHomeMarketOverview({ now: new Date("2026-11-14T10:01:00+07:00") });

    expect(Object.keys(first.indices).sort()).toEqual([
      "DOW_JONES",
      "NASDAQ",
      "SET",
      "SET50",
      "SP_500",
    ]);
    expect(first.indices.SET.status).toBe("available");
    expect(second.indices.SET.status).toBe("available");
    if (first.indices.SET.status === "available" && second.indices.SET.status === "available") {
      expect(second.indices.SET.data.provenance.sourceAsOf).toBe(
        first.indices.SET.data.provenance.sourceAsOf,
      );
      expect(second.indices.SET.data.provenance.fetchedAt).not.toBe(
        first.indices.SET.data.provenance.fetchedAt,
      );
    }

    const partial = buildHomeMarketOverview({
      now: new Date("2026-11-14T10:02:00+07:00"),
      unavailableKeys: ["NASDAQ"],
    });
    expect(partial.indices.NASDAQ.status).toBe("unavailable");
  });
});

describe("Daily Brief bilingual generation, rollover, scheduling, and failure preservation", () => {
  it("generates Thai and English short/full briefs from one evidence snapshot", async () => {
    const scored = scoreNewsImportance(broadMarketNewsFixture.data);
    expect(scored[0].importanceScore).toBeGreaterThanOrEqual(scored[1].importanceScore);

    const { brief, followUps } = await generateBilingualDailyBrief({
      publicationDate: "2026-11-14",
      publishedAt: "2026-11-14T10:00:00+07:00",
      evidenceCutoff: "2026-11-14T10:00:00+07:00",
      newsItems: broadMarketNewsFixture.data,
    });

    expect(brief.variants.th.language).toBe("th");
    expect(brief.variants.en.language).toBe("en");
    expect(brief.variants.th.newsItems?.length).toBe(brief.variants.en.newsItems?.length);
    expect(brief.evidence.evidenceCutoff).toBe("2026-11-14T10:00:00+07:00");
    expect(followUps.publicationId).toBe(brief.publicationId);
    expect(followUps.publicationDate).toBe("2026-11-14");
  });

  it("handles weekend hourly scheduling, latest-per-day archive retention, and overlap locks", async () => {
    const store = new SqlitePublicationStore(":memory:");
    try {
      // Saturday 2026-11-14T09:05+07:00 -> next schedule 10:00+07:00
      const satMorning = new Date("2026-11-14T09:05:00+07:00");
      expect(formatThaiDate(satMorning)).toBe("2026-11-14");
      expect(computeNextHourlyScheduledIso(satMorning)).toBe("2026-11-14T10:00:00+07:00");

      const run1 = await runHourlyBriefJob({
        store,
        now: satMorning,
        fetchMarketNews: async () => ({ status: "available", data: broadMarketNewsFixture.data }),
      });
      expect(run1.status).toBe("published");

      // Overlapping run inside same hour slot is skipped
      const overlap = await runHourlyBriefJob({
        store,
        now: new Date("2026-11-14T09:40:00+07:00"),
        fetchMarketNews: async () => ({ status: "available", data: broadMarketNewsFixture.data }),
      });
      expect(overlap.status).toBe("skipped");

      // Next hour on Saturday updates today's publication
      const run2 = await runHourlyBriefJob({
        store,
        now: new Date("2026-11-14T10:00:00+07:00"),
        fetchMarketNews: async () => ({ status: "available", data: broadMarketNewsFixture.data }),
      });
      expect(run2.status).toBe("published");

      // Sunday 2026-11-15T01:00+07:00 retains Saturday's latest publication in archive
      const sunRun = await runHourlyBriefJob({
        store,
        now: new Date("2026-11-15T01:00:00+07:00"),
        fetchMarketNews: async () => ({ status: "available", data: broadMarketNewsFixture.data }),
      });
      expect(sunRun.status).toBe("published");
      const satArchive = await store.archive("2026-11-14");
      expect(satArchive.status).toBe("available");
      if (satArchive.status === "available" && run2.status === "published") {
        expect(satArchive.data.publicationId).toBe(run2.publicationId);
      }
    } finally {
      store.close();
    }
  });

  it("separates previous-day display fallback from todayContext at Bangkok midnight rollover", async () => {
    const store = new SqlitePublicationStore(":memory:");
    try {
      const emptyLookup = await store.brief("2026-11-14");
      expect(emptyLookup.display.status).toBe("unavailable");
      expect(emptyLookup.todayContext.status).toBe("unavailable");

      await runHourlyBriefJob({
        store,
        now: new Date("2026-11-14T23:00:00+07:00"),
        fetchMarketNews: async () => ({ status: "available", data: broadMarketNewsFixture.data }),
      });

      // After Bangkok midnight (00:05+07:00) before 2026-11-15 first run
      const rolloverLookup = await store.brief("2026-11-15");
      expect(rolloverLookup.display.status).toBe("available");
      if (rolloverLookup.display.status === "available") {
        expect(rolloverLookup.display.data.publicationDate).toBe("2026-11-14");
      }
      expect(rolloverLookup.todayContext.status).toBe("unavailable");

      const homeFallback = await getHomeBriefPayloadFromStore(store, "2026-11-15");
      expect(homeFallback.isFallback).toBe(true);
      expect(homeFallback.followUps).toBeNull();
    } finally {
      store.close();
    }
  });

  it("preserves the last readable publication and marks update delayed on generation failure", async () => {
    const store = new SqlitePublicationStore(":memory:");
    try {
      const ok = await runHourlyBriefJob({
        store,
        now: new Date("2026-11-14T10:00:00+07:00"),
        fetchMarketNews: async () => ({ status: "available", data: broadMarketNewsFixture.data }),
      });
      expect(ok.status).toBe("published");

      const failed = await runHourlyBriefJob({
        store,
        now: new Date("2026-11-14T11:00:00+07:00"),
        fetchMarketNews: async () => ({ status: "error", code: "UPSTREAM_503", message: "News provider down" }),
      });
      expect(failed.status).toBe("failed");

      const afterFailure = await store.brief("2026-11-14");
      expect(afterFailure.display.status).toBe("available");
      expect(afterFailure.todayContext.status).toBe("available");
      expect(afterFailure.updateStatus).toBe("delayed");
      if (afterFailure.display.status === "available" && ok.status === "published") {
        expect(afterFailure.display.data.publicationId).toBe(ok.publicationId);
      }
    } finally {
      store.close();
    }
  });

  it("validates follow-up card handoff for today and rejects archived or fallback cards", async () => {
    const now = new Date("2026-11-14T12:00:00+07:00");
    const store = await createSeededPublicationStore(now, ":memory:");
    try {
      const today = formatThaiDate(now);
      const todayPayload = await getHomeBriefPayloadFromStore(store, today);
      expect(todayPayload.isArchive).toBe(false);
      expect(todayPayload.followUps?.cards.length).toBeGreaterThan(0);

      const firstCard = todayPayload.followUps!.cards[0];
      const accepted = await resolveChatHandoffFromStore(store, today, {
        cardId: firstCard.cardId,
        publicationId: todayPayload.followUps!.publicationId,
        date: today,
      });
      expect(accepted?.status).toBe("accepted");

      const archiveDate = todayPayload.availableDates.find((d) => d !== today)!;
      const archivePayload = await getHomeBriefPayloadFromStore(store, today, archiveDate);
      expect(archivePayload.isArchive).toBe(true);
      expect(archivePayload.followUps).toBeNull();

      const archiveBrief = archivePayload.displayBrief;
      expect(archiveBrief.status).toBe("available");
      if (archiveBrief.status === "available") {
        const rejected = await resolveChatHandoffFromStore(store, today, {
          cardId: firstCard.cardId,
          publicationId: archiveBrief.data.publicationId,
          date: archiveDate,
        });
        expect(rejected?.status).toBe("rejected");
      }
    } finally {
      store.close();
    }
  });
});

describe("Live market data adapter parsing", () => {
  it("stays in fixture mode under Vitest and parses mocked Yahoo/Google index & RSS news responses", async () => {
    expect(isFixtureMode()).toBe(true);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      // Simulate Yahoo working for SET, DJI, GSPC, IXIC; failing for SET50 so Google Finance fallback runs.
      if (url.includes("query1.finance.yahoo.com") && url.includes("%5ESET50.BK")) {
        return new Response("Not Found", { status: 404 });
      }
      if (url.includes("google.com/finance/quote/SET50%3AINDEXBKK")) {
        return new Response(
          `<div data-last-price="941.25" data-last-normal-market-timestamp="1763110200"></div><div>Previous close</div><div>935.00</div>`,
          { status: 200 },
        );
      }
      if (url.includes("query1.finance.yahoo.com")) {
        const price = url.includes("%5ESET.BK")
          ? 1455.5
          : url.includes("%5EDJI")
            ? 43500.2
            : url.includes("%5EGSPC")
              ? 5950.1
              : 19310.4;
        return Response.json({
          chart: {
            result: [
              {
                meta: {
                  regularMarketPrice: price,
                  previousClose: price - 10,
                  regularMarketTime: 1763110200,
                },
              },
            ],
          },
        });
      }
      if (url.includes("news.google.com/rss") && url.includes("hl=th")) {
        return new Response(
          `<rss><channel><item><title>หุ้นไทยฟื้นตัวรับแรงซื้อต่างชาติ - กรุงเทพธุรกิจ</title><link>https://news.google.com/rss/articles/th1</link><pubDate>Sat, 14 Nov 2026 09:00:00 GMT</pubDate><source url="https://www.bangkokbiznews.com">กรุงเทพธุรกิจ</source></item></channel></rss>`,
          { status: 200 },
        );
      }
      if (url.includes("news.google.com/rss") && url.includes("hl=en-US")) {
        return new Response(
          `<rss><channel><item><title>Fed rate expectations shift after inflation report - Reuters</title><link>https://news.google.com/rss/articles/us1</link><pubDate>Sat, 14 Nov 2026 08:30:00 GMT</pubDate><source url="https://www.reuters.com">Reuters</source></item></channel></rss>`,
          { status: 200 },
        );
      }
      return new Response("<rss><channel></channel></rss>", { status: 200 });
    });

    try {
      const overview = await fetchLiveMarketOverview(new Date("2026-11-14T19:00:00+07:00"), {
        bypassCache: true,
      });
      expect(overview.fixture).toBe(false);
      expect(overview.indices.SET.status).toBe("available");
      expect(overview.indices.SET50.status).toBe("available");
      if (overview.indices.SET50.status === "available") {
        expect(overview.indices.SET50.data.value.status).toBe("available");
        expect(overview.indices.SET50.data.provenance.sourceId).toBe("GFIN_SET50");
      }

      const news = await fetchLiveMarketNews(new Date("2026-11-14T19:00:00+07:00"));
      expect(news.status).toBe("available");
      if (news.status === "available") {
        expect(news.data.length).toBe(2);
        const generated = await generateBilingualDailyBrief({
          publicationDate: "2026-11-14",
          publishedAt: "2026-11-14T19:00:00+07:00",
          evidenceCutoff: "2026-11-14T19:00:00+07:00",
          newsItems: news.data,
        });
        expect(generated.brief.variants.th.newsItems?.map((i) => i.sourceName)).toEqual(
          expect.arrayContaining(["กรุงเทพธุรกิจ", "Reuters"]),
        );
      }
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
