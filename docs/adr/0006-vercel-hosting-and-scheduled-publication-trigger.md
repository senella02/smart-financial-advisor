# ADR 0006 Vercel hosting and scheduled execution

Status: Accepted

Date: 2026-11-15

Updated: 2026-11-21

Decision sources: The owner chose Vercel for web hosting in the SFA-4 working session on 15 November 2026 and initially selected Vercel Hobby for the worker on 20 November. On 21 November 2026, after reviewing the Trigger.dev proposal, the owner confirmed Vercel for Phase 1 ingestion and publication jobs. [Source register](../source-notes.md#s6-owner-confirmed-application-and-worker-boundary)

Related requirements: [FR-03 news ingestion and Daily Brief](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication), [FR-11 first-open stock summaries](../final/functional-requirements.md#fr-11-shared-daily-stock-summary), [FR-12 filing ingestion](../final/functional-requirements.md#fr-12-financial-data-and-news), and [Q08 delivery expectations](../requirements-questions.md#q08-release-quality-and-evaluation)

## Context

The Next.js application serves interactive requests. Background jobs ingest evidence, publish the hourly Daily Brief, and generate a stock summary when a visitor first opens the listing that Thai calendar day. Development needs a way to run these jobs on demand.

## Decision and rationale

Deploy the Next.js app and Phase 1 background jobs in the same Vercel project, starting on Hobby. Vercel manages Next.js deployments, pull request previews, and CDN caching. Separate Vercel Functions run publication and ingestion asynchronously. Use separate queue topics for the two workloads so slow filing imports do not occupy publication queue capacity. Recurring ingestion processes new or amended documents in bounded batches. [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Vercel Hobby](https://vercel.com/docs/plans/hobby)

- Vercel Schedules sends news and filing checks to the ingestion queue and sends the hourly Daily Brief job to the publication queue. The updated FR-03 has the publication worker fetch Brief inputs through the shared market data adapter during the run. The scheduled ingestion queue supplies the public evidence corpus for other workflows. [Daily Brief market coverage](../rfcs/daily-brief-market-coverage.md) [Vercel Schedules configuration](https://vercel.com/docs/schedules/configuration)
- On a listing's first open of the Thai calendar day, the web server records the stock-summary job in Supabase PostgreSQL and queues its job ID. Vercel Queues invokes the same worker for both message types. [Vercel Queues](https://vercel.com/docs/queues)

The publication worker claims jobs and commits completed publications in Supabase PostgreSQL. The web app reads publications from that database. Keep the job logic independent of Next.js request APIs so it can run locally or move to another host. [ADR 0001](0001-nextjs-application-and-shared-workspace.md), [ADR 0004](0004-shared-publication-consistency.md), [ADR 0005](0005-supabase-postgres-for-shared-and-private-data.md)

See the [Phase 1 architecture](../phase-1-planning/architecture.md#deployment) for the deployment diagram and the [Phase 1 requirements](../phase-1-planning/functional-requirements.md#daily-brief-and-stock-detail-pilot) for the pilot corpus.

## Alternatives and tradeoffs

- **Trigger.dev Cloud for background jobs.** Managed TypeScript tasks support configurable run durations and shared concurrency limits for upstream APIs. Trigger.dev adds a separate deployment and provider. New Free schedules use a 60-minute window. Compare paid Trigger.dev with Vercel Pro if Phase 1 needs tighter timing or longer runs. [ADR 0007](0007-managed-worker-execution.md), [Trigger.dev duration](https://trigger.dev/docs/runs/max-duration), [Trigger.dev scheduling](https://trigger.dev/docs/tasks/scheduled#free-plan-minimum-window)
- **Cloud Run service for Next.js.** Cloud Run gives the team control over container scaling and access through Google Cloud IAM. The team owns the build and deployment setup and any shared cache needed across Next.js instances. Vercel handles more of that setup for this application. [Next.js on Cloud Run](https://docs.cloud.google.com/run/docs/quickstarts/frameworks/deploy-nextjs-service), [Cloud Run overview](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run), [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- **Cloud Run Jobs.** Cloud Scheduler starts the hourly Daily Brief. The web server can start a stock-summary job through the authenticated Cloud Run API after it records the job in PostgreSQL. Cloud Run Jobs gives the worker a separate deployment and a longer task timeout. [Scheduled jobs](https://docs.cloud.google.com/run/docs/execute/jobs-on-schedule), [On-demand jobs](https://docs.cloud.google.com/run/docs/execute/jobs), [Task timeout](https://docs.cloud.google.com/run/docs/configuring/task-timeout)

## Consequences

Vercel Schedules and Queues are in beta. Hobby has a 15-minute scheduling window and a five-minute function limit with Fluid Compute. Measure dispatch delay, queue wait, execution time, and time to a searchable or published result. Use representative Thai and US filings, a realistic day of news, and a burst of first-open stock summaries. Review the Vercel plan if the deployment moves into commercial or team use. [Schedules limits](https://vercel.com/docs/schedules/limits), [Queues](https://vercel.com/docs/queues), [Function duration](https://vercel.com/docs/functions/configuring-functions/duration), [Hobby plan](https://vercel.com/docs/plans/hobby)

Reconsider Trigger.dev if routine ingestion batches repeatedly approach the five-minute limit, or if scheduler delay, queue delays, or contention between jobs cause repeated misses against the agreed publication window. Compare paid Trigger.dev and Vercel Pro on the same workloads, including retry recovery and cost. Supabase remains the authority for job claims and publication state if the runner changes. [Q08 evaluation](../requirements-questions.md#q08-release-quality-and-evaluation), [ADR 0007](0007-managed-worker-execution.md)

Keep scheduler failures and delayed runs observable. The worker must tolerate repeated invocation and preserve the last successful publication. [ADR 0004](0004-shared-publication-consistency.md)

## References

- [ADR 0001 Next.js application, background worker, and shared workspace](0001-nextjs-application-and-shared-workspace.md)
- [ADR 0004 Shared publication consistency](0004-shared-publication-consistency.md)
