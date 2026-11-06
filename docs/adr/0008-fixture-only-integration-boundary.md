# ADR 0008 Fixture-only Integration Boundary

Status: Proposed

Date: 2026-11-07

Decision owner: Project owner / Lead

Related requirements: FR-01–FR-04, FR-11, FR-13–FR-14, FR-19–FR-21; Q04, Q05

## Context

SFA-5 must enable UI, Backend, and AI work without credentials or claims about unverified external services. ADR 0005 requires shared bilingual publications to retain one evidence snapshot and keeps prior-day display fallbacks out of today's AI context.

## Decision

Propose Zod schemas plus TypeScript types in `packages/contracts`. Separate company from listing identity, product market from exchange, source timestamps from fetch timestamps, and available zero from missing null with a reason. Give shared publications a Thai date, publication time, evidence cutoff, and language-specific text under one evidence snapshot.

Provide internal `MarketDataPort` and `GenerationPort` interfaces, not invented provider APIs. Use server-only fixture adapters; generation returns unavailable and never supplies pretend AI answers. Every exported fixture is wrapped in `{ fixture: true, data }`; all example dates are historical and symbols/exchanges explicitly fake.

Specify `sessionStorage` only as a proposed browser-session history contract for future feature work. Do not read or write browser history in this scaffold. Main history will include both origins; stock history uses explicit listing association, never ticker text. The server must treat browser content as untrusted and re-resolve identity and current brief from trusted application state.

## Alternatives considered

- Connect a real provider for a more convincing demo: violates fixture-only scope and prematurely chooses coverage and cost.
- Reuse the legacy ingestion/runtime: violates the fresh-build boundary.
- Store general chat centrally in shared publications: violates visitor privacy and publication separation.

## Consequences

Contract tests can exercise identity, timestamps, missing data, and context boundaries without network calls. Lookup examples specify shapes, not publication, retention, deduplication, translation quality, history persistence, or scheduling implementations. Future adapters must validate external responses and preserve unavailable/error states. Private data must never enter shared generation inputs or caches.

## References

- [ADR 0005: publication and context](0005-define-shared-publication-and-chat-context.md)
- [Contract guide](../contracts-and-boundaries.md)
- [Zod API](https://zod.dev/api)
- [Open coverage and operating limits](../requirements-questions.md)
