# ADR 0003 Market data and news provider selection

Status: Accepted

Date: 2026-11-14

Updated: 2026-11-20

Decision sources: The owner requested the initial provider decision on 14 November 2026 and authorized finalizing the filing and financial data source design in chat on 20 November 2026. [Source register](../source-notes.md#s7-filing-and-financial-data-sources)

Related requirements: [FR-01 stock identity](../functional-requirements.md#fr-01-supported-stock-identity), [FR-02 data freshness](../functional-requirements.md#fr-02-data-freshness-and-incomplete-data), [FR-12 financial data and news](../functional-requirements.md#fr-12-financial-data-and-news), and [FR-19 grounded answers and citations](../functional-requirements.md#fr-19-grounded-answers-and-citations)

## Context

The application needs Thai and US market data behind one internal contract. Coverage and access vary by data type, especially for financial statements and valuation metrics.

## Decision and rationale

Use Yahoo Finance as the initial upstream for instrument search, quotes, indices, price history, and news. The original evaluation exercised representative Thai and US symbols and indices. A shared adapter keeps the upstream response shapes out of application logic and allows other providers to fill coverage gaps.

The Phase 1 scheduled news corpus starts with official releases whose terms permit ingestion and the intended AI use. [FR-03](../functional-requirements.md#fr-03-daily-brief-content-and-publication)

Anonymous Yahoo Finance fundamentals requests returned authorization errors in the original evaluation. Stock Detail, chat, and publication workflows obtain statements and metrics through shared server-side adapters. [Market data research](../research/thai-and-us-market-data.md), [ADR 0002](0002-validated-contracts-and-data-trust-boundaries.md)

### Filings and fundamentals

- **US.** Use SEC EDGAR for filings and Company Facts for standard financial figures. Use the filed report for items outside Company Facts coverage. EDGAR supplies structured figures and the source documents that support citations. [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [US sample](../research/thai-and-us-market-data.md#us-filings-and-financial-facts)
- **Thailand.** Use Thai SEC iDISC as the primary source for annual and interim filings. Use the issuer's published copy when it matches the applicable filing. Extract and verify Thai statement figures from those filings where structured coverage is missing. The iDISC sample includes recent annual and interim filings. The SEC Open Data One Report API can supplement annual figures where its issuer, period, and field coverage is verified. [Thai filing and API coverage](../research/thai-and-us-market-data.md#thai-sec-open-data-one-report-coverage)
- **Thai structured feeds.** Keep the SET Financial Statement API and SETSMART Company Fundamental Data under evaluation. Either can supplement the Thai filing path if access, coverage, and rights for storage, display, and AI use are confirmed. The filing path can operate independently of a SET agreement. [SET Financial Statement API](https://www.set.or.th/app/online-data/financial-statement), [SETSMART Company Fundamental Data](https://www.set.or.th/app/online-data/fundamental-data?lang=en)

When sources disagree, reconcile issuer, reporting period, reporting basis, currency, unit, and filing version. Use the applicable audited or reviewed filing for figures on that basis. Use reported metrics or deterministic calculations from verified inputs. Mark figures unavailable when they or their inputs cannot be verified. Preserve the source and version for figures taken from filings. [Financial data boundaries](../contracts-and-boundaries.md#financial-and-publication-meaning), [Source reconciliation example](../research/thai-and-us-market-data.md#proposed-source-precedence)

## Alternatives and tradeoffs

- A single licensed provider could simplify integration and offer formal access terms. Its Thai and US coverage and cost would need to fit the project.
- A provider mix can fill gaps without replacing the primary adapter. It adds work to reconcile listing identity, source timestamps, units, and reporting periods.

## Consequences

The Yahoo Finance integration depends on unofficial endpoints. Revisit the provider choice if access changes or the adapter cannot meet the required coverage.

The Thai filing path requires extraction and validation work. Coverage, revision lag, and extraction accuracy still need measurement. A structured feed can reduce that work if it meets the coverage and usage requirements. [Q04](../requirements-questions.md#q04-supported-data-and-stock-coverage)

## References

- [ADR 0002 Validated contracts and data trust boundaries](0002-validated-contracts-and-data-trust-boundaries.md)
- [Q04 Supported data and stock coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage)
- [Q08 Release quality and evaluation](../requirements-questions.md#q08-release-quality-and-evaluation)
