# ADR 0003 Market data and news provider selection

Status: Accepted

Date: 2026-11-14

Decision source: Project owner request to evaluate Thai and US data providers and record the integration decision.

Related requirements: [FR-01 stock identity](../functional-requirements.md#fr-01-supported-stock-identity), [FR-02 data freshness](../functional-requirements.md#fr-02-data-freshness-and-incomplete-data), and [FR-12 financial data and news](../functional-requirements.md#fr-12-financial-data-and-news)

## Context

The application needs Thai and US market data behind one internal contract. Coverage and access vary by data type, especially for financial statements and valuation metrics.

## Decision and rationale

Use Yahoo Finance as the initial upstream for instrument search, quotes, indices, price history, and news. The original evaluation exercised representative Thai and US symbols and indices. A shared adapter keeps the upstream response shapes out of application logic and allows other providers to fill coverage gaps.

Anonymous Yahoo Finance fundamentals requests returned authorization errors in the original evaluation. Financial statements and metrics therefore need an independently verified source. Where coverage is missing, use the explicit unavailable states from [ADR 0002](0002-validated-contracts-and-data-trust-boundaries.md).

## Alternatives and tradeoffs

- A single licensed provider could simplify integration and offer formal access terms. Its Thai and US coverage and cost would need to fit the project.
- A provider mix can fill gaps without replacing the primary adapter. It adds work to reconcile listing identity, source timestamps, units, and reporting periods.

## Consequences

The Yahoo Finance integration depends on unofficial endpoints. Before relying on it in a hosted deployment, verify permitted use, current data coverage, and behavior from that runtime. Revisit the provider choice if access changes or the adapter cannot meet the required coverage. Keep endpoint details, cache settings, and test results in implementation documentation or the relevant PR.

## References

- [ADR 0002 Validated contracts and data trust boundaries](0002-validated-contracts-and-data-trust-boundaries.md)
- [Q04 Supported data and stock coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage)
- [Q08 Release quality and evaluation](../requirements-questions.md#q08-release-quality-and-evaluation)
