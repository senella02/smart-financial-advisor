# Architecture options for team discussion

Updated 21 November 2026 · Research summary, not an acceptance record.

The current comprehensive evidence report is [Architecture research in Thai](architecture-options-th.md). The separate [Security and context RFC](../rfcs/architecture-security-and-context.md) records the proposed design. This overview replaces the earlier combined research/proposal summary so its outdated assumptions do not compete with the current requirements.

## Current baseline and proposed target

Next.js on Vercel and Supabase PostgreSQL remain the accepted baseline. [ADR 0006](../adr/0006-vercel-hosting-and-scheduled-publication-trigger.md) confirms Vercel Schedules, Queues, and Functions for Phase 1. Phase 1 uses PostgreSQL full-text search with Thai segmentation, guest chat, and session-only history. The [proposed final design](../final/final-architecture.md) uses Airflow for ingestion, indexing, backfills and publications, with Pinecone for public vectors. Source passages, citation provenance and durable job/publication authority remain in Supabase.

[ADR 0007](../adr/0007-managed-worker-execution.md) remains Proposed. Trigger.dev is an alternative if measurements justify revisiting Phase 1 execution; it is not a mandatory addition or an accepted replacement for Vercel. Its Free plan has bounded credits, short log retention and restrictions on newly created schedules. Read the linked Thai report and current provider sources before estimating cost. The [service comparison](final-architecture-service-options.md#background-execution-for-the-final-version) covers Vercel, Trigger.dev, Cloud Run Jobs and Airflow.

## Coverage of the three research questions

| Question | Evidence and proposed treatment |
| --- | --- |
| Security guardrails | Enforce identity, ownership, tool scope, usage budgets and provider restrictions in server code. Treat documents/history as untrusted. Validate material claims and citations before delivery; do not expose raw prompts in telemetry. |
| Worker and RAG ingestion | Keep durable job IDs and claims in PostgreSQL, acknowledge dispatch, recover pending/expired work, reject stale publications, version documents and activate only complete searchable evidence. The old LLMFA DAG is a reuse reference, not a drop-in deployment. |
| User context | Store account records under explicit ownership in private PostgreSQL tables. Build minimum context on the server using current preferences and per-question attachments. Keep private context outside shared publications, caches and vector indexes. |

The [question record](../requirements-questions.md#q07-personalization-and-personal-data-controls) now confirms Profile off by default, per-question Watchlist/Portfolio attachments, opt-in saved chat expiry 90 days after the last message, and app-controlled backup retention of at most 30 days. Apply deletion and expiration before serving a restore. Authentication details, private model approval, some cross-device behavior, quantitative performance targets and operating budget remain open. Requirements are authoritative for these rules; this report does not reopen settled product decisions.

The Thai report links the pinned LLMFA source review and primary provider documentation. Neither this review nor the RFC reports completed deployment, retrieval benchmarks or security test results.
