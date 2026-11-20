# Thai and US market data research

Provider terms and sample coverage checked on 20 November 2026.

US SEC EDGAR is the recommended source for US filings and standard financial facts. For Thailand, use filed statements from Thai SEC iDISC or the issuer as evidence. Evaluate SET SMART Marketplace as the structured feed for annual and quarterly statements. Thai SEC's One Report API supplies annual financial figures and ratios. The main open question is whether a SET subscription covers the required quarterly history and permits the app's intended use.

[ADR 0003](../adr/0003-market-data-and-news-provider-selection.md) records Yahoo Finance as the initial prototype source for search, indices, quotes, price history, and news. Its adapter reports live statements and ratios as unavailable. The recommendations here inform [Q04](../requirements-questions.md#q04-supported-data-and-stock-coverage).

## Sources by data type

### Filings and statements

- For Thailand, use Thai SEC iDISC or the issuer's investor-relations archive for 56-1 One Reports, audited annual statements, and reviewed interim statements. The Thai SEC One Report financials endpoint takes a subscription key, company ID, and report year. Its published JSON example has columns for the report year and two preceding years. SET's SMART Marketplace Financial Statement API documents detailed annual and interim line items, consolidation scope, fiscal dates, review status, and restatements. SETSMART Company Fundamental Data is a separate product for key figures, ratios, and end-of-day prices. [Thai SEC iDISC](https://market.sec.or.th/public/idisc/en/company/listed), [Thai SEC One Report API](https://secopendata.sec.or.th/sec-open-apis?type=one-report&id=16-CGP-FinancialStatement&user=developer), [SET Financial Statement API](https://www.set.or.th/app/online-data/financial-statement), [SETSMART fundamentals](https://www.set.or.th/app/online-data/fundamental-data?lang=en)
- For the US, use EDGAR Submissions for 10-K, 10-Q, 8-K, and amendments. Use Company Facts for standard XBRL facts that apply to the whole reporting entity. Use the filed report or inline XBRL for custom tags, dimensions, and missing facts. Cite the exact filing accession. These APIs require no key. Use server-side requests with a declared user agent and observe the SEC's limit of 10 requests per second. [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [SEC fair access](https://www.sec.gov/about/webmaster-frequently-asked-questions)

### Quotes and price history

- For Thailand, evaluate SET and mai snapshot data and SETSMART historical prices. SET lists real-time and 15-minute delayed snapshots. Its page lists ฿15,000 per month for personal or internal real-time use and directs customers to its data team for delayed-data and redistribution prices. Confirm the intraday data needed for the 1D chart and the historical entitlement for the 5Y chart. [SET snapshot product](https://www.set.or.th/app/online-data/market-data?lang=en), [SETSMART historical data](https://www.set.or.th/app/online-data/fundamental-data?lang=en)
- For the US, evaluate a licensed consolidated feed for market-wide trades and bars. Massive's individual Basic plan lists end-of-day data and two years of history. Starter lists 15-minute delayed aggregates and five years of history at US$29 per month. Check the public-display terms separately. Alpaca's free real-time IEX feed covers one venue. Its example for AAPL on 29 September 2023 shows a USD 171.29 IEX close and a USD 171.21 consolidated close. [Massive pricing](https://massive.com/pricing), [Alpaca feed comparison](https://docs.alpaca.markets/us/v1.1/docs/market-data-faq)

### Disclosures and news

- For Thailand, use SET News Feed and issuer announcements for company disclosures, and the Bank of Thailand for policy releases. Evaluate a licensed Thai editorial feed for broader reporting. [SET News Feed](https://www.set.or.th/en/services/connectivity-and-data/data/realtime), [Bank of Thailand policy releases](https://www.bot.or.th/en/our-roles/monetary-policy/mpc-publication.html)
- For the US, use EDGAR 8-K and issuer releases for company disclosures, and the Federal Reserve for policy releases. Massive ticker news is an editorial-feed candidate. For articles, retain the original URL, publisher, language, and publication time. A company's filing or release supplies evidence for the reported event. [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [Federal Reserve feeds](https://www.federalreserve.gov/feeds/feeds.htm), [Massive ticker news](https://massive.com/docs/rest/stocks/news)

## Exploratory data analysis

### US filings and financial facts

The sample used AAPL, JPM, WMT, and RIVN with report-end dates from 1 January 2022 through 31 December 2025. The check selected original 10-K and 10-Q filings from Submissions, including its archive files. It joined Company Facts by accession, reporting period, and USD unit. For income and cash-flow facts it distinguished annual, standalone-quarter, and year-to-date periods. It checked revenue, net income, assets, parent equity, and operating cash flow in each filing. JPM used its bank net-revenue concept. [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)

- The sample covered 16 annual and 48 interim filings, four annual and twelve interim for each issuer. The probe found 78 of 80 annual facts and 189 of 192 interim facts across the four fields other than operating cash flow.
- All five missing direct facts came from checking the parent-equity tag for Rivian. Its FY2025 filing reports USD 4,594 million of total equity including USD 28 million of noncontrolling interests. Preserve that difference in scope when mapping equity. [Rivian FY2025 10-K](https://www.sec.gov/Archives/edgar/data/1874178/000187417826000008/rivn-20251231.htm)
- Of the 48 interim operating cash-flow facts, 16 were available as standalone quarters and 32 were year-to-date only. Each issuer had four standalone and eight year-to-date results. The annual filing includes the fourth quarter in the full-year total.
- JPM's current Submissions response contained one of its 16 sampled filings. The archived indexes supplied the remaining 15, so a collector needs to follow EDGAR's archive references.

### Thai statement, quote, and ratio samples

The check used the public example archives linked on SET's product pages. It inspected the three latest public statement-view headers for four issuers and reconciled four FY2023 statement lines against ADVANC's filed report.

- The detailed statement example contained 39 records across 21 symbols with period ends in November or December 2023. It held 35 annual and four Q3 records, split between 18 consolidated and 21 separate statements. The account dictionary contained 2,158 rows and 959 distinct codes. Joining by account form and code mapped every sample line. The example for 3K-BAT labels 31 December 2023 as fiscal Q3 2024. Use the actual fiscal dates. [SET statement product and sample](https://www.set.or.th/app/online-data/financial-statement), [SET statement specification](https://media.set.or.th/set/Documents/2025/Apr/16_SMART_Marketplace_Financial_Statement_Specification.pdf)
- CPALL, PTT, KBANK, and PHOL each displayed a Q3 2026 period header on their balance-sheet, income-statement, and cash-flow views. PHOL represented mai in the sample. [CPALL public statement](https://www.set.or.th/en/market/product/stock/quote/CPALL/financial-statement/latest/balance), [PHOL public statement](https://www.set.or.th/en/market/product/stock/quote/PHOL/financial-statement/latest/balance)
- The stock snapshot example had 51 rows. Of those, 33 had a missing last price and observation time alongside zero volume. The other 18 had timestamps from 24 March 2023. [SET quote product and sample](https://www.set.or.th/app/online-data/market-data?lang=en)
- In the 6 May 2025 end-of-day sample, filtering to common stocks on the main board yielded 923 rows, with 699 on SET and 224 on mai. The filter excluded another 923 common-stock rows on the odd-lot board. Of the 923 main-board rows, 74 lacked P/E and 10 lacked P/BV. All 923 had values in the last price, dividend yield, and market cap fields. [SET end-of-day product and sample](https://www.set.or.th/app/online-data/oaq-data), [SET board codes](https://media.set.or.th/set/Documents/2023/May/OAQ_Security_Profile.pdf)
- SETSMART's PTT example included 489 adjusted daily bars between 3 January 2018 and 30 December 2019. All eight example fundamentals rows included ROE and D/E. The member's subscription determines the available history. [SETSMART fundamentals product and sample](https://www.set.or.th/app/online-data/fundamental-data?lang=en)

## Proposed source precedence

For financial statements, compare the exact issuer, period, consolidation scope, currency, units, definition, and filing version. Prefer the applicable audited annual or reviewed interim filing for a figure on that basis. Use the latest relevant restatement available by the evidence cutoff and retain the original version for historical research. Hold unresolved conflicts out of calculations and AI claims. [Contracts and integration boundaries](../contracts-and-boundaries.md#financial-and-publication-meaning)

ADVANC's FY2023 consolidated filed revenue is ฿188,872.91 million. The SET sample reports ฿189,720.27 million. The full ฿847.36 million difference equals the finance income and other income shown separately in the filing. Use the ฿188,872.91 million figure for the filed revenue line. Assets, liabilities, and operating cash flow matched the filing exactly after applying the unit multiplier to the annual accumulated values. [ADVANC FY2023 audited statements, pages 167–169 and 175](https://investor.ais.co.th/storage/document/annual-reports/2023/advanc-ar2023-05-en.pdf), [SET statement sample](https://www.set.or.th/app/online-data/financial-statement)

For additive income or cash-flow lines, prefer reported standalone quarters. When only year-to-date values are available, derive Q2 and Q3 by subtracting the preceding year-to-date value. Derive Q4 from the full year minus nine months. Both inputs need the same reporting scope, currency, fiscal year, and revision basis. Label derived figures, cite both inputs, and show year-to-date figures with their period when the standalone quarter cannot be derived. Balance-sheet amounts are point-in-time snapshots.

For quotes, match the listing, trading board, session, feed, timestamp, and adjustment basis. Prefer the exchange or licensed consolidated observation for the requested session. Give each ratio a source or calculation basis and as-of date. For event facts, prefer the original disclosure or agency release. Attribute editorial reporting to its publisher.

## Proposed display for delayed and missing data

- For a 15-minute delayed feed, show `ข้อมูลล่าช้า 15 นาที` with the provider and original observation time. When the market is closed, show `ตลาดปิด · ราคาปิดล่าสุด` with the last regular-session date.
- When refresh fails and a cached value exists, show `อัปเดตไม่สำเร็จ · แสดงข้อมูลล่าสุดที่มี` with the original timestamp and a retry action. Apply the stale label using the market session and expected feed delay. Q04 tracks the exact freshness threshold.
- When the provider reports no trade, show `ยังไม่มีการซื้อขาย`. Show `ไม่ทราบเวลาของข้อมูล` when the timestamp is unknown. Preserve a genuine zero and keep an absent price missing. The Yahoo prototype adapter currently falls back to fetch time for missing quote and news timestamps. Freshness labels need the distinct observation, fetch, and publication times.
- When a statement, ratio, or chart range is missing, keep the row or range visible. Show `ไม่มีข้อมูลสำหรับงวดนี้`, partial history, or the reason a metric is inapplicable. Show the reporting period, units, and a filing link where available.
- Use `ไม่พบข่าวในช่วงเวลาที่เลือก` after a successful news search with zero matches. Show temporary unavailability when the feed fails. Chat can answer from available evidence and state any material gaps.

Stock Detail refreshes on page open and manual request. The published daily summary retains its own evidence cutoff after a quote refresh. [FR-02 freshness](../functional-requirements.md#fr-02-data-freshness-and-incomplete-data), [FR-11 summary](../functional-requirements.md#fr-11-shared-daily-stock-summary), [FR-12 Stock Detail data](../functional-requirements.md#fr-12-financial-data-and-news), [Yahoo adapter](../../apps/web/src/server/adapters/live-market-data.ts)

## Evidence still needed for a provider decision

The Thai SEC check covered the public schema and response example. The SET checks covered published samples and public pages. Authenticated four-year coverage, live feed freshness, and editorial news coverage remain unverified. Test an entitled SET sample across SET and mai, including a bank and a non-calendar-year issuer. Check the income statement, balance sheet, and cash flow for annual and quarterly periods. Verify P/E, P/BV, ROE, D/E, dividend yield, market cap, and the 1D, 1M, 1Y, and 5Y chart ranges. Confirm rights for public display, storage, and AI use for each chosen feed. [SET data terms](https://www.set.or.th/en/terms-and-conditions), [SET Financial Statement API](https://www.set.or.th/app/online-data/financial-statement), [Q04](../requirements-questions.md#q04-supported-data-and-stock-coverage)
