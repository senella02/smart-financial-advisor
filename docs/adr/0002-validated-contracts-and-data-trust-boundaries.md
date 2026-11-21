# ADR 0002 Validated Contracts and Data Trust Boundaries

Status: Accepted

Date: 2026-11-07

Decision sources are the owner's [contract choices](../source-notes.md#s4-owner-confirmed-application-framework-and-contract-choices) and [application and worker agreement](../source-notes.md#s6-owner-confirmed-application-and-worker-boundary) on 7 November 2026.

Related requirements: [FR-01–FR-03, FR-11, FR-14, FR-19–FR-21](../final/functional-requirements.md)

## Context

External providers can represent stock identity, evidence, and unavailable data differently. The application needs one interpretation across consumers. Shared publications and visitor conversations also have different trust and privacy boundaries.

## Decision and rationale

Use provider-neutral `MarketDataPort` and `GenerationPort` interfaces with shared Zod schemas and inferred TypeScript types in `packages/contracts`. Server-side adapters validate external responses and map them into those contracts. The web application and worker share the same market-data integration, following [ADR 0001](0001-nextjs-application-and-shared-workspace.md).

Keep company identity separate from listing identity, product market separate from exchange, source time separate from fetch time, and available zero separate from missing data or failure. This prevents provider-specific shortcuts from silently changing financial meaning throughout the UI and generation pipeline.

Keep shared publication and indexing inputs separate from visitor conversations and future account-private data. Shared generation and caches use public evidence only. [ADR 0004](0004-shared-publication-consistency.md) defines how publications and their evidence are kept consistent.

Treat browser input, scheduler payloads, retrieved text, and provider output as untrusted. Resolve authoritative context and enforce access rules on the server. Keep provider credentials behind that boundary. Schema validation establishes data shape. Authorization and factual support require their own checks.

## Alternatives and tradeoffs

- Passing raw provider responses through UI and AI code avoids mapping initially but couples consumers to upstream shapes and lets inconsistent identity, timestamps, and missing-data conventions spread.
- TypeScript-only interfaces cover compile-time checks. Shared runtime schemas add validation and mapping work so both runtimes can check external inputs.

## Consequences

Each provider adapter needs verified coverage, response validation, and error mapping. Compatible changes to shared contracts must account for both execution roles. Generation consumers must verify the relationship between claims and evidence.

## References

- [Application/workspace architecture](0001-nextjs-application-and-shared-workspace.md)
- [Contracts and integration boundaries](../contracts-and-boundaries.md)
- [Open data coverage and operating questions](../requirements-questions.md)
- [Zod API](https://zod.dev/api)
