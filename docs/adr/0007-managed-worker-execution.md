# ADR 0007 Managed worker execution

Status: Proposed

Date: 2026-11-20

Decision source: Architecture research requested by the owner on 20 November 2026; runner selection remains for team discussion.

Related requirements: [FR-03](../functional-requirements.md#fr-03-daily-brief-content-and-publication), [FR-11](../functional-requirements.md#fr-11-shared-daily-stock-summary)

## Context

[ADR 0001](0001-nextjs-application-and-shared-workspace.md) separates interactive requests from worker execution. [ADR 0006](0006-vercel-hosting-and-scheduled-publication-trigger.md) selects Vercel web hosting and sets Vercel Schedules, Queues, and Functions as the starting point for worker execution. This proposal records a candidate for revisiting that choice. The worker currently contains only a placeholder.

## Decision and rationale

Propose Trigger.dev Cloud for scheduled and event-triggered TypeScript worker execution. Keep runner integration in thin entry points in apps/worker and keep business logic independently callable. This matches the existing language/workspace and provides managed schedules, retries and run visibility without operating Airflow infrastructure. This is a recommendation, not an accepted or deployed choice.

Supabase remains the durable authority for job claims and publication versions under ADR 0004/0005. Runner idempotency has a TTL and cannot replace database constraints. Payloads contain validated identifiers/dates; the shared worker has no private-data grants. Generation stays outside the short transaction that publishes complete language variants and evidence.

## Alternatives and tradeoffs

Vercel Schedules with Workflow/Queue reduces providers and supports durable multi-step execution, but Schedules is currently Beta and needs runtime/cost evaluation. Its limits must not be confused with legacy Cron Jobs. Airflow provides explicit DAG orchestration and suits complex batch/backfill workloads, but introduces several operated components for this prototype.

## Consequences

Adds a deployment and provider dependency, compute/invocation costs, and runner observability limits. Persist necessary job status independently. Before acceptance, verify workspace bundling/runtime compatibility, scoped database access, repeated/concurrent runs, interrupted-run recovery, missed schedules and the total budget. No prototype or benchmark was executed in this research. Revisit for large backfills, Python-heavy dependencies, unacceptable cost or provider constraints. Any decision to adopt Trigger.dev would supersede the worker selection in ADR 0006.

## References

- [Thai comparison and context/security proposal](../research/architecture-options-th.md)
- [Trigger.dev schedules](https://trigger.dev/docs/tasks/scheduled)
- [Trigger.dev idempotency](https://trigger.dev/docs/idempotency)
- [Trigger.dev pricing](https://trigger.dev/pricing)
- [Vercel Schedules](https://vercel.com/docs/schedules)
- [Airflow architecture](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html)
