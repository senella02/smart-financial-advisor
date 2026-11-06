# ADR 0005 Define Shared Publication and Chat Context

Status: Accepted  
Date: 2026-11-06  
Decision owner: Project owner  
Decision source: Owner confirmed publication timing, bilingual summaries, and today's-only Daily Brief Q&A during requirements finalization  
Related requirements: FR-03-FR-04, FR-11, FR-14, FR-21; Q06

## Context

Home displays shared market briefings, Stock Detail displays shared daily summaries, and both pages can lead to AI questions. A previous-day brief may remain visible while today's publication is pending. These display, archive, and AI-context behaviors need distinct rules so an older visible item is not mislabeled as current AI context.

## Decision

Use Thai calendar dates in `Asia/Bangkok`. Publish Daily Brief hourly every day, including weekends, and retain the latest successful publication for each past date. Until today's first publication is ready, display the prior day's brief with its actual date and update time.

Generate each stock's daily summary on first open of the Thai date from latest available evidence, display its as-of time, and keep the published summary unchanged until Thai midnight. New quotes and chat answers do not mutate that day's shared stock summary.

Stock Detail quotes refresh on page open or explicit visitor request, without minute polling. Initial trend analysis uses price and volume only; RSI/MACD/EMA are not required for Phase 1. Home's minute index refresh remains separate.

Provide Thai and English versions of shared Daily Brief short/full content and stock summaries. Language versions represent the same evidence snapshot and material facts. Common content stays separate from session chat and later personal contexts.

Automatically provide today's latest successful Daily Brief to a new chat request. Daily Brief Q&A supports today only; archives are read-only. If today's brief is unavailable, state that limitation rather than attaching the dated previous-day display fallback as today's context. Ordinary historical stock/financial research remains in scope.

## Alternatives considered

- Let users ask AI about an archived brief. Not chosen: the owner explicitly limited Daily Brief Q&A to today.
- Require a same-day opening quote for stock-summary generation. Not chosen: the owner accepted latest available data with as-of timestamps, including before an exchange opens.
- Generate shared summaries only in Thai. Not chosen: the owner required Thai and English versions.

## Consequences

Publication identity must preserve date, language, and evidence cutoff so reuse stays consistent. Stock-summary reuse also distinguishes the selected stock. The implementation must distinguish common publications, current-day AI context, and private session conversations.

The data provider, scheduler, translation/generation workflow, and storage technology remain unselected. A failed generation or missing language version must be visible; it must not be presented as a successfully updated publication.

## References

- [Publication and AI requirements](../functional-requirements.md)
- [Resolved publication questions](../requirements-questions.md#q06-shared-content-dates-and-publication)
- [ADR 0004 Phase 1 scope](0004-start-with-account-free-research.md)
