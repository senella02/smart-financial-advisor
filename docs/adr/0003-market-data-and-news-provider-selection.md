# ADR 0003 Market Data and News Provider Selection

Status: Accepted

Date: 2026-11-14

Decision source: Project owner request to evaluate live Thai/US provider options, rate limits, and regulatory constraints, and record the architecture decision.

Related requirements: [FR-01, FR-02, FR-05, FR-11](file:///F:/Engineering/Y4_2569_T1/smart-financial-advisor/docs/functional-requirements.md), [ADR 0002](file:///F:/Engineering/Y4_2569_T1/smart-financial-advisor/docs/adr/0002-validated-contracts-and-data-trust-boundaries.md).

## Context

Phase 1 requires a single source-integration layer providing:
- Quotes, identity validation, and OHLCV history (1D, 1M, 1Y, 5Y) for Thai (SET) and US common stocks.
- 5 major market indices: SET, SET50, Dow Jones, S&P 500, and Nasdaq.
- Financial statements (annual/quarterly up to 4 years) and key metrics (P/E, P/BV, ROE, D/E, dividend yield, market cap).
- Company news and broad market news with verifiable publishers and source URLs.

Key constraints:
- Operating budget (Q08) is zero/unconfirmed; expensive commercial vendor licenses (Bloomberg, Refinitiv, official SET data feed licenses) are out of scope.
- Thai market coverage is strictly required alongside US markets.
- In accordance with project rules, the application must never fabricate financial figures, must distinguish observation times from fetch times, and must handle provider errors gracefully with explicit `unavailable` results.

## Decision and rationale

We adopt a **Hybrid Provider Adapter Architecture** centered around the public Yahoo Finance engine for market quotes, OHLCV charts, and news, backed by typed schema contracts and verified local statement fixtures where upstream access is restricted:

1. **Market Quotes, 5 Major Indices, and OHLCV Price/Volume History:**
   - **Engine:** Yahoo Finance v8 Chart Endpoint (`query1.finance.yahoo.com/v8/finance/chart/{symbol}`).
   - **Live verification:** Successfully tested on live network with `PTT.BK` (SET), `AAPL` (Nasdaq), `^SET.BK`, `^SET50.BK`, `^DJI`, `^GSPC`, and `^IXIC`.
   - **Coverage & Delays:** Native 15-minute delayed quotes for SET (Thailand) and near-instant/minute quotes for US exchanges. Native timestamps and currency keys (`THB`/`USD`) are preserved directly without overwriting fetch times.

2. **Stock Search, Company Identity, and News:**
   - **Engine:** Yahoo Finance Search & News API (`query2.finance.yahoo.com/v1/finance/search`).
   - **Identity Rule:** Ambiguous queries return candidate lists or reject match without guessing. Unsupported instrument types (e.g. mutual funds, crypto, futures) are filtered out to satisfy the common-stock restriction.
   - **News:** Provides live headlines, publisher metadata, original source URLs, and publication timestamps.

3. **Financial Statements & Deep Valuation Metrics:**
   - **Provider constraint:** Direct anonymous access to Yahoo's `quoteSummary` endpoint returns HTTP 401 Unauthorized without session cookies/crumbs.
   - **Contract compliance:** When live fundamental data cannot be authorized or retrieved, the adapter explicitly yields `{ status: "unavailable", reason: "PROVIDER_RESTRICTED" }` or serves audited static fixtures (`@sfa/contracts/fixtures`) for verified demo securities. No financial values are invented or defaulted to zero.

4. **Rate Limiting and Cache Boundary:**
   - All external calls are mediated through Next.js server-side adapters (`apps/web/src/server/adapters/`).
   - Server-side caching (TTL 60s for quotes, 300s for news) prevents redundant outbound requests and adheres to rate limits (estimated ~2,000 req/hr/IP).

## Alternatives and tradeoffs

- **Alpha Vantage / Finnhub:**
  - *Tradeoff:* Excellent US stock coverage, but virtually zero or extremely restricted coverage for Thai common stocks (SET) on free plans. Also strictly constrained by rate limits (e.g. 25 requests/day or 5 calls/min on Alpha Vantage), making it unusable as a primary unified source.
- **Official SET Data Feed / SET Link API:**
  - *Tradeoff:* Legally compliant official data, but requires enterprise contracts, corporate approval, and subscription fees incompatible with zero-budget development.
- **Financial Modeling Prep (FMP):**
  - *Tradeoff:* Excellent 4-year financial statement tables, but free tier limits historical depth and restricts Thai ticker coverage.

## Consequences

- The application achieves immediate zero-cost integration for live Thai and US quotes, OHLCV charts across all required ranges (1D/1M/1Y/5Y), 5 major indices, and news.
- The system must respect upstream terms of service; scraping or bypassing authentication challenges is prohibited by agent guidelines.
- Unofficial endpoint changes could cause disruptions; downstream consumers must always rely on `@sfa/contracts` boundaries and handle `unavailable` statuses cleanly.

## References

- [Functional Requirements FR-01, FR-02, FR-05, FR-11](file:///F:/Engineering/Y4_2569_T1/smart-financial-advisor/docs/functional-requirements.md)
- [ADR 0002 Validated contracts and data trust boundaries](file:///F:/Engineering/Y4_2569_T1/smart-financial-advisor/docs/adr/0002-validated-contracts-and-data-trust-boundaries.md)
- [Requirements Questions Q04, Q08](file:///F:/Engineering/Y4_2569_T1/smart-financial-advisor/docs/requirements-questions.md)
