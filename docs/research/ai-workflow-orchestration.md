# AI workflow orchestration research

Research report · 20 November 2026

This report compares the application's five AI workflows: stock Q&A, stock comparison, the Daily Brief, the daily stock summary, and Discovery. It identifies which steps the requirements and trust boundaries place under application control, where the model's judgment is needed, and how Discovery can wait for confirmation before screening. It then records what plain TypeScript with a model SDK, LangGraph.js, and Vercel Workflow each provide for those needs. The report does not choose a design. [Evidence retrieval RFC](../rfcs/financial-evidence-retrieval.md) covers retrieval, which this report treats as an available step.

## Question and comparison criteria

The question is which orchestration each workflow needs and whether any need exceeds ordinary TypeScript control flow. Each workflow is compared on:

- **Trigger and runtime.** A visitor request in the web app, or a job in the worker. [ADR 0001](../adr/0001-nextjs-application-and-shared-workspace.md)
- **Evidence assembly.** Whether the application can determine the evidence in advance, or the model must choose what to fetch based on the question.
- **Audience.** A shared publication that must use only public evidence, or a private answer for one visitor. [FR-20](../functional-requirements.md#fr-20-personal-context-isolation)
- **Waiting.** Whether the workflow pauses for a person or across invocations.
- **Durability.** What must survive a failure, retry, or concurrent request. [ADR 0004](../adr/0004-shared-publication-consistency.md)
- **Checks.** Which outputs the application must verify before showing or publishing them. [FR-19](../functional-requirements.md#fr-19-grounded-answers-and-citations)

## How the workflows differ

| Workflow | Trigger and runtime | Evidence | Audience | Waits | Durable state | Delivery |
|---|---|---|---|---|---|---|
| Stock Q&A ([FR-13](../functional-requirements.md#fr-13-stock-bound-chat), [FR-14](../functional-requirements.md#fr-14-general-financial-questions-and-comparison)) | Visitor message, web app, streamed | Depends on the question | Private to the session | Only for a clarification, as an ordinary next message | Session history | Phase 1 |
| Comparison (FR-14) | Visitor message, web app | Same evidence kinds, retrieved per subject | Private | Same as Q&A | Session history | Phase 1 |
| Daily Brief ([FR-03](../functional-requirements.md#fr-03-daily-brief-content-and-publication), [FR-04](../functional-requirements.md#fr-04-daily-brief-follow-up-cards)) | Hourly schedule, worker | News since Bangkok midnight up to a cutoff | Shared, Thai and English | No | Job claim, publication, last success | Phase 1 |
| Stock summary ([FR-11](../functional-requirements.md#fr-11-shared-daily-stock-summary)) | First open per listing per Thai date; the worker commits it | Latest quote, price and volume history, latest statements, notable news | Shared, Thai and English | The page waits for the publication | Job claim, publication | Phase 1 |
| Discovery ([FR-15](../functional-requirements.md#fr-15-discovery-plan-and-user-confirmation), [FR-16](../functional-requirements.md#fr-16-discovery-results)) | Visitor message or manual control, web app | Screening data for the confirmed criteria, then evidence per result | Private, may use the profile | Yes, for plan confirmation, for an unbounded time | Plan versions and their status | Later group |

The two publications have a fixed shape. The application knows the subject, the date, the evidence window, and the output sections before any model call. Q&A and comparison have an open shape. "How were the latest results?" and "Why did margins fall?" need different evidence, and the model is the component that interprets the question. Discovery combines both: an open conversation produces a plan, and a fixed procedure executes it once confirmed.

Comparison differs from Q&A in three requirement-driven ways. The subjects must be named explicitly. Evidence is retrieved separately for each issuer. The answer must identify the companies, metrics, periods, and currencies being compared. A news story mentioning stock B does not make B a subject on stock A's page. [FR-13 acceptance](../functional-requirements.md#fr-13-stock-bound-chat), [Retrieval RFC](../rfcs/financial-evidence-retrieval.md#filter-filing-evidence-before-ranking)

FR-11 requires first-open generation, and the worker commits the summary. A visitor request must start a worker job or wait for a job already in progress. The scheduler and invocation path were open during this comparison. ADR 0006 records the later decision. [Handoff rules](../contracts-and-boundaries.md#handoffs-between-layers), [ADR 0006](../adr/0006-vercel-hosting-and-scheduled-publication-trigger.md)

## Steps the requirements place under application control

These steps decide scope, authorization, or financial meaning. The requirements and accepted architecture place them outside model-generated text:

- **Context resolution.** The server validates the request, resolves the selected listing from application state, and looks up today's Daily Brief. A previous-day fallback is never today's context; the contracts already enforce this in `DailyBriefLookupSchema`. [Handoffs](../contracts-and-boundaries.md#handoffs-between-layers), [Contracts](../../packages/contracts/src/index.ts)
- **Identity resolution.** A ticker or name extracted from a question is resolved against a trusted identity source. An ambiguous name produces a clarification rather than a guess. [FR-01](../functional-requirements.md#fr-01-supported-stock-identity)
- **Retrieval scope.** Entity, market, document type, period, and cutoff filters apply inside tool handlers before ranking, whatever the model requests. [Retrieval RFC](../rfcs/financial-evidence-retrieval.md#filter-filing-evidence-before-ranking)
- **Figures and calculations.** Figures come from validated structured sources, and ratios and comparisons are computed deterministically. [FR-19](../functional-requirements.md#fr-19-grounded-answers-and-citations), [Source notes lessons](../source-notes.md#lessons-retained-from-the-previous-project)
- **Output checks.** Each citation must point to evidence retrieved for this request or snapshot. FR-19 requires a bounded retry when support is inadequate, and a limited answer when it remains inadequate. Schema validation, risk disclaimers, and the prohibition on definitive buy or sell instructions are also checked here.
- **Publication.** Job claims, the shared evidence snapshot for both languages, the atomic commit, and preservation of the last success. [ADR 0004](../adr/0004-shared-publication-consistency.md)
- **Discovery gates.** Supported filters and units, the confirmation of a specific plan version, execution of only that version, and validation of every returned identity. Screening must not relax criteria silently. [FR-15](../functional-requirements.md#fr-15-discovery-plan-and-user-confirmation), [FR-16](../functional-requirements.md#fr-16-discovery-results)
- **Personal context.** Whether the profile, Watchlist, or Portfolio enters the context. Shared generation receives none of it. [FR-17](../functional-requirements.md#fr-17-profile-questionnaire-and-control), [FR-20](../functional-requirements.md#fr-20-personal-context-isolation)

## Steps that need the model

- **Interpreting the question** and choosing which evidence to request in Q&A and comparison.
- **Scoring news importance** for the Daily Brief. FR-03 assigns this to the AI, with selection criteria to be refined through testing.
- **Writing** the brief, follow-up cards, summary sections, answers, and the explanation of why each Discovery result matches.
- **Translating preferences into criteria** for Discovery, including the follow-up questions that turn "dividend stocks" into concrete filters.

Each model step returns either text with citation references or a structured object that the application validates.

## How Discovery can wait for confirmation

FR-15 requires that an unconfirmed or cancelled plan never executes and that a changed plan needs a new confirmation. The visitor may take minutes to reply or never reply. No request can stay open for that wait, so the pending plan has to be stored between requests.

Two placements are possible. The application can store each plan version with a status such as proposed, confirmed, executed, cancelled, or superseded. A confirmation action then names the plan version, and a conditional update moves it from proposed to confirmed exactly once. Alternatively, an orchestration framework can checkpoint the workflow at an interrupt and resume it with the visitor's reply. In either case, the confirmation must come from a UI action that the server ties to the session and plan version. Model text saying the visitor agreed is not a confirmation. [Contracts trust rules](../contracts-and-boundaries.md#trust-and-privacy)

## Orchestration options

Package versions come from the npm registry, and limits from the cited pages, as checked on 20 November 2026.

### TypeScript with a model SDK

- **Vercel AI SDK.** `ai` 7.0.177 and `@ai-sdk/anthropic` 4.0.106. `generateText` and `streamText` run a tool loop until a stop condition. The default is one step, and `isStepCount(n)` or `hasToolCall` extend it. `Output.object()` returns schema-validated structured output and can be combined with tools. `ToolLoopAgent` packages the loop with a default limit of 20 steps and "does not persist execution checkpoints." [Tool calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling), [Structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data), [Agents](https://ai-sdk.dev/docs/agents/building-agents), [v7 migration](https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0)
- **AI SDK tool approval.** `toolApproval`, which replaces the deprecated `needsApproval`, does not keep a call waiting. The call returns an approval request, and a second call carries the approval response. The documented flow keeps the approval in the message history. Neither the tools page nor the human-in-the-loop cookbook describes storing approval state on the server. [Human-in-the-loop cookbook](https://ai-sdk.dev/cookbook/next/human-in-the-loop)
- **Anthropic API directly.** Structured outputs with a JSON schema are generally available on Claude 4.5 and newer models. The schema must set `additionalProperties: false` and cannot use recursive schemas, `oneOf`, or numeric and length constraints. `strict: true` guarantees that tool inputs match their schema. [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Strict tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use)

With either SDK, the application writes the surrounding steps in ordinary TypeScript, including the loops, branches, retries, and state.

### LangGraph.js

- `@langchain/langgraph` 1.7.5 with `@langchain/core`. It models a workflow as a graph of nodes over shared state and runs without LangSmith Deployment. [Overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- `interrupt()` pauses a graph and returns a payload. A later invocation on the same `thread_id` resumes it with `new Command({ resume })`. This requires a checkpointer, and production needs a durable one. On resume, "The node restarts from the beginning of the node where the interrupt was called," so code before the interrupt must be idempotent. Resume values are matched by position, so interrupt order must be deterministic. [Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts)
- `@langchain/langgraph-checkpoint-postgres` 1.1.4 creates `checkpoints`, `checkpoint_blobs`, `checkpoint_writes`, and `checkpoint_migrations` tables through its own `.setup()` migration. [Postgres checkpointer](https://github.com/langchain-ai/langgraphjs/tree/main/libs/checkpoint-postgres), [Migration source](https://github.com/langchain-ai/langgraphjs/blob/main/libs/checkpoint-postgres/src/migrations.ts)
- It can stream tokens, state updates, and custom events. LangChain's Next.js guide runs a graph in a Route Handler. Its serverless notes say the in-memory saver is not durable across instances. They also say stream reconnection does not work across invocations without a shared replay store. [Streaming](https://docs.langchain.com/oss/javascript/langgraph/streaming), [Framework deployment notes](https://docs.langchain.com/langsmith/deploy-frameworks-and-platforms)
- LangChain's documentation distinguishes workflows, which "have predetermined code paths," from agents, where the model chooses tools and steps. It recommends LangGraph when an application needs "explicit control over state and control flow." [Workflows and agents](https://docs.langchain.com/oss/javascript/langgraph/workflows-agents)

### Vercel Workflow SDK

- `workflow` 5.7.0. A `"use workflow"` function is replayed deterministically from an event log, while `"use step"` functions do the work and are retried three times by default. `sleep()` and webhooks or hooks suspend a run without consuming compute until time passes or an external call arrives. [Workflows and steps](https://workflow-sdk.dev/docs/foundations/workflows-and-steps)
- On Vercel, each run allows up to 10,000 steps and has no run-duration limit. Hobby includes 50,000 events a month. The AI SDK's `WorkflowAgent` runs a tool loop as durable steps. [Workflow pricing and limits](https://vercel.com/docs/workflows/pricing), [Agent options](https://vercel.com/kb/guide/eve-vs-ai-sdk-agents-vs-workflowagent)
- The Postgres World, which runs workflows without Vercel, needs a long-lived process, "does not work on serverless platforms," and is described as a reference implementation. [Postgres World](https://workflow-sdk.dev/worlds/postgres)

### Hosting limits relevant to the workflows

- With Fluid compute, a Vercel Function can run up to 300 seconds on Hobby and 800 seconds on Pro. [Function duration](https://vercel.com/docs/functions/configuring-functions/duration)
- Vercel Cron Jobs on Hobby run at most once a day, so an hourly Daily Brief needs Pro, the beta Schedules product, or another scheduler. The Cron Jobs page describes them as legacy and moving to Schedules. Hobby Schedules allow intervals as short as 15 minutes. [Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Schedules limits](https://vercel.com/docs/schedules/limits)

### General guidance

Anthropic's agent-building article defines workflows as "predefined code paths" and agents as systems where the model directs its own process. It recommends the simplest workable solution and starting with model APIs directly. Its named patterns map onto this application: prompt chaining for the publications, routing for chat entry, parallelization for per-issuer comparison retrieval, and an evaluator loop for citation checks. [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) (December 2024)

### What each option adds for these workflows

| Need | TypeScript with a model SDK | LangGraph.js | Workflow SDK |
|---|---|---|---|
| Bounded tool loop for Q&A | Built in, with a step limit | Prebuilt agent or custom graph | `WorkflowAgent` |
| Structured output for publications | Built in | Through LangChain model bindings | Through steps that call an SDK |
| Discovery confirmation wait | Application-owned plan record | `interrupt()` plus checkpoint tables | Hook or webhook suspends the run |
| Resume a long job after failure | Restart the job; ADR 0004 claims make this safe | Resume from the last checkpoint | Replay with retried steps |
| New stored state | Plan and job tables the application already needs | Checkpoint tables and serialized graph state | An event log in the selected World |

The publication and plan tables in the first column are needed for the requirements regardless of the framework. A framework's checkpoint or event log is stored in addition to them.

## Lessons from the previous project

The previous capstone ran three agent stacks: PocketFlow for chat, a LangGraph ReAct agent with schema-constrained output for the daily report, and a separate Deep Research planner. It adopted the daily-report agent because it "needed predictable, repeatable daily output format." [Capstone architecture](../../../llmfa-capstone/docs/3.1-system-architecture.md), [Proposed versus final design](../../../llmfa-capstone/docs/3.4-proposed-vs-final-design.md), [Daily report agent](../../../llmfa-capstone/llm/src/agents/daily_report/agent.py)

Its evaluation attributes most incorrect chat answers to the tool-to-response path: stale or failed tool results presented as current values. The proposed fix was an explicit refusal state when a tool response is stale or empty. The SCB and SCB X error points to a missing disambiguation step. Both are application checks around the model rather than orchestration features. [Performance analysis](../../../llmfa-capstone/evaluation/performance-analysis-report.md), [Correctness error analysis](../../../llmfa-capstone/docs/chie-correctness-error-analysis.md#overall-diagnosis)

## Unknowns

- How many model calls and how much time a Daily Brief run needs, which determines whether one function invocation can complete it.
- How long a first-open stock summary takes, including the time to start the worker.
- Discovery's result count, ranking, filter set, and guest access remain open in [Q03](../requirements-questions.md#q03-access-persistence-and-languages), [Q04](../requirements-questions.md#q04-supported-data-and-stock-coverage), and [Q05](../requirements-questions.md#q05-chat-and-discovery-boundaries).
- The free-tier rate limits for the default model. `GenerationPort` currently covers only text generation for the two publications. [Contracts](../../packages/contracts/src/index.ts)

## Default model

On 20 November 2026, the owner chose `gemini-3.5-flash-lite` on the Gemini API free tier as the default model. Its documentation, checked the same day, gives these facts:

- **Model.** The model page lists the model as stable, with a 1,048,576-token input limit and a 65,536-token output limit. It supports function calling, structured outputs, and Google Search grounding. [Model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- **SDK support.** `@ai-sdk/google` 4.0.122 lists tool usage, tool streaming, and object generation as supported for this model. [AI SDK Google provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)
- **Unverified.** Free-tier limits are shown only in Google AI Studio after sign-in, so requests per minute and per day are unverified. Thai is not named on the public language page, so Thai quality also needs testing. [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- **Data use.** The terms say Google uses free-tier input and output to improve its products, and human reviewers may read them. They also say not to submit sensitive, confidential, or personal information. [Gemini API terms](https://ai.google.dev/gemini-api/terms)
- **Age.** Users must be 18 or older. The terms exclude apps aimed at, or likely to be used by, people under 18. [Gemini API terms](https://ai.google.dev/gemini-api/terms)

Shared publications use only public evidence, which fits these terms. Visitor chat text is sent to Google under the same terms. Holdings, the profile, and account-linked chat would need paid-tier terms or another provider before they enter a prompt. [FR-20](../functional-requirements.md#fr-20-personal-context-isolation)
