# Architecture Decision Records

ADRs preserve significant decisions and their reasons so contributors and AI agents can understand the project without reconstructing past conversations. Functional behavior remains in the [requirements](../functional-requirements.md); unanswered product questions remain in the [question record](../requirements-questions.md).

## Decisions

- [0001 Build a new product with selective reuse](0001-build-new-with-selective-reuse.md) — Accepted, 6 November 2026, from the project owner's instruction.
- [0002 Maintain one current requirements baseline](0002-requirements-source-of-truth.md) — Accepted, 6 November 2026, from the project owner's source priorities; the initial baseline still needs product-detail resolution.
- [0003 Value holdings at current FX](0003-value-holdings-at-current-fx.md) — Accepted, 6 November 2026, from the project owner's choice to exclude FX gains/losses.
- [0004 Start with account free research](0004-start-with-account-free-research.md) — Accepted, 6 November 2026, from the owner's Phase 1 scope and no-login clarification.
- [0005 Define shared publication and chat context](0005-define-shared-publication-and-chat-context.md) — Accepted, 6 November 2026, from the owner's bilingual publication, Thai-day, and today's-only brief Q&A decisions.
- [0006 Workspace layout and ownership](0006-workspace-layout-and-ownership.md) — Proposed, 7 November 2026; SFA-5 scaffold under review.
- [0007 Next.js UI and BFF runtime](0007-nextjs-ui-and-bff-runtime.md) — Proposed, 7 November 2026; prescribed setup shape, no hosting decision.
- [0008 Fixture-only integration boundary](0008-fixture-only-integration-boundary.md) — Proposed, 7 November 2026; contracts and internal ports, no live providers.
- [0009 Tooling, versions, and CI baseline](0009-tooling-versions-and-ci-baseline.md) — Proposed, 7 November 2026; exact versions and validation evidence.

The owner authorized the SFA-5 Next.js/TypeScript setup while explicitly keeping its architecture records Proposed. No model, data provider, database, hosting, or retrieval implementation has been selected.

## When to write an ADR

Record decisions that would be costly or confusing to reverse: architecture boundaries, model/tool strategy, source/data contracts, storage and personal-data ownership, retrieval freshness, deployment, or selective reuse of a substantial legacy component. Routine edits and every library choice do not need separate records.

Use the next four-digit number and a short filename: `NNNN-short-decision-name.md`. Start from the [template](template.md).

## Status and maintenance

- **Proposed:** An option under discussion. Describe alternatives and tradeoffs without implying a decision.
- **Accepted:** A decision was actually made. Record its date and who or what authorized it.
- **Rejected:** A considered option was not chosen; retain the reason if it matters.
- **Superseded:** A later accepted ADR replaces it. Link both records.

Accepted records preserve historical rationale. Add a new ADR for a material reversal; correct factual mistakes transparently. Keep this index, affected requirements, and source/question records consistent. Cite current primary documentation when a technical decision depends on an evolving tool or API.
