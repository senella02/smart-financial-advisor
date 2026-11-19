# ADR 0001 Next.js Application, Background Worker, and Shared Workspace

Status: Accepted

Date: 2026-11-07

Decision sources are the owner's [framework and workspace choices](../source-notes.md#s4-owner-confirmed-application-framework-and-contract-choices) and [application and worker agreement](../source-notes.md#s6-owner-confirmed-application-and-worker-boundary) on 7 November 2026.

Related requirements: [Phase 1 scope, publications, and grounded AI](../functional-requirements.md)

## Context

Interactive requests and recurring jobs have different execution lifecycles. The application needs to serve requests while background work runs, fails, or retries.

## Decision and rationale

Keep one Next.js App Router application in `apps/web` for the UI and interactive backend, including AI requests. This keeps the browser and application backend within one deployment and avoids a separate online AI service.

Use a separate worker execution for scheduled jobs. The scheduler invokes work independently of interactive requests, so job retries and resource limits can be handled separately. Future recurring ingestion follows this boundary when it enters scope. The deployment choice belongs in [ADR 0006](0006-vercel-hosting-and-scheduled-publication-trigger.md).

Use the pnpm TypeScript workspace for both execution roles. Share server-side market data, financial normalization, and publication logic wherever both roles need them. Modules imported by the worker stay independent of Next.js request APIs and browser code. [ADR 0002](0002-validated-contracts-and-data-trust-boundaries.md) defines the shared contracts and provider boundaries.

## Alternatives and tradeoffs

- A Next.js frontend with a Python backend would enable direct Python reuse and independent backend releases. It would add a second online service and a cross-language contract. Python remains an option for isolated processing if a verified dependency warrants it.
- Running scheduled jobs in the web process would simplify deployment on a single host. It would tie job execution to web process uptime and compete for request resources.

## Consequences

The UI and interactive backend share a release boundary. The worker has its own execution lifecycle and uses durable state for coordination. Both runtimes must be able to load shared workspace packages. [ADR 0004](0004-shared-publication-consistency.md) defines the publication guarantees those runtimes rely on.

## References

- [Contract and trust-boundary architecture](0002-validated-contracts-and-data-trust-boundaries.md)
- [Developer guide](../developer-guide.md)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js backend-for-frontend guide and deployment caveats](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [pnpm workspaces](https://pnpm.io/workspaces)
