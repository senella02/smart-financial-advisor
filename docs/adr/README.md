# Architecture Decision Records

ADRs explain architectural choices and why they were made so future contributors can understand the system's direction. They are not a task log or a record of every owner preference.

## When an ADR is warranted

Write an ADR only when **both** conditions hold:

1. The choice changes system structure or an architectural boundary: application/runtime structure, deployment, integration strategy, storage, data ownership, or security/trust boundaries.
2. It creates a lasting technical constraint or tradeoff that future work must respect, and its rationale will help a future architectural decision.

A long-lived product rule, a human choosing option A, or a choice made during a task does not qualify on that basis alone. Record the architectural response to a requirement only when it meets both conditions; link the requirement rather than copying its behavior into an ADR. If there is no lasting architectural consequence to explain, do not create an ADR.

Examples that qualify include keeping UI and backend in one deployable, choosing a database with material consistency constraints, or separating shared publication data from private conversation inputs. Exact package pins, a folder rename, fixture dates, a refresh interval, a UI label, and choosing current FX for portfolio price P/L do not qualify by themselves.

## Where other information belongs

- Product scope, page behavior, refresh schedules, retention, financial formulas, and acceptance criteria: [functional requirements](../final/functional-requirements.md).
- Unresolved product questions and their answers: [question record](../requirements-questions.md). Update requirements and acceptance criteria when an answer is agreed.
- Standing contributor instructions: [AGENTS.md](../../AGENTS.md); source precedence and historical context: [source notes](../source-notes.md).
- Setup, tooling compatibility, commands, and configuration details: [developer guide](../developer-guide.md), manifests, and configuration files.
- Layer responsibilities, trust rules, and handoffs are documented in [Contracts and integration boundaries](../contracts-and-boundaries.md). Find schemas and adapter entry points in the [developer guide](../developer-guide.md#where-to-work).
- Follow the [documentation rules](../../AGENTS.md#documentation-rules) for temporary plans and task records.

Do not create another document merely because a detail does not belong in an ADR. Keep it only if it helps someone use, maintain, or review the project, using its existing home.

## Writing and grouping

Use the [template](template.md). State the architectural problem, the chosen approach, **why it was chosen**, credible alternatives and their tradeoffs, and lasting consequences or reasons to revisit. Do not invent alternatives, technical evidence, or rationale when the actual reason is only a prescribed constraint; say so. Cite primary documentation when a choice depends on evolving tool behavior.

Describe the boundary or guarantee that applies across features. Link to the product requirement for the behavior it supports and to the developer guide for commands and configuration.

Group related choices that solve the same architectural problem and share a rationale. Split only when choices have independent reasons or can change independently. Do not create one ADR per task, PR, dependency, or configuration flag. Link to current implementation guides instead of embedding version inventories, setup steps, test counts, or product specifications.

Use `NNNN-short-decision-name.md` and the next four-digit number. Keep existing numbers stable; deleting a rejected proposal is not a reason to renumber other records.

## Status and maintenance

- **Accepted:** An architectural decision was made. Record its actual decision date and source.
- **Proposed:** Optional for a substantial unresolved architectural choice that benefits from written discussion. This small project normally decides and implements architecture in one PR, recording the accepted decision there in the same change; a separate proposal document is not required.
- Rejected proposals may be hard-deleted. Remove their index entries and repair links; no rejection archive is required. Mention rejected alternatives inside a retained ADR only when they help explain its chosen architecture.
- **Superseded:** For a material reversal of an accepted architecture decision, add an ADR and link both records so the earlier rationale remains understandable. Correct factual errors in place. Do not add an ADR for routine implementation maintenance.

Keep this index, links, and affected guides consistent. Never promote an unresolved product rule or an unaccepted architecture proposal by documenting it as decided.

## Decisions

- [0001 Next.js application, background worker, and shared workspace](0001-nextjs-application-and-shared-workspace.md). Accepted 7 November 2026. One web application, separate worker execution, and shared server-side services.
- [0002 Validated contracts and data trust boundaries](0002-validated-contracts-and-data-trust-boundaries.md). Accepted 7 November 2026. Provider-neutral contracts and separation of shared and private data.
- [0003 Market data and news provider selection](0003-market-data-and-news-provider-selection.md). Yahoo Finance accepted 14 November 2026 for market data and news. US SEC EDGAR and Thai SEC iDISC accepted 20 November 2026 for filings and financial evidence.
- [0004 Shared publication consistency](0004-shared-publication-consistency.md). Accepted 14 November 2026. Atomic publication, durable job coordination, and preservation of the last successful version.
- [0005 Supabase PostgreSQL for shared and private data](0005-supabase-postgres-for-shared-and-private-data.md). Accepted 15 November 2026. PostgreSQL replaces SQLite as the target and serves both execution roles.
- [0006 Vercel hosting and scheduled execution](0006-vercel-hosting-and-scheduled-publication-trigger.md). Vercel web hosting accepted 15 November 2026. Vercel Schedules, Queues, and Functions confirmed on 21 November 2026 for Phase 1 ingestion and publication, starting on Hobby.

## Proposed

- [0007 Managed worker execution](0007-managed-worker-execution.md). **Proposed**, not accepted. Trigger.dev Cloud remains an alternative if measured Phase 1 workload limits justify revisiting ADR 0006; the separate final Airflow design also remains proposed.

Acceptance sources are recorded in each ADR and the [source register](../source-notes.md#source-register). For implemented behavior and commands, use the [developer guide](../developer-guide.md); accepted architecture does not imply implementation.

## Related research and proposals

- [Architecture research in Thai](../research/architecture-options-th.md): evidence and alternatives for security, worker/RAG, and user context.
- [Security and context RFC](../rfcs/architecture-security-and-context.md): proposed enforcement and data flow across all three areas.
- [AI workflow RFC](../rfcs/ai-workflow-orchestration.md) and [retrieval RFC](../rfcs/financial-evidence-retrieval.md): orchestration and evidence search.
- [Phase 1 architecture](../phase-1-planning/architecture.md) and [proposed final design](../final/final-architecture.md): distinguish the accepted Vercel starting point from the later Airflow/Pinecone target.
