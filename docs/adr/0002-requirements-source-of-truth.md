# ADR 0002 Maintain One Current Requirements Baseline

Status: Accepted  
Date: 2026-11-06  
Decision owner: Project owner  
Decision source: Project owner's statement that slides are maintained, the existing functional document is outdated, and the old report is reference material

## Context

The existing requirements PDF is dated 25 October 2026. The supplied progress slides contain updated features and a recap that still includes older statements. The previous LLMFA report describes a different implementation. Treating all three as equally current would create contradictory requirements.

## Decision

Maintain an editable [functional requirements baseline](../functional-requirements.md) in this repository. Apply evidence in this order:

1. Current explicit project-owner decisions, recorded into the baseline and question/decision records.
2. The agreed current functional requirements and accepted ADRs, each within its scope. Flag contradictions rather than silently letting an architecture decision change a feature.
3. The latest slides for features not yet resolved in the baseline. Explicitly updated feature pages take precedence over stale recap text when they conflict; record that reconciliation for review.
4. The old v1.4 requirements only for supplemental detail that remains compatible and is explicitly retained. Precision alone does not make a historical detail approved.
5. The previous project's final report and code as background and potential reuse evidence.

Keep open product decisions in one linked question record. Label proposed acceptance details, and do not describe the initial draft as finalized before the owner resolves or deliberately defers those decisions. Preserve source PDFs.

## Alternatives considered

- Treat the old requirements as binding until individually replaced. Rejected because the owner explicitly identifies them as outdated.
- Treat every statement in the slides as equally current. Rejected as a working approach because updated Portfolio/Daily Brief features contradict older recap statements in the same deck.
- Use the old report as the target architecture. Rejected by ADR 0001.

## Consequences

Contributors have a single entry point for current behavior. Source notes preserve why conflicting statements were reconciled. Product answers must update requirements and acceptance criteria together. The initial draft's detailed semantics remain open; this ADR accepts the maintenance approach, not unanswered product rules.

## References

- [Source register and reconciliations](../source-notes.md)
- [Open questions](../requirements-questions.md)
- [ADR 0001](0001-build-new-with-selective-reuse.md)
