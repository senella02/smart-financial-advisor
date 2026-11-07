# ADR 0001 Next.js Application, Background Worker, and Shared Workspace

Status: Accepted

Date: 2026-11-07

Decision source: Owner's [SFA-5 setup brief and acceptance](../source-notes.md#s4-owner-supplied-sfa-5-setup-brief) and [application/worker agreement](../source-notes.md#s6-owner-confirmed-application-and-worker-boundary) on 7 November 2026

Related requirements: [Phase 1 scope, publications, and grounded AI](../functional-requirements.md)

## Context

SFA-5 supplies a fixture-only Next.js foundation. The full product needs interactive stock research and account features alongside scheduled publications and recurring RAG ingestion. These workloads need different execution lifecycles: web requests should not depend on completing document acquisition, extraction, and indexing.

The application framework and workspace were prescribed in the setup brief; this was not a measured framework comparison. The subsequent owner agreement selected separate background execution. This records the intended architecture; the worker and live research features are not implemented.

## Decision and rationale

Keep one Next.js App Router application in `apps/web` for the UI and application backend, including interactive AI endpoints and future account/private-data operations. Server Components call server-only application modules directly; add Route Handlers only when a feature requires an HTTP interface. External adapters and credentials stay behind the server boundary.

Use a separately executed background worker for recurring document ingestion/RAG index updates and scheduled publication generation. A scheduler triggers work; the worker executes it. Scheduling does not require a Python server. Whether the worker is continuously running or starts per job remains a deployment choice. The target is two application execution roles, not a promise of two machines or instances; storage, indexing, and scheduling are additional infrastructure dependencies.

Keep market-data access and financial normalization in a shared server-side application module used by stock APIs/pages, AI tools, and publication workflows. Provider adapters implement one set of identity, timestamp, unit, and missing-data rules. AI tools wrap that service rather than independently fetching a second interpretation of the same data. Share retrieval/generation and publication logic where the web app and worker need the same behavior.

Use the pnpm TypeScript workspace with `packages/contracts` for common validation schemas, inferred types, and internal ports. Extract shared server logic into workspace packages when the worker needs it; keep those modules independent of Next.js request APIs and browser code. Prefer TypeScript for shared application and worker logic. Python remains an option for document processing when a verified dependency or selective reuse justifies it; no separate Python application backend or Python worker is selected merely because the reference project used them.

This keeps contracts, ordinary application logic, and releases coordinated without an additional application API boundary. Separate background execution provides isolation and recovery for long-running jobs. The old project's algorithms, prompts, utilities, and evaluation cases may be adapted when they fit; its runtime topology, orchestration frameworks, and ingestion schedule are not inherited.

## Alternatives and tradeoffs

- A Next.js frontend with a full Python backend enables direct Python reuse and independent backend releases, but adds a cross-language application contract and another online service. Revisit if verified Python dependencies or online workload constraints outweigh the shared TypeScript approach.
- Running ingestion inside web requests reduces initial infrastructure but couples job completion to request lifetimes and web resources. Separate execution adds job coordination and deployment work while allowing independent retries and resource allocation.
- Keeping contracts private inside the web application reduces packaging but makes worker reuse harder. Shared packages require coordinated changes and compatible runtime tooling.

## Consequences

UI and interactive backend share a release/runtime boundary. Background work has a separate execution lifecycle and may share the machine or run separately. Durable job state, safe retries, and overlap prevention must be implemented before enabling recurring work; scheduler, coordination mechanism, storage, and hosting products remain open. A worker must not depend on process-local web state. Published content and the usable document index must remain available while updates are prepared or fail.

Stock-summary first-open generation must preserve the required listing/Thai-day identity and coordinate concurrent requests. Whether that generation finishes within a web request or is delegated to the worker depends on measured duration; this does not change its product trigger into scheduled generation. Publication cadences and acceptance criteria remain in the functional requirements. Recurring RAG refresh is intended, but its cadence and optimization techniques are not selected.

TypeScript consumers must transpile the source-only contracts; Next uses `transpilePackages`. Worker packaging must support its actual runtime. Independent package distribution or non-TypeScript consumers require revisiting packaging and runtime validation. Resource limits, recovery, streaming duration, and provider coverage need validation during implementation. No worker directory, framework, task runner, queue, model, database, vector store, or hosting platform is selected here.

## References

- [Contract and trust-boundary architecture](0002-validated-contracts-and-data-trust-boundaries.md)
- [Developer guide](../developer-guide.md)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js backend-for-frontend guide and deployment caveats](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [pnpm workspaces](https://pnpm.io/workspaces)
