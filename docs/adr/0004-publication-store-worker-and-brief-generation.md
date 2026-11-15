# ADR 0003 SQLite Publication Store, Hourly Background Worker, and Provider-Neutral Brief Generation

Status: Accepted

Date: 2026-11-14

Decision source: SFA-4 design agreement on 14 November 2026, extending [ADR 0001](0001-nextjs-application-and-shared-workspace.md) and [ADR 0002](0002-validated-contracts-and-data-trust-boundaries.md)

Related requirements: [FR-02, FR-03, FR-04, FR-05, FR-11, FR-19, FR-20, FR-21](../functional-requirements.md)

## Context

SFA-4 (Home Market Overview & Daily Brief) and SFA-1 (Shared Daily Stock Summary) require durable shared publication storage and scheduled background execution. Specifically, Daily Brief publication must:
1. Generate and replace each `Asia/Bangkok` calendar date's publication atomically across Thai and English variants from a single evidence snapshot.
2. Retain the latest successful publication per past Thai date for read-only archive access.
3. Preserve the last readable publication when an hourly update fails and expose explicit delayed-update and next-scheduled-update metadata.
4. Separate Home display fallback (showing yesterday's latest brief with its actual date until today's first brief succeeds) from current-day AI context (`todayContext`).
5. Prevent overlapping hourly publication runs without introducing external database servers or native C++ build dependencies restricted in `pnpm-workspace.yaml`.

## Decision and rationale

1. **Publication and Job Storage via `node:sqlite` (`DatabaseSync`):**
   Store publications, follow-up cards, hourly job locks, and scheduler state in SQLite using Node's built-in `node:sqlite` module (`DatabaseSync`). SQLite provides ACID `BEGIN IMMEDIATE` transactions for atomic bilingual updates and single-slot job locking without requiring external DB infrastructure or native package compilation (`onlyBuiltDependencies` in `pnpm-workspace.yaml` remains restricted). The store implements `PublicationReadPort` so `apps/web` and `apps/worker` share identical `Asia/Bangkok` rollover, archive, and handoff validation semantics.

2. **Separate Background Worker & Hourly Scheduler (`apps/worker`):**
   Execute Daily Brief scoring, bilingual generation, and publication inside a dedicated TypeScript CLI package (`apps/worker`) aligned with [ADR 0001](0001-nextjs-application-and-shared-workspace.md). The scheduler triggers at minute `:00` in `Asia/Bangkok` every day including weekends and also exposes a `--once` execution mode for OS cron triggers and controlled tests.

3. **Provider-Neutral Brief Generation with Gemini REST Adapter and Deterministic Fallback:**
   Keep news importance scoring (`1..10`) and single-snapshot bilingual (`th`/`en`) Daily Brief + follow-up card synthesis behind a provider-neutral generator boundary. When `GEMINI_API_KEY` is configured server-side, the generator calls the Google Gemini REST API using `fetch` and validates structured JSON output with strict schema checks before publication. When credentials are absent (such as local fixture mode or CI), a deterministic generator produces schema-valid bilingual outputs from the scored evidence snapshot.

## Alternatives and tradeoffs

- **PostgreSQL + Drizzle/Prisma:** Stronger multi-host concurrency for distributed deployments, but adds external database setup and migrations that are unnecessary for a single-node capstone prototype. Revisit if multi-instance horizontal scaling is adopted.
- **Plain JSON files on disk:** Simpler than SQLite, but concurrent hourly jobs and future SFA-1 first-open stock-summary writes risk race conditions during read-modify-write cycles.
- **`better-sqlite3`:** Mature SQLite wrapper, but requires native compilation (`node-gyp`) blocked by the workspace's `onlyBuiltDependencies` restriction. Node's built-in `node:sqlite` requires zero native build steps.
- **In-process Next.js `setInterval` timer:** Couples background jobs to web request lifecycles and violates [ADR 0001](0001-nextjs-application-and-shared-workspace.md).

## Consequences

- `apps/web/next.config.ts` marks `node:sqlite` in `serverExternalPackages` so Next.js server bundling leaves Node's built-in SQLite module external.
- Web Server Components and Route Handlers read publications from the shared store and never invoke brief generation inside page renders.
- All scheduled publication timestamps, date rollovers, and hourly job slot keys (`YYYY-MM-DDTHH`) use explicit `Asia/Bangkok` (`+07:00`) calculations.
- Future SFA-1 stock summaries can reuse the same SQLite store and job-coordination pattern without changing client trust boundaries.

## References

- [ADR 0001 Next.js Application, Background Worker, and Shared Workspace](0001-nextjs-application-and-shared-workspace.md)
- [ADR 0002 Validated Contracts and Data Trust Boundaries](0002-validated-contracts-and-data-trust-boundaries.md)
- [Contracts and Integration Boundaries](../contracts-and-boundaries.md)
- [Functional Requirements](../functional-requirements.md)
