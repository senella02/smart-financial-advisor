# ADR 0006 Vercel hosting and scheduled execution

Status: Accepted for web hosting. Production scheduler open.

Date: 2026-11-15

Decision source: Owner direction to host the web application on Vercel in the SFA-4 working session on 15 November 2026.

Related requirements: [FR-03 publication cadence](../functional-requirements.md#fr-03-daily-brief-content-and-publication) and [Q08 delivery and release expectations](../requirements-questions.md#q08-release-quality-and-evaluation)

## Context

The interactive application and recurring work need independent execution. Production needs a way to invoke the worker on a schedule, and development needs a way to run the same job on demand.

## Decision and rationale

Host the Next.js application on Vercel. Keep the worker callable through a standalone entry point that can run a single job. Scheduled and manual invocations use the same job logic, which stays independent of Next.js request APIs. Both execution roles use the durable storage in [ADR 0005](0005-supabase-postgres-for-shared-and-private-data.md).

## Alternatives and tradeoffs

Running scheduled jobs through the interactive application would share its deployment and runtime limits. A standalone worker can run on a separate job runner and allows the same job logic to run locally on demand.

## Consequences

Keep scheduler failures and delayed runs observable. The worker must tolerate repeated invocation and preserve the last successful publication, following [ADR 0004](0004-shared-publication-consistency.md).

## References

- [ADR 0001 Next.js application, background worker, and shared workspace](0001-nextjs-application-and-shared-workspace.md)
- [ADR 0004 Shared publication consistency](0004-shared-publication-consistency.md)
