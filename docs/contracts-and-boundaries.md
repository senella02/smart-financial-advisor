# Contracts and integration boundaries

These rules apply across Phase 1 features. The architecture decisions explain why the boundaries exist. The functional requirements define product behavior. [ADR 0001](adr/0001-nextjs-application-and-shared-workspace.md), [ADR 0002](adr/0002-validated-contracts-and-data-trust-boundaries.md), [Phase 1 scope](functional-requirements.md#1-scope-and-requirement-status)

## Layer responsibilities

- The web UI renders validated server results and formats financial values for display.
- The web server validates visitor input, resolves authoritative listing and publication context, and calls the relevant adapters through shared interfaces.
- The worker runs scheduled and durable jobs and writes shared publications. Shared server logic used by both runtimes stays independent of Next.js and browser APIs.
- Only server-side adapters handle raw provider payloads. They validate those payloads and map them to shared contracts. Provider interfaces remain independent of provider selection.
- The contracts package defines runtime schemas, types, and provider interfaces. It performs no I/O.

## Trust and privacy

Treat browser input, saved conversation history, scheduler payloads, retrieved text, and provider output as untrusted. Validate structure, enforce authorization, and verify factual support separately. Check that the cited evidence supports each material financial claim.

Use only public evidence for shared publication generation and shared caches. Keep visitor conversations and other private content out of shared outputs, shared caches, and logs. Keep provider credentials on the server. [ADR 0002](adr/0002-validated-contracts-and-data-trust-boundaries.md), [FR-19](functional-requirements.md#fr-19-grounded-answers-and-citations), [FR-20](functional-requirements.md#fr-20-personal-context-isolation)

## Financial and publication meaning

- Keep company identity separate from listing identity. Resolve the listing through a trusted identity source and keep its exchange distinct from its product market.
- Keep the source observation time, application fetch time, and publication time distinct. A refresh preserves the source observation time. Shared publication dates use the Bangkok calendar.
- Preserve an available zero as a value. Represent missing data and errors explicitly. Keep the units, currency, and reporting period attached to financial values where applicable.
- Thai and English variants of a shared publication use the same evidence snapshot and cutoff.
- Preserve labels that identify synthetic data when it crosses a boundary.

## Handoffs between layers

- Chat requests carry the message, requested answer language, and any visitor-supplied stock association. Before retrieval or generation, the server resolves the association and looks up today's latest successful Daily Brief. The server obtains evidence through its own adapters. Only today's server-resolved brief supplies Daily Brief context and supports brief follow-up requests. [FR-03](functional-requirements.md#fr-03-daily-brief-content-and-publication), [FR-13](functional-requirements.md#fr-13-stock-bound-chat), [FR-14](functional-requirements.md#fr-14-general-financial-questions-and-comparison)
- Job inputs carry identifiers and dates as needed. When a job names a source, the worker resolves it against trusted configuration. Session text and fetched passages stay outside the job payload.
- For scheduled briefs and first-open stock summaries, the worker commits both language variants and their common evidence snapshot in one transaction. A failed attempt preserves the last successful version. [ADR 0004](adr/0004-shared-publication-consistency.md), [FR-11](functional-requirements.md#fr-11-shared-daily-stock-summary)
- Keep UI locale, publication language, and requested chat language independent. Display source content in its original language and preserve the underlying financial values when formatting them. [FR-21](functional-requirements.md#fr-21-access-and-languages)

## Contract changes

Update every affected producer and consumer in the same change. Include producer mapping, consumer validation and rendering, fixtures, and tests that exercise the changed boundary.
