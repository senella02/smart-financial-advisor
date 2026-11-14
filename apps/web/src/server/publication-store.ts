import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  BriefFollowUps,
  BriefUpdateStatus,
  DailyBrief,
  DailyBriefLookup,
  ListingKey,
  PublicationReadPort,
  Result,
  StockSummaryLookup,
} from "@sfa/contracts";

/**
 * Resolves the shared persistent SQLite file path under `<workspace-root>/.data/publications.sqlite`
 * so `apps/web` and `apps/worker` read and write the same publication store regardless of CWD.
 */
export function resolveDefaultPublicationDbPath(): string {
  let cursor = path.resolve(/*turbopackIgnore: true*/ process.cwd());
  for (let depth = 0; depth < 6; depth += 1) {
    if (fs.existsSync(path.join(/*turbopackIgnore: true*/ cursor, "pnpm-workspace.yaml"))) {
      return path.join(/*turbopackIgnore: true*/ cursor, ".data", "publications.sqlite");
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "publications.sqlite");
}

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const THAI_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_OFFSET_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function toBangkokShiftedDate(dateOrIso: Date | string): Date {
  const date = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${String(dateOrIso)}`);
  }
  return new Date(date.getTime() + BANGKOK_OFFSET_MS);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Formats a Date or ISO timestamp as YYYY-MM-DD in Asia/Bangkok (+07:00). */
export function formatThaiDate(dateOrIso: Date | string): string {
  const shifted = toBangkokShiftedDate(dateOrIso);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

/** Formats a Date or ISO timestamp as YYYY-MM-DDTHH in Asia/Bangkok (+07:00). */
export function formatThaiHourSlot(dateOrIso: Date | string): string {
  const shifted = toBangkokShiftedDate(dateOrIso);
  return `${formatThaiDate(dateOrIso)}T${pad2(shifted.getUTCHours())}`;
}

/** Returns the next :00:00+07:00 hourly schedule timestamp in Asia/Bangkok. */
export function computeNextHourlyScheduledIso(nowOrIso: Date | string): string {
  const date = typeof nowOrIso === "string" ? new Date(nowOrIso) : nowOrIso;
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${String(nowOrIso)}`);
  }
  const shiftedMs = date.getTime() + BANGKOK_OFFSET_MS;
  const nextHourShiftedMs = (Math.floor(shiftedMs / 3_600_000) + 1) * 3_600_000;
  const shifted = new Date(nextHourShiftedMs);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}T${pad2(shifted.getUTCHours())}:00:00+07:00`;
}

/** Formats a Date or ISO timestamp as an ISO string with explicit +07:00 offset. */
export function formatBangkokTimestamp(dateOrIso: Date | string): string {
  const shifted = toBangkokShiftedDate(dateOrIso);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}T${pad2(shifted.getUTCHours())}:${pad2(shifted.getUTCMinutes())}:${pad2(shifted.getUTCSeconds())}+07:00`;
}

function assertThaiDate(value: string, label: string): void {
  if (!THAI_DATE_RE.test(value)) {
    throw new Error(`${label} must be YYYY-MM-DD, received: ${value}`);
  }
}

function assertOffsetTimestamp(value: string, label: string): void {
  if (!ISO_OFFSET_RE.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an ISO timestamp with explicit offset, received: ${value}`);
  }
}

function assertBilingualParity(brief: DailyBrief, followUps: BriefFollowUps): void {
  assertThaiDate(brief.publicationDate, "brief.publicationDate");
  assertOffsetTimestamp(brief.publishedAt, "brief.publishedAt");
  assertOffsetTimestamp(brief.evidence.evidenceCutoff, "brief.evidence.evidenceCutoff");

  if (brief.variants.th.language !== "th" || brief.variants.en.language !== "en") {
    throw new Error("DailyBrief requires th and en variants");
  }
  if (brief.evidence.sources.length === 0) {
    throw new Error("DailyBrief requires at least one evidence source");
  }
  if (followUps.publicationId !== brief.publicationId || followUps.publicationDate !== brief.publicationDate) {
    throw new Error("Follow-up cards must match the publication ID and publication date");
  }

  const thItems = brief.variants.th.newsItems ?? [];
  const enItems = brief.variants.en.newsItems ?? [];
  if (thItems.length !== enItems.length) {
    throw new Error("Thai and English newsItems counts must match under the same evidence snapshot");
  }
  for (let i = 0; i < thItems.length; i += 1) {
    if (
      thItems[i].newsId !== enItems[i].newsId ||
      thItems[i].sourceId !== enItems[i].sourceId ||
      thItems[i].importanceScore !== enItems[i].importanceScore
    ) {
      throw new Error(`Bilingual news item mismatch at index ${i}`);
    }
  }
}

export type FollowUpHandoffResult =
  | {
      status: "available";
      data: {
        brief: DailyBrief;
        card: BriefFollowUps["cards"][number];
        todayContext: DailyBrief;
      };
    }
  | {
      status: "unavailable";
      reason: "ARCHIVED_OR_FALLBACK_BRIEF_NO_QA" | "TODAY_NOT_PUBLISHED" | "CARD_NOT_FOUND";
    };

export class SqlitePublicationStore implements PublicationReadPort {
  private readonly db: DatabaseSync;

  constructor(dbPath = ":memory:") {
    if (dbPath !== ":memory:") {
      fs.mkdirSync(path.dirname(path.resolve(/*turbopackIgnore: true*/ dbPath)), { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS publications (
        publication_date TEXT PRIMARY KEY,
        publication_id TEXT NOT NULL UNIQUE,
        published_at TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS brief_follow_ups (
        publication_id TEXT PRIMARY KEY,
        publication_date TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS publication_jobs (
        job_key TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        requested_thai_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
        started_at TEXT NOT NULL,
        finished_at TEXT,
        error_message TEXT
      );
      CREATE TABLE IF NOT EXISTS publication_schedule_state (
        kind TEXT PRIMARY KEY,
        last_attempted_at TEXT,
        last_succeeded_at TEXT,
        update_status TEXT NOT NULL CHECK (update_status IN ('on-time', 'delayed', 'not-published')),
        next_scheduled_at TEXT
      );
    `);
  }

  close(): void {
    this.db.close();
  }

  publishDailyBriefAtomically(input: {
    brief: DailyBrief;
    followUps: BriefFollowUps;
    nextScheduledAt: string;
  }): void {
    const { brief, followUps, nextScheduledAt } = input;
    assertBilingualParity(brief, followUps);
    assertOffsetTimestamp(nextScheduledAt, "nextScheduledAt");

    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare("DELETE FROM brief_follow_ups WHERE publication_date = ?")
        .run(brief.publicationDate);

      this.db
        .prepare(
          `INSERT INTO publications (publication_date, publication_id, published_at, payload_json)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(publication_date) DO UPDATE SET
             publication_id = excluded.publication_id,
             published_at = excluded.published_at,
             payload_json = excluded.payload_json`,
        )
        .run(
          brief.publicationDate,
          brief.publicationId,
          brief.publishedAt,
          JSON.stringify(brief),
        );

      this.db
        .prepare(
          `INSERT INTO brief_follow_ups (publication_id, publication_date, payload_json)
           VALUES (?, ?, ?)
           ON CONFLICT(publication_id) DO UPDATE SET
             publication_date = excluded.publication_date,
             payload_json = excluded.payload_json`,
        )
        .run(followUps.publicationId, followUps.publicationDate, JSON.stringify(followUps));

      this.db
        .prepare(
          `INSERT INTO publication_schedule_state (kind, last_attempted_at, last_succeeded_at, update_status, next_scheduled_at)
           VALUES ('daily-brief', ?, ?, 'on-time', ?)
           ON CONFLICT(kind) DO UPDATE SET
             last_attempted_at = excluded.last_attempted_at,
             last_succeeded_at = excluded.last_succeeded_at,
             update_status = 'on-time',
             next_scheduled_at = excluded.next_scheduled_at`,
        )
        .run(brief.publishedAt, brief.publishedAt, nextScheduledAt);

      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  recordFailedUpdate(input: {
    attemptedAt: string;
    nextScheduledAt: string;
    errorMessage: string;
  }): void {
    assertOffsetTimestamp(input.attemptedAt, "attemptedAt");
    assertOffsetTimestamp(input.nextScheduledAt, "nextScheduledAt");

    const countRow = this.db
      .prepare("SELECT COUNT(*) AS count FROM publications")
      .get() as { count: number };
    const status: BriefUpdateStatus = countRow.count > 0 ? "delayed" : "not-published";

    this.db
      .prepare(
        `INSERT INTO publication_schedule_state (kind, last_attempted_at, last_succeeded_at, update_status, next_scheduled_at)
         VALUES ('daily-brief', ?, NULL, ?, ?)
         ON CONFLICT(kind) DO UPDATE SET
           last_attempted_at = excluded.last_attempted_at,
           update_status = ?,
           next_scheduled_at = excluded.next_scheduled_at`,
      )
      .run(input.attemptedAt, status, input.nextScheduledAt, status);
  }

  tryStartHourlyJob(input: {
    jobKey: string;
    jobId: string;
    requestedThaiDate: string;
    startedAt: string;
  }): { acquired: true } | { acquired: false; reason: string } {
    assertThaiDate(input.requestedThaiDate, "requestedThaiDate");
    assertOffsetTimestamp(input.startedAt, "startedAt");

    this.db.exec("BEGIN IMMEDIATE");
    try {
      const existing = this.db
        .prepare("SELECT status FROM publication_jobs WHERE job_key = ?")
        .get(input.jobKey) as { status: string } | undefined;

      if (existing && (existing.status === "running" || existing.status === "succeeded")) {
        this.db.exec("COMMIT");
        return { acquired: false, reason: `JOB_${existing.status.toUpperCase()}` };
      }

      this.db
        .prepare(
          `INSERT INTO publication_jobs (job_key, job_id, requested_thai_date, status, started_at, finished_at, error_message)
           VALUES (?, ?, ?, 'running', ?, NULL, NULL)
           ON CONFLICT(job_key) DO UPDATE SET
             job_id = excluded.job_id,
             status = 'running',
             started_at = excluded.started_at,
             finished_at = NULL,
             error_message = NULL`,
        )
        .run(input.jobKey, input.jobId, input.requestedThaiDate, input.startedAt);

      this.db.exec("COMMIT");
      return { acquired: true };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  finishHourlyJob(input: {
    jobKey: string;
    status: "succeeded" | "failed";
    finishedAt: string;
    errorMessage?: string | null;
  }): void {
    assertOffsetTimestamp(input.finishedAt, "finishedAt");
    this.db
      .prepare(
        `UPDATE publication_jobs
         SET status = ?, finished_at = ?, error_message = ?
         WHERE job_key = ?`,
      )
      .run(input.status, input.finishedAt, input.errorMessage ?? null, input.jobKey);
  }

  async brief(requestedThaiDate: string): Promise<DailyBriefLookup> {
    assertThaiDate(requestedThaiDate, "requestedThaiDate");

    const todayRow = this.db
      .prepare("SELECT payload_json FROM publications WHERE publication_date = ?")
      .get(requestedThaiDate) as { payload_json: string } | undefined;

    const scheduleRow = this.db
      .prepare(
        `SELECT last_attempted_at, update_status, next_scheduled_at
         FROM publication_schedule_state
         WHERE kind = 'daily-brief'`,
      )
      .get() as
      | {
          last_attempted_at: string | null;
          update_status: BriefUpdateStatus;
          next_scheduled_at: string | null;
        }
      | undefined;

    const nextScheduledAt =
      scheduleRow?.next_scheduled_at ?? computeNextHourlyScheduledIso(new Date());
    const lastAttemptedAt = scheduleRow?.last_attempted_at ?? null;

    if (todayRow) {
      const todayBrief = JSON.parse(todayRow.payload_json) as DailyBrief;
      const updateStatus: BriefUpdateStatus =
        scheduleRow?.update_status === "delayed" ? "delayed" : "on-time";
      return {
        requestedThaiDate,
        display: { status: "available", data: todayBrief },
        todayContext: { status: "available", data: todayBrief },
        updateStatus,
        nextScheduledAt,
        lastAttemptedAt,
      };
    }

    const previousRow = this.db
      .prepare(
        `SELECT payload_json
         FROM publications
         WHERE publication_date < ?
         ORDER BY publication_date DESC
         LIMIT 1`,
      )
      .get(requestedThaiDate) as { payload_json: string } | undefined;

    if (previousRow) {
      const previousBrief = JSON.parse(previousRow.payload_json) as DailyBrief;
      const updateStatus: BriefUpdateStatus =
        scheduleRow?.update_status === "delayed" ? "delayed" : "not-published";
      return {
        requestedThaiDate,
        display: { status: "available", data: previousBrief },
        todayContext: { status: "unavailable", reason: "TODAY_NOT_PUBLISHED" },
        updateStatus,
        nextScheduledAt,
        lastAttemptedAt,
      };
    }

    return {
      requestedThaiDate,
      display: { status: "unavailable", reason: "NOT_YET_PUBLISHED" },
      todayContext: { status: "unavailable", reason: "TODAY_NOT_PUBLISHED" },
      updateStatus: "not-published",
      nextScheduledAt,
      lastAttemptedAt,
    };
  }

  async archive(publicationDate: string): Promise<Result<DailyBrief>> {
    assertThaiDate(publicationDate, "publicationDate");
    const row = this.db
      .prepare("SELECT payload_json FROM publications WHERE publication_date = ?")
      .get(publicationDate) as { payload_json: string } | undefined;

    if (!row) {
      return { status: "unavailable", reason: "ARCHIVE_NOT_FOUND" };
    }
    return { status: "available", data: JSON.parse(row.payload_json) as DailyBrief };
  }

  async summary(listing: ListingKey, requestedThaiDate: string): Promise<StockSummaryLookup> {
    assertThaiDate(requestedThaiDate, "requestedThaiDate");
    return {
      requestedThaiDate,
      listing: { ...listing, companyId: `${listing.market}_${listing.symbol}` },
      result: { status: "unavailable", reason: "STOCK_SUMMARY_OWNED_BY_SFA_1" },
    };
  }

  async followUps(publicationId: string): Promise<Result<BriefFollowUps>> {
    const row = this.db
      .prepare("SELECT payload_json FROM brief_follow_ups WHERE publication_id = ?")
      .get(publicationId) as { payload_json: string } | undefined;

    if (!row) {
      return { status: "unavailable", reason: "FOLLOW_UPS_NOT_FOUND" };
    }
    return { status: "available", data: JSON.parse(row.payload_json) as BriefFollowUps };
  }

  listAvailableDates(): string[] {
    const rows = this.db
      .prepare("SELECT publication_date FROM publications ORDER BY publication_date DESC")
      .all() as { publication_date: string }[];
    return rows.map((row) => row.publication_date);
  }

  async validateFollowUpHandoff(input: {
    cardId: string;
    publicationId: string;
    requestedDate: string;
    currentThaiDate: string;
  }): Promise<FollowUpHandoffResult> {
    assertThaiDate(input.requestedDate, "requestedDate");
    assertThaiDate(input.currentThaiDate, "currentThaiDate");

    if (input.requestedDate !== input.currentThaiDate) {
      return { status: "unavailable", reason: "ARCHIVED_OR_FALLBACK_BRIEF_NO_QA" };
    }

    const lookup = await this.brief(input.currentThaiDate);
    if (lookup.todayContext.status !== "available") {
      return { status: "unavailable", reason: "TODAY_NOT_PUBLISHED" };
    }
    if (
      lookup.todayContext.data.publicationId !== input.publicationId ||
      lookup.todayContext.data.publicationDate !== input.currentThaiDate
    ) {
      return { status: "unavailable", reason: "ARCHIVED_OR_FALLBACK_BRIEF_NO_QA" };
    }

    const followUpsResult = await this.followUps(input.publicationId);
    if (followUpsResult.status !== "available") {
      return { status: "unavailable", reason: "CARD_NOT_FOUND" };
    }

    const card = followUpsResult.data.cards.find((item) => item.cardId === input.cardId);
    if (!card) {
      return { status: "unavailable", reason: "CARD_NOT_FOUND" };
    }

    return {
      status: "available",
      data: {
        brief: lookup.todayContext.data,
        card,
        todayContext: lookup.todayContext.data,
      },
    };
  }
}
