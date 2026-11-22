# ADR 0007 Managed worker execution

Status: Proposed

Date: 2026-11-20

Updated: 2026-11-21

On 21 November 2026, the owner selected Vercel for Phase 1 and retained this proposal for a later comparison if Vercel misses runtime or publication targets. [ADR 0006](0006-vercel-hosting-and-scheduled-publication-trigger.md#consequences)

Decision source: Architecture research requested by the owner on 20 November 2026; runner selection remains for team discussion.

Related requirements: [FR-03](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication), [FR-11](../final/functional-requirements.md#fr-11-shared-daily-stock-summary)

## Context

[ADR 0001](0001-nextjs-application-and-shared-workspace.md) separates interactive requests from worker execution. [ADR 0006](0006-vercel-hosting-and-scheduled-publication-trigger.md) selects Vercel web hosting and sets Vercel Schedules, Queues, and Functions as the starting point for worker execution. This proposal records a candidate for revisiting that choice. The worker currently contains only a placeholder.

## Decision and rationale

Propose Trigger.dev Cloud for scheduled and event-triggered TypeScript worker execution. Keep runner integration in thin entry points in apps/worker and keep business logic independently callable. This matches the existing language/workspace and provides managed schedules, retries and run visibility without operating Airflow infrastructure. This is a recommendation, not an accepted or deployed choice.

Supabase remains the durable authority for job claims and publication versions under ADR 0004/0005. Runner idempotency has a TTL and cannot replace database constraints. Payloads contain validated identifiers/dates; the shared worker has no private-data grants. Generation stays outside the short transaction that publishes complete language variants and evidence.

## Alternatives and tradeoffs

Vercel Schedules, Queues, and Functions remain the accepted Phase 1 starting point. Measure its scheduling window, bounded function runtime, queue wait, recovery, and cost before replacing it. Do not confuse Schedules with legacy Cron Jobs. The [proposed final design](../final/final-architecture.md) uses Airflow for Python ingestion, indexing, backfills, and publications; that target is distinct from Phase 1 and has not made this Trigger.dev proposal accepted. Cloud Scheduler with Cloud Run Jobs is another container-based alternative. Supabase Cron or GitHub Actions can initiate bounded work but still need an execution and recovery design.

Trigger.dev has a Free plan, but new schedules created on Free run no more than hourly with a minimum 60-minute window. This does not fit the approved half-hourly news checks. Credits are bounded, logs have short retention, and database/model/storage charges are separate. Compare a paid plan with Vercel upgrades or the proposed Airflow deployment using the same measured workload; free access does not establish zero operating cost.

## Consequences

Adds a deployment and provider dependency, compute/invocation costs, and runner observability limits. Persist necessary job status independently. Before acceptance, verify workspace bundling/runtime compatibility, scoped database access, repeated/concurrent runs, interrupted-run recovery, missed schedules and the total budget. No prototype or benchmark was executed in this research. Revisit for large backfills, Python-heavy dependencies, unacceptable cost or provider constraints. Any decision to adopt Trigger.dev would supersede the worker selection in ADR 0006.

For the cross-cutting security, ingestion handoff, and private context proposal, see the [Security and context RFC](../rfcs/architecture-security-and-context.md). It preserves the accepted requirements and does not treat runner selection as approval of every design detail. The [Thai research report](../research/architecture-options-th.md) separates reference-project observations and service limits from the design.

## References

- [Architecture options for team discussion](../research/architecture-options.md)
- [Trigger.dev schedules](https://trigger.dev/docs/tasks/scheduled)
- [Trigger.dev idempotency](https://trigger.dev/docs/idempotency)
- [Trigger.dev pricing](https://trigger.dev/pricing)
- [Vercel Schedules](https://vercel.com/docs/schedules)
- [Airflow architecture](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html)
