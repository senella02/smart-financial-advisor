# Remaining Requirement Questions

Updated: 7 November 2026. Recorded answers below come from the project owner in the requirements kickoff. Subquestions remain open unless resolved explicitly. These questions clarify the finalized feature set; they do not propose an additional feature backlog.

## Baseline finalization

On 7 November 2026, the project owner finalized the first [requirements baseline](functional-requirements.md). The answers below record which product decisions are settled and which still need review.

## Review focus

The [Phase 1 scope](functional-requirements.md#1-scope-and-requirement-status) is agreed. Remaining detail concerns data coverage/freshness, measured operating limits, evaluation targets, and later features.

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

The confirmed formula, labels, and numerical acceptance example are in [FR-22](functional-requirements.md#fr-22-current-fx-valuation).

**Proposed daily rule:** Compare currently held quantities at current price and each stock's previous regular-session close, using the same current FX for both. Label this as daily price movement of current holdings. Resolve same-day additions and exchange session/date labels, then add a fixed acceptance example. Do not mix THB and USD by summing them directly.

Answer: Partially resolved on 6 November 2026. The owner selected current FX with FX gains/losses excluded. The daily-price baseline and data freshness details remain open.

### Q03 Access, persistence, and languages

Affected: FR-07, FR-09, FR-14, FR-17, FR-20, FR-21.

- Phase 1 access is resolved: no login system, with Home, Stock Detail, and AI Q&A and comparison open to visitors. In the later account-based version, AI chat requires an account, guests may browse shared content, and saving account-private data requires sign-in. The sign-in method remains open.
- Phase 1 visitor chat history lasts for the current browser session, with no cross-session or device restoration.
- When introduced later, must Watchlist, Portfolio, Profile, and account-linked chat history persist across devices/sessions?
- Is guest access to discovery allowed when discovery is introduced?

Answer: Partially resolved on 6 November 2026. The owner confirmed account-free AI chat in Phase 1 and account-required AI chat in the later account-based version. Phase 1 history lasts for the current browser session. Q05 records the rules for combined and stock-linked history. On 7 November 2026, the owner clarified that Phase 1 ships a Thai interface. The English interface, selector, and locale persistence belong to a later release. Phase 1 includes Thai and English shared summaries and chat in the requested language. See [FR-21](functional-requirements.md#fr-21-access-and-languages).

### Q04 Supported data and stock coverage

Affected: FR-01-FR-02, FR-05, FR-07-FR-08, FR-12, FR-15-FR-16.

- Instrument scope is resolved: Thai/US common stocks only, excluding preferred shares, warrants, DW, DR/DRx and the other asset classes excluded in section 1 of the requirements. Exact exchange/data coverage remains open.
- Required financial-data scope is resolved: 1D/1M/1Y/5Y charts, annual and quarterly income statement/balance sheet/cash flow within up to four years of available history, and P/E, P/BV, ROE, D/E, dividend yield, and market cap. Required unavailable data must be clearly identified. Phase 1 summaries use price/volume only; RSI/MACD/EMA are not required.
- Stock Detail quote refresh is resolved: page open or explicit visitor request, with no automatic minute polling and no quote-triggered daily-summary regeneration. Later Watchlist refresh interval, historical news range, and upcoming-event feed ordering remain open.
- Define minimum data needed to show or analyze a stock, stale-data labels, and behavior if a provider cannot serve a supported stock. Is dropping an otherwise valid result acceptable?

The initial upstream and known fundamentals gap are recorded in [ADR 0003](adr/0003-market-data-and-news-provider-selection.md). Required coverage and acceptable source delay remain open product decisions.

Answer: Partially resolved on 6 November 2026. The owner retained the chart ranges, statement-history depth, and financial metrics, confirmed annual/quarterly views and clear unavailable-data states, common-stock-only scope, page-open/manual Stock Detail quote refresh, and price/volume-only initial analysis. Exact exchange/data coverage, acceptable upstream freshness, and later Watchlist/event-feed details remain open.

### Q05 Chat and discovery boundaries

Affected: FR-13-FR-16.

- History views and association are resolved: main chatbot history includes both entry points; Stock Detail shows only explicitly stock-linked conversations, excluding general chats that merely mention the stock. An origin label is a presentation option. Phase 1 retention is session-only under Q03.
- File upload, export, a separate Deep Research mode, and long-term user memory are not required by the current feature baseline. They must not be inherited from the old project; adding them would be new scope.
- How many stocks may be compared or returned from discovery? How are discovery results ranked? Which filters are mandatory?
- The current slide-based discovery flow shows the search plan before execution and requires confirmation. Conversation may refine criteria; a separate direct-filter editor is not a committed requirement.
- The current slide-based guardrails prohibit definitive buy/sell instructions. They remain the baseline unless the owner changes that scope.

Answer: Partially resolved on 6 November 2026. The owner confirmed combined main history, explicitly stock-linked history on Stock Detail, and session-only Phase 1 retention, with a possible stock-page origin label. The source-defined feature and guardrail boundaries remain in force. Measured operating limits and later Discovery detail remain open.

### Q06 Shared content dates and publication

Affected: FR-02-FR-04, FR-11, FR-14.

- The Daily Brief publishes hourly, including weekends. Retain the latest successful publication for each past date. Until today's first brief is ready, display the previous day's brief with its actual date. The archive offers one version per date.
- Daily Brief Q&A context is resolved: support today's brief only, supplied automatically to chat each day. Past briefs are read-only and have no AI follow-up control. If today's brief is not yet available, report its absence; do not attach the previous-day fallback as today's context. This does not prohibit ordinary historical financial research.
- Stock summary publication is resolved: generate on first open each Thai calendar day from latest available data, show as-of time, and keep the published summary unchanged until Thai midnight. An exchange that has not opened does not require an invented same-day opening price.

No historical-brief chat workflow is required. Use the latest successful current-day publication for a new request. Retain actual dates/cutoffs when displaying older conversation messages so an answer from a previous request is not presented as newly generated context.

Answer: Resolved on 6 November 2026. The owner accepted Daily Brief scheduling, latest-version archiving, dated previous-day fallback, and the Thai-calendar-day/latest-data/fixed-daily-stock-summary rule. The owner then required today's-only Daily Brief Q&A with automatic daily context, declining the proposed archived-brief chat workflow. Implementation must keep the previous-day display fallback separate from current-day AI context.

### Q07 Personalization and personal-data controls

Affected: FR-17-FR-20.

- Is the questionnaire optional, and is profile use enabled or disabled by default?
- When profile use is disabled, should existing chat history containing profile details be excluded or should the change affect only new conversations? Is turning it off different from deleting the profile?
- Can users prevent Portfolio or Watchlist from being sent to AI, or is that always part of the feature? What happens if a new request removes previously used context?
- What personal-data deletion and retention controls are required when the account-based personal features are introduced? Phase 1 session-history duration is already resolved.

**Proposed starting point:** Profile use is optional and visible; disabled values are omitted from new context. Private user data never enters shared briefs/summaries. Do not promise removal from old conversation history without defining how it works.

Answer: Pending.

### Q08 Release quality and evaluation

Affected: FR-02, FR-19-FR-20 and quality acceptance.

- Delivery target is resolved: Phase 1 is a capstone prototype/demonstration. Device/concurrency expectations, measured latency targets, and operating budget remain to be set when designing and evaluating the implementation; no production service level has been committed.
- What level of citation, financial-calculation, scope, and prompt-injection testing is required for acceptance? Which failures block release?
- What deadline or assessment criteria constrain scope? Which remaining details may be explicitly deferred?

Answer: Partially resolved on 6 November 2026. The owner confirmed Phase 1 as an account-free capstone prototype covering Home, Stock Detail, and AI chat. Watchlist, Profile, and Discovery follow; Portfolio is last. Personal widgets such as Home's portfolio overview follow their owning feature rather than being required in Phase 1. This does not remove later features from the target requirements or establish a release date. Quantitative quality targets, evaluation details, budget, and delivery date remain open.

## Recording an answer

Update the affected requirements and acceptance criteria in the same change as this record. Record the answer, date, and user/source that established it. A product answer alone does not need an ADR. If it leads to a system structure or architectural boundary choice with lasting technical constraints, record that choice and its rationale under the [ADR criteria](adr/README.md). Do not mark a proposed ADR accepted without a decision. A deliberate deferral must state the resulting first-release boundary.
