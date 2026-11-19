# ADR 0006 Vercel hosting and scheduled execution

Status: Accepted for web hosting. Production scheduler open.

Date: 2026-11-15

Decision source: Owner direction to host the web application on Vercel in the SFA-4 working session on 15 November 2026.

Related requirements: [FR-03 publication cadence](../functional-requirements.md#fr-03-daily-brief-content-and-publication) and [Q08 delivery and release expectations](../requirements-questions.md#q08-release-quality-and-evaluation)

## Context

The interactive application and recurring work need independent execution. Production needs a way to invoke the worker on a schedule, and development needs a way to run the same job on demand.

## Decision and rationale

Host the Next.js application on Vercel. Keep the worker callable through a standalone entry point that can run a single job. Scheduled and manual invocations use the same job logic, which stays independent of Next.js request APIs. Both execution roles use the durable storage in [ADR 0005](0005-supabase-postgres-for-shared-and-private-data.md).

GitHub Actions is the recommended initial scheduler, pending selection. It can execute the standalone worker on a runner without adding a public job endpoint to the web application. GitHub can delay or drop scheduled runs under load, so the recommendation depends on the project tolerating occasional timing gaps. [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## Alternatives and tradeoffs

- Vercel Schedules can invoke a private function and keep scheduling on the web hosting platform. It supports hourly runs on Hobby with a 15-minute jitter window as of 19 November 2026. It is in beta and a function target is subject to runtime limits. Legacy Vercel Cron Jobs limit Hobby to daily runs. [Vercel Schedules](https://vercel.com/docs/schedules), [Schedules limits](https://vercel.com/docs/schedules/limits), [legacy Cron limits](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing)
- A dedicated job runner would give longer work its own runtime and operational controls. It would add a deployment and its associated cost and setup.

## Consequences

Keep scheduler failures and delayed runs observable. The worker must tolerate repeated invocation and preserve the last successful publication, following [ADR 0004](0004-shared-publication-consistency.md). Revisit the execution host if measured runtime or scheduling reliability exceeds the chosen service's limits. Record the selected scheduler here and keep the exact schedule, commands, and deployment configuration in the developer guide.

## References

- [ADR 0001 Next.js application, background worker, and shared workspace](0001-nextjs-application-and-shared-workspace.md)
- [ADR 0004 Shared publication consistency](0004-shared-publication-consistency.md)
