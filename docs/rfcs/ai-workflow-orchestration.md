# AI workflow orchestration RFC

Proposed · 20 November 2026

## Context

The application has five AI workflows: stock Q&A, comparison, the Daily Brief, the daily stock summary, and Discovery. They differ in trigger, audience, and whether they wait for a person. The research report compares them and records what plain TypeScript with a model SDK, LangGraph.js, and the Vercel Workflow SDK provide. The code has a fixture `GenerationPort` for the two publications and no model SDK yet. This proposal builds on the accepted web and worker split, the publication guarantees, and the evidence retrieval RFC. [Orchestration research](../research/ai-workflow-orchestration.md), [ADR 0001](../adr/0001-nextjs-application-and-shared-workspace.md), [ADR 0004](../adr/0004-shared-publication-consistency.md), [Evidence retrieval RFC](financial-evidence-retrieval.md)

## Proposed design and rationale

### Three workflow shapes

The five workflows reduce to three shapes. Each shape is an ordinary async TypeScript function in shared server modules. It calls the model at fixed points and keeps every scope, authorization, and publication decision in application code.

**Publication pipeline for the Daily Brief and stock summary.** The worker runs a fixed sequence:

1. Claim the job for its date, and for its listing when it is a stock summary.
2. Assemble one evidence snapshot with its cutoff.
3. For the brief only, ask the model to score each news item's importance as structured output, then select stories in code.
4. Generate the Thai and English variants and the follow-up cards from that snapshot as structured output. Every claim references an evidence ID.
5. Validate the output and commit both variants in one transaction.

The application knows the subject, evidence window, and sections in advance, so the model needs no tools. A failure at any step leaves the last success published. Because the claim makes a retry safe, a failed run restarts from the beginning. [FR-03](../functional-requirements.md#fr-03-daily-brief-content-and-publication), [FR-04](../functional-requirements.md#fr-04-daily-brief-follow-up-cards), [FR-11](../functional-requirements.md#fr-11-shared-daily-stock-summary)

**First-open trigger for the stock summary.** The summary is generated lazily, at most once per listing per Thai date, so the daily cost depends on how many distinct stocks visitors open, not on the catalog size. The trigger has three parts:

1. **Browser request.** The summary panel requests the summary from the browser after the page loads. Server rendering never starts a job, because `<Link>` prefetch and crawlers render pages nobody is reading.
2. **Job row and start.** The web server resolves the listing, then inserts a stock-summary `PublicationJob` row keyed by listing and Thai date, ignoring a conflict. Concurrent first opens therefore produce one job. The web server then starts the worker's single-job entry point for that job ID without waiting for it. The worker claims the row with a conditional update, so a duplicate start does nothing. The worker also limits concurrent generations, which absorbs bursts against model rate limits.
3. **Sweep.** The scheduled Daily Brief run also resumes stock-summary jobs that are still pending or whose claim has expired. A lost start therefore delays a summary rather than stranding it, and no separate frequent schedule is needed.

The web server writes the job row and sends its ID to Vercel Queues. Queues invokes the worker, and the worker writes the publication. [Handoff rules](../contracts-and-boundaries.md#handoffs-between-layers), [ADR 0006](../adr/0006-vercel-hosting-and-scheduled-publication-trigger.md)

While the job runs, the panel shows the stock's latest earlier summary with its own publication date and as-of time and says today's summary is being prepared. A stock with no earlier summary shows a preparing state. The browser rechecks the summary lookup every few seconds with backoff. After a timeout or a failed attempt, the panel offers a retry, which re-queues the job within an attempt limit. Quote, financials, and chat load independently throughout. [FR-11](../functional-requirements.md#fr-11-shared-daily-stock-summary)

**Chat request pipeline for Q&A and comparison.** The web server runs these steps for each message:

1. Resolve context in code: the stock-page binding, today's brief through `DailyBriefLookupSchema`, and later the enabled personal context.
2. Run a bounded tool loop in which the model chooses among quote, financials, filing search, and news tools. Each tool handler applies the entity, period, and cutoff filters from the retrieval RFC.
3. Check in code that every citation points to evidence returned during this request, and retry once when support is inadequate.
4. Stream the answer and append it to session history.

The model is needed here because the evidence depends on the question. The loop has a step limit, and the tools return explicit unavailable or stale results that the answer must report. That addresses the main failure in the previous capstone's evaluation. [FR-13](../functional-requirements.md#fr-13-stock-bound-chat), [FR-14](../functional-requirements.md#fr-14-general-financial-questions-and-comparison), [FR-19](../functional-requirements.md#fr-19-grounded-answers-and-citations), [Capstone lessons](../research/ai-workflow-orchestration.md#lessons-from-the-previous-project)

Comparison uses the same pipeline. When the question names a second subject, the server resolves each identity before retrieval. An ambiguous name ends the turn with a clarification question, which is answered by the visitor's next message, so no waiting state is needed. A comparison tool retrieves each issuer separately and returns figures aligned by period, currency, and unit, and computes their differences in code. Period or currency mismatches are reported, not hidden. Per-issuer retrieval is a rule rather than a model preference, so it belongs in the tool.

**Discovery as a stored plan.** This shape is for the later delivery group:

1. The model converses to gather preferences. When it has enough, it calls a `proposeScreeningPlan` tool whose schema contains only supported filters, values, and units.
2. The application validates the plan, rejects any unsupported or unexplained criterion such as a numeric meaning for "low risk," and stores it as a new plan version with status `proposed`. The plan belongs to the session.
3. The UI renders each filter's meaning, value, and unit, with confirm, edit, and cancel actions.
4. Confirmation is a separate server action that names the plan ID and version. A conditional update moves exactly that version from `proposed` to `confirmed`. An edit creates a new `proposed` version and marks the old one `superseded`.
5. The application runs the screen in code against the confirmed version, validates every returned identity, and records `executed`.
6. The model explains why each result matches, using the match data and evidence the screen returned.

The model has no tool that executes a screen, and model text never counts as confirmation. The wait for confirmation is a database row, so no process stays suspended, and the visitor may take minutes or never return. An empty result reports the executed criteria without relaxing them. In Phase 1, a discovery request in chat explains that screening is not yet available. [FR-15](../functional-requirements.md#fr-15-discovery-plan-and-user-confirmation), [FR-16](../functional-requirements.md#fr-16-discovery-results), [Trust rules](../contracts-and-boundaries.md#trust-and-privacy)

### Use a model SDK inside plain TypeScript

Use the Vercel AI SDK core for the model steps:

- `streamText` with an `isStepCount` stop condition runs the chat tool loop.
- `generateText` with `Output.object()` produces structured publication and plan output.

The SDK streams into Next.js Route Handlers and keeps the provider replaceable behind `GenerationPort`. The owner chose the Gemini API and Vercel AI SDK on 20 November 2026. The default model is `gemini-3.5-flash-lite` on the Gemini API free tier, through `@ai-sdk/google`. Keep the model ID in configuration so a paid tier or another model needs no code change.

The free-tier terms have two consequences:

- Google may use and human-review prompts, and the terms say not to send personal information. Personal context must therefore move to paid-tier terms or another provider before Portfolio, Profile, or account-linked chat enters a prompt.
- The free-tier rate limits are unverified. The design checks below must confirm they cover an hourly brief alongside chat.

[Default model research](../research/ai-workflow-orchestration.md#default-model), [AI SDK tool calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling), [AI SDK structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data), [ADR 0002](../adr/0002-validated-contracts-and-data-trust-boundaries.md)

Do not use the AI SDK's tool approval for Discovery confirmation. Its documented flow carries the approval request and response in the message history. The browser supplies that history, so the contracts treat it as untrusted. A server-side plan record ties the confirmation to a session and an exact plan version. [AI SDK human-in-the-loop](https://ai-sdk.dev/cookbook/next/human-in-the-loop), [Trust rules](../contracts-and-boundaries.md#trust-and-privacy)

### Contract changes

Extend `GenerationPort` beyond `kind` and plain `text`. Publication generation needs a structured output with sections and evidence IDs per claim. Chat needs a streaming interface that accepts tool definitions. `StockSummaryLookupSchema` accepts only a summary for the requested Thai date. Extend it with a labelled earlier-summary result and a job state of preparing or failed, so the panel can show an earlier summary without treating it as today's. Add schemas for the Discovery plan, its versions, and its statuses when Discovery enters scope. Update producers, consumers, fixtures, and tests in the same change, as the contract rules require. [Contracts](../../packages/contracts/src/index.ts), [Contract changes](../contracts-and-boundaries.md#contract-changes)

## Why not LangGraph now

LangGraph.js would add three things for these workflows. Each one is already covered or is not needed yet:

- **`interrupt()` for the Discovery wait.** The application still needs a plan record so confirmation names an exact version. A checkpoint would add `checkpoints`, `checkpoint_blobs`, and `checkpoint_writes` tables holding serialized graph state beside it. Resuming reruns the interrupted node from its start, which adds an idempotency requirement that a conditional status update avoids. [LangGraph interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts)
- **Resume from a checkpoint after a failure.** A publication run is a few model calls under a claim that already makes a restart safe. Repeating those calls costs less than a second store of execution state.
- **Graph state for loops.** The SDK's tool loop covers chat. The citation retry is one bounded loop in code.

LangGraph would also bring `@langchain/core` model bindings alongside the SDK. LangChain itself recommends LangGraph when an application needs "explicit control over state and control flow." Here that control is a short sequence of function calls plus three tables the requirements need anyway. [LangGraph overview](https://docs.langchain.com/oss/javascript/langgraph/overview)

## Alternatives and conditions to revisit

- **LangGraph.js.** Revisit it in any of these cases:
  - A single run needs several pause points for a person.
  - Discovery grows into a multi-turn planning agent whose intermediate state is too large to keep in a plan record.
  - Branching across the chat pipeline becomes hard to test as plain functions.
- **Vercel Workflow SDK.** Reconsider durable steps if retrying a publication from the beginning becomes too expensive. Running the SDK with Postgres World off Vercel requires a long-lived process. [Workflow SDK](https://workflow-sdk.dev/docs/foundations/workflows-and-steps), [Postgres World](https://workflow-sdk.dev/worlds/postgres)
- **One general agent for every workflow.** A single tool-using agent could also produce publications. The publications need the same evidence snapshot for both languages, a fixed cutoff, and an atomic commit. A model choosing its own evidence makes those guarantees harder to check.

The hourly Daily Brief uses Vercel Schedules and Vercel Queues. ADR 0006 records the deployment choice and the limits that apply to the worker. [ADR 0006](../adr/0006-vercel-hosting-and-scheduled-publication-trigger.md)

## Evidence needed to confirm the design

- **Daily Brief run time.** Measure the number of model calls and the wall-clock time of a run with a realistic day of news, against the function limit for the chosen plan. Check the call count against the free-tier request limits in Google AI Studio.
- **Thai output quality.** Check Thai brief and chat output from the default model on labeled examples.
- **Chat tool loop.** Prototype the loop with its step limit, then check that an unavailable or stale tool result reaches the answer as a stated gap. Confirm that a citation to evidence outside the request is rejected.
- **Discovery transitions.** Test confirming twice, confirming a superseded version, confirming after cancellation, and confirming from another session. Each must leave the screen unexecuted or run it exactly once.
- **First-open summaries.** Measure the wait for a first summary and verify that the sweep recovers a job if the queue message fails to publish.

These are design checks, not acceptance targets, which remain open in [Q08](../requirements-questions.md#q08-release-quality-and-evaluation).
