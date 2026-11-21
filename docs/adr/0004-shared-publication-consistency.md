# ADR 0004 Shared publication consistency

Status: Accepted

Date: 2026-11-14

Decision source: SFA-4 design agreement on 14 November 2026. [ADR 0005](0005-supabase-postgres-for-shared-and-private-data.md) supersedes the original SQLite storage choice.

Related requirements: [FR-03 Daily Brief publication](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication) and [FR-11 shared stock summaries](../final/functional-requirements.md#fr-11-shared-daily-stock-summary)

## Context

Shared content may be generated in multiple languages and refreshed while readers are using it. Concurrent or retried generation can otherwise publish incomplete content, repeat work, or replace newer content with an older result.

## Decision and rationale

Store a durable publication under a stable key. Commit its language variants, evidence snapshot, and associated metadata in one transaction. A reader sees a complete version with one evidence cutoff. Failed attempts preserve the last successful publication.

Recurring jobs claim work in durable storage before generating content. Claims prevent overlapping work and allow recovery after an interrupted run. Retrying a completed job is safe. A superseded attempt cannot commit over a newer publication. Run scheduled jobs independently of interactive reads, following [ADR 0001](0001-nextjs-application-and-shared-workspace.md).

## Alternatives and tradeoffs

- Publishing each language separately allows each result to arrive earlier. Readers could see variants that use different evidence or belong to different versions.
- In-memory coordination is simpler within one process. It loses job state on restart and cannot coordinate independent instances.

## Consequences

Store publication and attempt state separately enough for readers to distinguish the last success from a later failed or missed update. Keep generation outside the publication transaction and commit only a complete, validated result. [ADR 0005](0005-supabase-postgres-for-shared-and-private-data.md) defines the storage engine. The linked requirements define triggers, schedules, retention, and how published content is used.

## References

- [ADR 0002 Validated contracts and data trust boundaries](0002-validated-contracts-and-data-trust-boundaries.md)
- [ADR 0006 Vercel hosting and scheduled execution](0006-vercel-hosting-and-scheduled-publication-trigger.md)
