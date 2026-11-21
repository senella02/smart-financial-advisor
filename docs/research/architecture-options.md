# Architecture options for team discussion

The review covered the repository documentation and the `setup-project-architecture` branch on 20 November 2026. The proposal draws on that review and on provider documentation. Deployment, benchmarks, and team approval are still pending.

[ADR 0006](../adr/0006-vercel-hosting-and-scheduled-publication-trigger.md) sets Vercel Schedules, Queues, and Functions as the starting point. This document records the rationale for considering Trigger.dev Cloud if testing reveals limitations in how Vercel runs the worker.

## Trigger.dev Cloud proposal

Keep **Next.js on Vercel and Supabase PostgreSQL** as agreed in ADRs 0001, 0005, and 0006. Consider **Trigger.dev Cloud** to run the worker separately from the web app. Next.js handles chat responses. The worker generates summaries and ingests documents. Both can share server modules that are independent of the Next.js request API.

| Area | Repository baseline | Proposal |
| --- | --- | --- |
| Web and API | The team agreed to use Next.js and Vercel. | Keep the existing setup. |
| Background jobs | Separate worker execution starts with Vercel Schedules, Queues, and Functions. `apps/worker` contains a placeholder. | Consider Trigger.dev Cloud if the team revisits worker execution. |
| Persistent data | The team agreed to use Supabase PostgreSQL. Migrations are still a placeholder. | Store publications, evidence, and job state in PostgreSQL. |
| Security | The project documents its trust boundaries. | Enforce the boundaries through API validation, database permissions, retrieval, and output validation. |
| User context | Phase 1 has no user accounts. Chat history lasts for the session. | In a later phase, store profile and portfolio data as relational records and assemble context on the server. |
| Retrieval-augmented generation (RAG) | The [financial evidence retrieval RFC](../rfcs/financial-evidence-retrieval.md) proposes full-text search for Phase 1 and Pinecone as a later target. | Evaluate pgvector as an alternative for vector search. |

## 1. Background job execution

| Option | Strengths | Tradeoffs and fit |
| --- | --- | --- |
| **Trigger.dev Cloud** | Managed workers run TypeScript tasks on schedules or events, with retries, concurrency controls, and run visibility. Evaluate this option first if revisiting the runner. [1–3] | Adds a provider and charges for compute and invocations. Verify runtime compatibility and workspace packaging in a deployment. |
| Vercel Schedules with Workflow or Queues | Uses the existing hosting provider. Schedules supports time zones and private targets, and can start a durable workflow. [4] | Schedules was in beta at the time of review. Evaluate target runtime limits and costs before choosing. |
| Apache Airflow | Directed acyclic graphs (DAGs) describe task dependencies and let operators track workflows. Airflow fits batch pipelines with multiple sources and backfills. [5] | Requires a scheduler, DAG processor, API server, and metadata database. The review judged this more operational work than the prototype needs. |
| Legacy Vercel Cron Jobs | Can trigger short jobs. | The Hobby plan allows daily runs, while the Daily Brief needs hourly runs. Cron Jobs and Schedules are separate Vercel products. [6] |

The earlier team's DAG may offer a useful model for task dependencies. For example, fetch data, validate and normalize it, generate both language versions, verify the evidence, and publish. The DAG and its code were unavailable for review, so code reuse remains unverified. Any runner that supports the required steps can implement the pipeline.

An hourly scheduled task runs the Daily Brief. For the shared daily stock summary, the web app resolves the listing and the date in Thailand, then sends the listing identifier to trigger a job on the first visit of that day. Long-running ingestion runs outside the HTTP request. Manual and scheduled runs share the same logic.

The database determines whether a job succeeded. Use a unique job key, a claim that can expire and be recovered, and an attempt or version check to prevent an older run from overwriting a newer one. Publish both language versions and their evidence in one transaction, as described in [ADR 0004](../adr/0004-shared-publication-consistency.md). Runner idempotency reduces duplicate work within its time-to-live (TTL). Database constraints enforce consistency after the TTL expires. [2] If the runner fails, show the last successful publication and its original timestamp. Define missed-run recovery in the worker.

At the pricing reviewed on 20 November 2026, the Trigger.dev Free plan included $5 in monthly credits, 10 schedules, and one day of log retention. Trigger.dev charged separately for compute and invocations, so keep required job state in the database. [3] At 720 runs per month averaging 60 seconds each on Small 1x, the estimated runner cost was 720 × (60 × $0.0000338 + $0.000025) ≈ **$1.48 per month**. The estimate excludes retries, ingestion, stock summaries, LLM calls, embeddings, the database, and web hosting. Whether the full system fits within the free plan remains open.

## 2. Evidence retrieval and document ingestion

The worker takes a source ID from a list maintained by the team. It fetches the document with limits on domains, redirects, response size, and request duration. It parses and validates the document, extracts the content, and removes duplicates using a content hash. When needed, it splits the text into chunks and generates embeddings. It saves the document version and activates it once processing is complete. Keep the source URL, document ID, reporting period, observation and fetch times, and text location for citations.

Store metadata and chunks in PostgreSQL. If semantic search is needed, try pgvector in Supabase before adding a separate vector database. [7] Keep original files that require retention in object storage after verifying storage and reuse rights. The web app's local disk is temporary. Evaluate the embedding model, vector dimensions, chunking, and indexing on Thai and English content before choosing them. The review included no retrieval tests.

Use structured queries and verifiable formulas as the primary source for prices, financial statements, and portfolio figures. RAG retrieves supporting text for explanations. Phase 1 can ingest a subset of document types, and file uploads and long-term memory are outside its scope.

## 3. Security controls

Apply controls at each existing trust boundary. Prompt injection remains possible when the app uses a system prompt and RAG. [8]

- Validate the request schema and size before calling the model. Resolve the listing and evidence on the server. Limit request rates, token usage, and concurrency for guest chat. Treat browser-supplied history as untrusted and exclude it from citation evidence.
- Give the model access only to approved tools with validated inputs. Exclude arbitrary SQL, shell commands, URLs, and any ability to change holdings. Give the shared publication worker no read access to private tables.
- Treat retrieved passages as data and keep them separate from instructions. Limit sources and retrieval rounds, record provenance, and verify permissions before retrieving private data.
- Validate the output schema. Require each citation to point to retrieved evidence that supports the claim. Verify numbers, units, and periods in code where possible. If evidence is sparse, narrow the answer or say that the relevant information was unavailable. Use an evaluation set to measure errors in semantic checks.
- Disable raw HTML when rendering Markdown and filter URL schemes. Keep secrets on the server, remove private data from logs and traces, and separate development and production. Record errors without including full prompts.

FR-19 prohibits definitive buy or sell instructions and profit guarantees, and requires a risk warning. The proposed minimum tests cover indirect prompt injection in a document, a citation that fails to support its claim, one session attempting to read another session's data, and the shared worker's access to the private schema. These tests are pending.

## 4. User context storage and retrieval

In Phase 1, keep chat history for the browser session. For example, `sessionStorage` can share history across pages without restoring it in a later session. Phase 1 excludes saved profiles, portfolios, and user memory. If the server stores session state, bind it to a verifiable session secret and expire it. A client-supplied conversation ID alone grants no access.

In the phase that introduces accounts, the proposal stores `profiles`, `portfolio_positions`, and `watchlist_items` in relational tables in a private schema. Derive the owner ID from the authenticated session. The authentication choice and policies for consent, retention, and deletion remain open under Q03 and Q07.

When a new chat starts, the server verifies the session and reads only the owner records it has permission to use. It computes a portfolio snapshot in code, selects the necessary fields, and combines them with stock context and public evidence for the model. Use the authenticated session as the source of user identity. Read the relevant portfolio version from the database because holdings change.

Use scoped database roles and ownership checks. Tables exposed through the Data API require row-level security (RLS). Privileged roles, including the service role, can bypass RLS. [9] Give the shared database role no grants on the private schema, and keep chats containing private data out of shared response caches.

If the user disables profile context, filter new model inputs according to the agreed policy. Include any history or summaries that may contain earlier profile values in that filtering. Q07 still governs the open decision on deleting previously stored data.

## Open decisions

1. **Evaluate the background job runner.** Test the Vercel setup in ADR 0006. Verify that it runs the project's code, connects to Supabase, and fits the budget. Use the Trigger.dev proposal if the team needs to revisit the runner.
2. **Choose documents for evidence retrieval.** Decide whether to start with news, company reports, or other documents. Check storage and reuse rights. Determine whether Phase 1 needs vector search or whether full-text search is enough.
3. **Set rules for private data.** For the phase that introduces accounts, agree on sign-in, consent for AI use of profile and portfolio data, retention, and deletion. These questions are tracked in Q03 and Q07.

### Proposal status

[ADR 0007](../adr/0007-managed-worker-execution.md) records Trigger.dev as **Proposed**. Its status changes to **Accepted** if the team chooses Trigger.dev.

The runner evaluation informs acceptance of ADR 0007. Document selection and private data policies belong to the design of retrieval and user context and can be decided separately. Earlier ADRs already record Supabase PostgreSQL and the separation of shared and private data.

## References

The review checked provider documentation on 20 November 2026. Pricing and product status may change. The option comparisons reflect the reviewer's assessment. Benchmark results are unavailable.

1. [Trigger.dev scheduled tasks](https://trigger.dev/docs/tasks/scheduled)
2. [Trigger.dev idempotency and TTL](https://trigger.dev/docs/idempotency)
3. [Trigger.dev Cloud pricing](https://trigger.dev/pricing)
4. [Vercel Schedules, targets, and Workflow](https://vercel.com/docs/schedules)
5. [Apache Airflow architecture and components](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html)
6. [Legacy Vercel Cron Jobs limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)
7. [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
8. [OWASP prompt injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
9. [Supabase RLS and roles that bypass it](https://supabase.com/docs/guides/database/postgres/row-level-security)
