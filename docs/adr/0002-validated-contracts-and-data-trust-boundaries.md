# ADR 0002 Validated Contracts and Data Trust Boundaries

Status: Accepted

Date: 2026-11-07

Decision source: Owner's [SFA-5 setup brief and acceptance](../source-notes.md#s4-owner-supplied-sfa-5-setup-brief); worker trust-boundary clarification follows the [application/worker agreement](../source-notes.md#s6-owner-confirmed-application-and-worker-boundary) on 7 November 2026

Related requirements: [FR-01–FR-03, FR-11, FR-14, FR-19–FR-21](../functional-requirements.md)

## Context

Market-data and generation providers remain unselected. The application needs stable internal meanings for stock identity, evidence, and unavailable data without treating a provider's response as its own domain model. Shared publications and visitor conversations also have different trust and privacy boundaries.

## Decision and rationale

Use provider-neutral `MarketDataPort` and `GenerationPort` interfaces with shared Zod schemas and inferred TypeScript types in `packages/contracts`. Server-side adapters map and validate actual external responses into those contracts. The web application and worker use shared market-data semantics rather than separate provider implementations, following [ADR 0001](0001-nextjs-application-and-shared-workspace.md). The ports describe application needs, not an invented external provider API.

Keep company identity separate from listing identity, product market separate from exchange, source time separate from fetch time, and available zero separate from missing data or failure. This prevents provider-specific shortcuts from silently changing financial meaning throughout the UI and generation pipeline.

Represent bilingual shared publications under one evidence snapshot with publication identity, date, publication time, and evidence cutoff. Keep shared publication inputs separate from chat and future account-private data; private context must not enter shared outputs or caches. This supports consistent shared content without allowing a personalized answer to alter a common publication.

Treat browser messages, submitted associations, storage, and retrieved text as untrusted. Schema validation checks shape, not authority or factual support. Resolve listing identity and current publication context from trusted server state before using them as AI evidence. The server boundary keeps provider credentials and trusted context resolution out of client control. Scheduler/job inputs are also untrusted at entry; worker execution must validate them and resolve authoritative evidence and publication state. Background shared publications and document indexes must not ingest session chat or future account-private data.

## Alternatives and tradeoffs

- Passing raw provider responses through UI and AI code avoids mapping initially but couples consumers to upstream shapes and lets inconsistent identity, timestamps, and missing-data conventions spread.
- TypeScript-only interfaces do not validate runtime external input. Shared runtime schemas add validation and mapping work but make those boundaries explicit. Zod itself was prescribed for setup, not chosen through a validator comparison.

## Consequences

New providers can be integrated behind the internal ports, but each adapter still needs verified coverage, response validation, and error mapping. Contracts shared by the web application and worker require coordinated producer/consumer changes. Any Python processing boundary needs runtime validation too; TypeScript types do not cross that boundary.

A common evidence snapshot cannot prove translation quality, citation support, or factual accuracy; generation consumers must check those separately. Keeping private data out of shared contracts is not an implemented account authorization system. Authentication, storage, retention, caching, and generation workflows remain unselected.

Fixture adapters exercise these contracts during setup; their markers, example dates, and temporary restrictions belong in the implementation guides. This ADR does not select browser storage, a live provider, model, database, scheduler, or retrieval framework.

## References

- [Application/workspace architecture](0001-nextjs-application-and-shared-workspace.md)
- [Contracts and integration boundaries](../contracts-and-boundaries.md)
- [Open data coverage and operating questions](../requirements-questions.md)
- [Zod API](https://zod.dev/api)
