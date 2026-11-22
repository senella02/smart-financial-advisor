# Remaining Requirement Questions

Updated: 21 November 2026. Recorded answers below come from the project owner. Subquestions remain open unless resolved explicitly. These questions clarify the finalized feature set; they do not propose an additional feature backlog.

## Baseline finalization

On 7 November 2026, the project owner finalized the first [requirements baseline](final/functional-requirements.md). The answers below record which product decisions are settled and which still need review.

## Review focus

The [Phase 1 scope](phase-1-planning/functional-requirements.md#scope) is agreed. Remaining detail concerns data coverage/freshness, measured operating limits, evaluation targets, and later features.

Portfolio accounting, later account persistence, Discovery detail, and Investor Profile controls remain relevant to the full target, but do not block the agreed Phase 1 feature scope. Keep their unresolved rules visible before those features are designed or implemented.

## Decisions and remaining questions

### Q01 Portfolio accounting and summaries

Affected: FR-06, FR-09, FR-10.

- Current scope is resolved: manually maintained current holdings, with separate purchase positions. No transaction ledger, sales accounting, realized returns, cash, or dividends-received accounting.
- Are fractional quantities allowed for US stocks? Are future purchase dates or zero-cost shares allowed? Is there a position/stock limit?
- Deleting a position removes a current-holding record, not a recorded sale. Should users handle a partial sale by manually reducing the position quantity? No realized gain is calculated.
- Is weighted dividend yield based on current market value and current provider yield, or cost and expected dividends? How should missing yield data affect the denominator?
- Should concentration show stock and industry weights, or also assign a risk classification? What defines Home's strongest movers: absolute percentage change, signed gainers/losers, or contribution to portfolio P/L?

**Proposed remaining detail:** Aggregate quantities and cost for the same stock. Show concentration as weights without an invented risk score. Confirm the unresolved validation and summary details before adoption.

Answer: Partially resolved on 6 November 2026. The owner confirmed current holdings and purchase positions only, identified Portfolio as low priority, and described AI-assisted maintenance as a future direction. Remaining quantity/date limits, partial reductions, and summary definitions are open.

### Q02 THB conversion and daily profit or loss

Affected: FR-06, FR-10, FR-22.

- FX treatment is resolved: current USD/THB converts both native USD purchase cost and current value, with FX gains/losses excluded. See FR-22.
- What exchange-rate freshness limit and previous-close convention should be used when Thai and US markets are on different dates?
- How are positions added today handled in daily movement? Purchase fees and dividends-received returns are excluded from FR-22. Should stock splits be handled only through manual corrections in this scope?

The confirmed formula, labels, and numerical acceptance example are in [FR-22](final/functional-requirements.md#fr-22-current-fx-valuation).

**Proposed daily rule:** Compare currently held quantities at current price and each stock's previous regular-session close, using the same current FX for both. Label this as daily price movement of current holdings. Resolve same-day additions and exchange session/date labels, then add a fixed acceptance example. Do not mix THB and USD by summing them directly.

Answer: Partially resolved on 6 November 2026. The owner selected current FX with FX gains/losses excluded. The daily-price baseline and data freshness details remain open.

### Q03 Access, persistence, and languages

Affected: FR-07, FR-09, FR-14, FR-17, FR-20, FR-21.

- The Phase 1 prototype allows visitors to use Home, Stock Detail, and both AI chat entry points without signing in. The final account-based version requires sign-in for main and stock-bound chat and for saving account-private data. Guests can browse shared content. The sign-in method remains open. [FR-21](final/functional-requirements.md#fr-21-access-and-languages)
- Phase 1 visitor chat history lasts for the current browser session, with no cross-session or device restoration. [Phase 1 chat requirements](phase-1-planning/functional-requirements.md#chat-and-access)
- In the final version, signing in allows users to opt into saved chat history under [FR-14](final/functional-requirements.md#fr-14-general-financial-questions-and-comparison). Which account features must restore data across devices, including saved chat history? Which Watchlist and Portfolio data must persist across sessions?
- Is guest access to discovery allowed when discovery is introduced?

Answer: Partially resolved on 6 November 2026. The owner confirmed account-free AI chat in Phase 1 and account-required AI chat in the later account-based version. Phase 1 history lasts for the current browser session. Q05 records the rules for combined and stock-linked history. On 7 November 2026, the owner clarified that Phase 1 ships a Thai interface. The English interface, selector, and locale persistence belong to a later release. Phase 1 includes Thai and English shared summaries and chat in the requested language. See [FR-21](final/functional-requirements.md#fr-21-access-and-languages).

### Q04 Supported data and stock coverage

Affected: FR-01-FR-03, FR-05, FR-07-FR-08, FR-12, FR-15-FR-16.

- Instrument scope is resolved: Thai/US common stocks only, excluding preferred shares, warrants, DW, DR/DRx and the other asset classes excluded in section 1 of the requirements. Exact exchange/data coverage remains open.
- Required financial-data scope is resolved: 1D/1M/1Y/5Y charts, annual and quarterly income statement/balance sheet/cash flow within up to four years of available history, and P/E, P/BV, ROE, D/E, dividend yield, and market cap. Required unavailable data must be clearly identified. Phase 1 summaries use price/volume only; RSI/MACD/EMA are not required.
- Stock Detail quote refresh is resolved: page open or explicit visitor request, with no automatic minute polling and no quote-triggered daily-summary regeneration. Later Watchlist refresh interval, historical news range, and upcoming-event feed ordering remain open.
- Define minimum data needed to show or analyze a stock, stale-data labels, and behavior if a provider cannot serve a supported stock. Is dropping an otherwise valid result acceptable?

- Filing and financial data source selection is resolved. Use US SEC EDGAR and Company Facts for US filings and figures. Use Thai SEC iDISC and verified copies of issuer filings for Thai evidence and figures. The SEC Open Data One Report API is a possible annual supplement. SET structured feeds remain under evaluation. Yahoo Finance remains the initial market data provider. [ADR 0003](adr/0003-market-data-and-news-provider-selection.md#filings-and-fundamentals)
- Filing ingestion timing is resolved. Check US filings hourly from 06:00 through 23:00 Eastern time on weekdays. Check Thai filings at 09:00, 14:00, and 22:00 Bangkok time on weekdays. [FR-12](final/functional-requirements.md#fr-12-financial-data-and-news)
- The [Phase 1 filing pilot](phase-1-planning/functional-requirements.md#fr-12-financial-data-and-filings) is resolved. Start with AAPL, JPM, WMT, ADVANC, KBANK, and PTT. Seed the latest annual filing, latest available interim filing, and matching prior-year interim filing for each issuer. Verify permissions for the intended use before enabling a news source. Exact Brief feeds and broader issuer coverage remain open. [FR-03](final/functional-requirements.md#fr-03-daily-brief-content-and-publication) · [FR-12](final/functional-requirements.md#fr-12-financial-data-and-news)

Answer: The owner confirmed the data views, instrument scope, and Stock Detail refresh behavior on 6 November 2026, authorized the filing and financial data sources on 20 November 2026, and confirmed filing timing and the six-issuer and official-release pilot on 21 November 2026. Source permission checks, coverage beyond the pilot, minimum usable data, acceptable source delay, and later Watchlist and event-feed details remain open.

### Q05 Chat and discovery boundaries

Affected: FR-13-FR-16.

- History views and association are resolved: main chatbot history includes both entry points; Stock Detail shows only explicitly stock-linked conversations, excluding general chats that merely mention the stock. An origin label is a presentation option. Phase 1 retention is session-only under Q03.
- File upload, export, a separate Deep Research mode, and long-term user memory are not required by the current feature baseline. They must not be inherited from the old project; adding them would be new scope.
- How many stocks may be compared or returned from discovery? How are discovery results ranked? Which filters are mandatory?
- Exploration mode is the Phase 2 [Stock Discovery workflow](final/functional-requirements.md#fr-15-discovery-plan-and-user-confirmation). Main chat starts the workflow from a request to find stocks or a manual control. Users confirm the displayed plan before screening. Conversation may refine criteria. A separate direct-filter editor is still open.
- The current slide-based guardrails prohibit definitive buy/sell instructions. They remain the baseline unless the owner changes that scope.

Answer: Partially resolved on 6 November 2026. The owner confirmed combined main history, explicitly stock-linked history on Stock Detail, and session-only Phase 1 retention, with a possible stock-page origin label. The source-defined feature and guardrail boundaries remain in force. Measured operating limits and later Discovery detail remain open.

### Q06 Shared content dates and publication

Affected: FR-02-FR-04, FR-11, FR-14.

- The Daily Brief job is scheduled for `:25` every hour, including weekends. Retain the latest successful publication for each past date. Until today's first brief is ready, display the previous day's brief with its actual date. If an attempt cannot publish, keep the last successful brief and report the delay. [FR-03](final/functional-requirements.md#fr-03-daily-brief-content-and-publication)
- On 21 November 2026, the owner confirmed an hourly report in the LLMFA Morning Briefing style. The worker fetches global index observations and approved news feeds directly and calls Gemini once per generation attempt. Supabase holds published briefs, their archive, and job state. The exact benchmarks, feeds, rights, and operating limits remain open. [FR-03](final/functional-requirements.md#fr-03-daily-brief-content-and-publication) · [Market coverage RFC](rfcs/daily-brief-market-coverage.md)
- Daily Brief Q&A context is resolved: support today's brief only, supplied automatically to chat each day. Past briefs are read-only and have no AI follow-up control. If today's brief is not yet available, report its absence; do not attach the previous-day fallback as today's context. This does not prohibit ordinary historical financial research.
- Stock summary publication is resolved: generate on first open each Thai calendar day from latest available data, show as-of time, and keep the published summary unchanged until Thai midnight. An exchange that has not opened does not require an invented same-day opening price.
- Stock summary waiting and generation scope are resolved: until today's summary is published, show the latest earlier summary with its actual date. Generate lazily, only on first open and at most once per listing per Thai date, with no further daily cap. Advance generation, including always producing mega-cap summaries, is deferred; Phase 1 generates no summary without an open.

No historical-brief chat workflow is required. Use the latest successful current-day publication for a new request. Retain actual dates/cutoffs when displaying older conversation messages so an answer from a previous request is not presented as newly generated context.

Answer: Resolved on 6 November 2026. The owner accepted Daily Brief scheduling, latest-version archiving, dated previous-day fallback, and the Thai-calendar-day/latest-data/fixed-daily-stock-summary rule. The owner then required today's-only Daily Brief Q&A with automatic daily context, declining the proposed archived-brief chat workflow. Implementation must keep the previous-day display fallback separate from current-day AI context. On 20 November 2026, the owner chose to show the latest earlier stock summary with its date while today's is prepared, kept generation lazy with no extra daily cap, and deferred advance generation, including mega-cap stocks, to a later improvement. On 21 November 2026, the owner retained the hourly publication schedule and selected direct fetches for the Brief.

### Q07 Personalization and personal-data controls

Affected: FR-14, FR-17-FR-20.

- **Confirmed:** The questionnaire is optional and Investor Profile use is off by default. Turning it off excludes saved profile fields and any earlier messages or summaries that would disclose them from subsequent model inputs. The saved profile follows the separate retention policy. [FR-17](final/functional-requirements.md#fr-17-profile-questionnaire-and-control)
- **Confirmed:** Watchlist and Portfolio are independent, per-question attachments. Earlier attachments do not authorize use in subsequent questions, including through replay of earlier chat history. [FR-20](final/functional-requirements.md#fr-20-personal-context-isolation)
- **Confirmed:** In the final version, keep the current profile until deletion or account closure. Deleting it preserves retained transcripts for viewing, excludes its details from future model requests, removes derived summaries, and offers deletion of affected chats. [FR-17](final/functional-requirements.md#fr-17-profile-questionnaire-and-control)
- **Confirmed:** Signed-in chat saving is opt-in. Unsaved chats last for the browser session. Saved chats expire 90 days after the last message and can be deleted individually or all at once. Account deletion removes both profile and saved chats. [FR-14](final/functional-requirements.md#fr-14-general-financial-questions-and-comparison)
- **Confirmed:** App-controlled backups last at most 30 days. Reapply deletions and enforce expirations before serving a restore. Disclose model-provider retention separately. [FR-20](final/functional-requirements.md#fr-20-personal-context-isolation)
- **Open:** Select the model service approved for private data and confirm its retention terms. Cross-device behavior remains open under [Q03](#q03-access-persistence-and-languages).

Answer: The owner approved the signed-in defaults, per-question attachments, controls on replaying prior context, and final-version retention and deletion rules on 21 November 2026. Phase 1 prototype history remains limited to the browser session under Q03.

### Q08 Release quality and evaluation

Affected: FR-02, FR-03, FR-06, FR-09-FR-11, FR-17-FR-20, FR-22 and quality acceptance.

- Phase 1 gets a capstone prototype running. The end of Phase 2 is the target for the full account-based product. Device and concurrency expectations, measured latency targets, and the operating budget remain open. [Delivery phases](final/final-architecture.md#delivery-phases)
- Phase 1 security release blockers are resolved. Failed session isolation, raw guest prompts in telemetry, or restricted data reaching unpaid Gemini block release. So do unauthorized tool actions or fetches, secret disclosure, unsupported material claims or citations, missing risk warnings, definitive trade instructions or profit guarantees, executable generated content, bypassed usage caps, and failed jobs that overwrite valid publications. Apply the gates in Thai and English. [Phase 1 security release gates](phase-1-planning/functional-requirements.md#release-acceptance)
- Set exact request size, tool-call, retry, and guest concurrency limits. Set measured latency, freshness, and operating-budget targets and agree on the evaluation coverage for them.
- On 21 November 2026, the owner selected FinanceBench for model evaluation with supplied evidence and requested a project-specific Thai and English set for the hybrid search decision. The set size, minimum gain in complete evidence, and operating limits remain open. [Retrieval evaluation](rfcs/financial-evidence-retrieval.md#evaluation-datasets-and-runs)
- Evaluate Portfolio and Investor Profile usage and the effect of their optional AI context. The proposed baseline records task outcomes and aggregate adoption measures. Sample size, observation window, and targets remain open. [Portfolio and Investor Profile usage baseline](final/functional-requirements.md#proposed-portfolio-and-investor-profile-usage-baseline)
- Set provider fetch deadlines and a publication time target for the Daily Brief. Evaluate source coverage, citation accuracy, publication delay, and cost on earnings days, macro-event days, and quiet days. [Daily Brief evaluation](rfcs/ai-workflow-orchestration.md#evidence-needed-to-confirm-the-design)
- What deadline or assessment criteria constrain scope? Which remaining details may be explicitly deferred?

Answer: On 6 November 2026, the owner confirmed Phase 1 as an account-free capstone prototype covering Home, Stock Detail, and AI chat. Watchlist, Profile, and Discovery follow, with Portfolio last. Personal widgets such as Home's portfolio overview ship with their owning feature. On 21 November 2026, the owner approved the Phase 1 guardrails and release blockers and identified the end of Phase 2 as the target for the final design. Quantitative limits, evaluation coverage, budget, and the delivery date remain open.

## Recording an answer

Update the affected requirements and acceptance criteria in the same change as this record. Record the answer, date, and user/source that established it. A product answer alone does not need an ADR. If it leads to a system structure or architectural boundary choice with lasting technical constraints, record that choice and its rationale under the [ADR criteria](adr/README.md). Do not mark a proposed ADR accepted without a decision. A deliberate deferral must state the resulting first-release boundary.
