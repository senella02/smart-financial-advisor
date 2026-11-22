# Daily Brief market coverage RFC

21 November 2026 · The owner confirmed the report inputs and publication flow in FR-03. Feed and benchmark selection remains open.

## Scope

The hourly Brief explains how Thai and global stock indices moved, which developments matter, and what to watch next. It takes its report structure from the LLMFA Morning Briefing and its direct-fetch approach from SFA-4. The worker imports the shared market data adapter in its own runtime. Vercel runs the Phase 1 worker. The proposed Phase 2 Airflow DAG can invoke the packaged worker with the same inputs. [Research](../research/daily-brief-market-coverage.md) · [FR-03](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication) · [Phase 1 architecture](../phase-1-planning/architecture.md) · [Proposed Airflow deployment](../final/final-architecture.md#airflow-schedules-and-job-execution)

~~~mermaid
flowchart LR
    T["Hourly schedule at :25 Bangkok time"] --> W["Worker imports the shared adapter"]
    W --> I["Fetch global stock index observations"]
    W --> N["Fetch approved news feeds"]
    I --> S["Freeze validated inputs"]
    N --> S
    S --> G["One Gemini call with tools disabled"]
    G --> V["Validate both languages and their citations"]
    V --> P[("Supabase · published briefs and archive")]
    W <-->|"Claim and record job status"| J[("Supabase · job state")]
    P --> H["Next.js Home and Chat"]
~~~

## Fetch index observations and news at run time

1. Claim the hourly slot in Supabase. Fetch index observations and news feeds in parallel through the shared adapter with a bounded deadline. The Brief uses Supabase for claims and job status, the finished publication and its citations, and the archive.
2. Fetch the Home indices and representative indices in Asia outside Thailand and in Europe. Candidate additions include Nikkei 225, Hang Seng, and STOXX Europe 600. Calculate the change from the previous session close in code. Preserve the source timestamp and session date, including when the latest close fell on an earlier Bangkok date. Report delayed or missing observations and a known closed-market state. [FR-05](../final/functional-requirements.md#fr-05-market-overview)
3. Gather eligible articles from approved feeds, including publisher, title, URL, publication time, and the excerpt when the feed supplies and permits it. Keep stories published on the Brief's Bangkok date. Deduplicate by source URL and normalized headline. Google News RSS, Yahoo Finance RSS, and Finnhub are candidates based on SFA-4. Eligible official releases can come through an approved feed. Verify rights and coverage before enabling sources. [Source research](../research/daily-brief-market-coverage.md)
4. Set the evidence cutoff when collection ends and freeze the validated inputs. Exclude observations and stories with source times after the cutoff. Treat source errors and successful empty results separately. Publish supported coverage when an individual source fails and the remaining evidence supports a valid report. If generation, validation, or the available inputs prevent publication, record the failure and keep the last successful Brief.

## Generate and publish once per attempt

The worker calls Gemini once with structured output through the Vercel AI SDK. The call receives the index observations and eligible feed items and returns the short brief, full brief, and follow-up cards in Thai and English. Disable model tools and automatic model call retries within the attempt. Treat feed text as source data. The worker checks output structure, evidence IDs, cited figures, time labels, and consistency across languages. It records a failed attempt if the output cannot be validated. It commits a valid result with its cutoff and citation metadata in one transaction. [Publication consistency](../adr/0004-shared-publication-consistency.md) · [Publication workflow](ai-workflow-orchestration.md#three-workflow-shapes)

| Section | Reader question |
| --- | --- |
| Short Brief | What moved and what matters most? |
| Global market snapshot | How did major stock indices move in their latest applicable sessions? |
| Leading market drivers | What happened and what evidence connects it to the markets that moved? What could it mean for Thailand? |
| What to watch next | Which events or conditions in the available evidence could change the picture? |

A headline can establish what a publisher reported. An index observation can establish a move. A causal explanation needs supporting evidence from the feed. The report distinguishes facts from interpretation and leaves the cause open when the supplied evidence is insufficient. [FR-19](../final/functional-requirements.md#fr-19-grounded-answers-and-citations)

## Evidence needed before rollout

Verify feed and benchmark rights, coverage, source timestamps, and provider delays. Evaluate one-call citation accuracy, Thai and English consistency, publication latency, and cost on earnings days, macro-event days, and quiet days. Include a closed market, a midnight crossover, a feed failure, and a successful empty feed. Exact feeds, benchmarks, and operating limits remain open. [Q04](../requirements-questions.md#q04-supported-data-and-stock-coverage) · [Q08](../requirements-questions.md#q08-release-quality-and-evaluation)
