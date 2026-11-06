# Contracts and Integration Boundaries

SFA-5 is a fixture-only setup. The [functional requirements](functional-requirements.md) remain the behavior authority. Schemas and examples are a reviewable starting contract, not proof that feature acceptance has been implemented. Technical proposals are [ADRs 0006–0009](adr/README.md).

## Shared package

`@sfa/contracts` exports schemas, inferred types, and provider-neutral internal ports from [`index.ts`](../packages/contracts/src/index.ts). [`fixtures.ts`](../packages/contracts/src/fixtures.ts) is a separate import, `@sfa/contracts/fixtures`; every exported fixture has `{ fixture: true, data }`. Do not strip the marker when exposing a future demo response. Real adapters will not pretend that fixtures are live.

- `Company` contains a durable `companyId` and name. `Listing` references that company and has market, symbol, and a separate exchange identifier. TH/US are product markets, not exchanges. Resolve a routed market/symbol through an identity source before obtaining a complete listing; do not infer exchange from market. Fake exchange identifiers assert no real coverage.
- `Source` retains `sourceAsOf` and `fetchedAt` separately; ISO timestamps require an explicit offset (`Z` is valid). Refreshing data does not change its source timestamp. No arbitrary provider-age threshold is invented.
- `NumericValue` distinguishes available finite values, including zero, from missing null plus a reason. Money carries THB/USD and an explicit unit; non-money units use null currency. `Result` distinguishes available data, unavailable data, and an error. Missing quote fields can coexist with an available quote envelope.
- Shared publications have identity, Thai publication date, publication time, evidence cutoff, and source timestamps. TH and EN variants sit under one evidence snapshot; this prevents independent snapshot references but cannot prove translation or factual quality. `GenerationPort` is only an internal structured request/result seam. A future AI consumer must validate output, evidence links, language, and factual support before publication.

## UI → BFF → adapter

The stock Server Component calls [`research.ts`](../apps/web/src/server/research.ts), which resolves only known fixture routes and calls [`fixture-market-data.ts`](../apps/web/src/server/adapters/fixture-market-data.ts). Unknown routes return 404 without substituting a stock. Internal reads currently use server modules; no HTTP API is needed. Add a Route Handler under `apps/web/src/app/api/` only when a feature needs one, validating inputs and results through shared schemas.

To replace the fixture adapter, implement `MarketDataPort`, map a selected provider's actual response into these contracts, validate it, and inject it at the server composition point. Provider SDKs, credentials, response schemas, supported exchanges, and freshness handling need their own verified decisions. No adapter is selected by these port names. The fixture quote returns missing price; there are no realistic prices or returns.

## Shared publication → future job entry point

`currentDayBriefLookupFixture` demonstrates a current-day display and AI context. `previousDayBriefLookupFixture` demonstrates a dated display fallback with unavailable current-day context. The lookup schema rejects an older publication as today's context. These are fixed examples from 2000, never runtime evidence about today.

`dailyStockSummaryLookupFixture` keys a summary by listing and Thai date and checks that the returned publication matches. Production must implement first-open generation, one shared result per Thai day, fixed reuse until Thai midnight, and consistent bilingual evidence. These behaviors are absent here; no summary generation, cache, scheduler, database, archive, or refresh logic is implemented.

The future publication application service should accept validated shared evidence and call a `GenerationPort` implementation through a private job/first-open entry point. Keep shared inputs free of chat, profile, holdings, or watchlist data. [`fixture-generation.ts`](../apps/web/src/server/adapters/fixture-generation.ts) currently returns unavailable. Do not add a public writable generation trigger to demonstrate this seam.

## Session chat and future private accounts

`chatContextFixture` specifies language, explicit selected-listing association, and a Daily Brief lookup. `sessionHistoryFixture` has a general conversation mentioning a ticker with no stock link and a stock-origin conversation with an explicit listing. Both belong in the main view; only the latter belongs in that listing's stock view. History examples contain user messages only; no fake assistant answer is shown.

`SessionHistorySchema` describes version 1 browser `sessionStorage` data. This is a proposed storage contract only: no persistence implementation, synchronization, multi-tab policy, history UI, or server history store exists. Browser storage, submitted associations, fixture markers, retrieved text, and messages are untrusted. Parsing shape does not authorize a stock binding or establish trusted AI evidence; re-resolve listing identity and today's current publication on the server. Never let old history promote an archived brief into current context.

Phase 1 needs no account. When personal features arrive, enforce authenticated ownership before reading/writing account-private records or building private chat context. Shared publication interfaces must continue to exclude personal input, and private content must stay out of shared outputs, logs, and caches. Authentication, storage, retention/deletion controls, and private cache design are deferred.

## Still open

[Q04](requirements-questions.md#q04-supported-data-and-stock-coverage) covers data coverage/freshness, [Q05](requirements-questions.md#q05-chat-and-discovery-boundaries) covers measured chat/comparison limits, and [Q08](requirements-questions.md#q08-release-quality-and-evaluation) covers release acceptance. Database, hosting, providers, models, and scheduler choices are deferred. No setup fixture resolves these questions.
