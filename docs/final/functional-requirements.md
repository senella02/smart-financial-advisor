# Final functional requirements

Version: 2.0 (first finalized requirements baseline for the new project)

Updated: 7 November 2026

Status: Finalized by the project owner.

Smart Financial Advisor helps novice investors with limited time understand market developments, research individual stocks, discover stocks that match their stated interests, and assess their manually recorded holdings. The application provides evidence and explanations so users can make their own decisions.

## 1 Scope and requirement status

The application contains six main areas: Home, My Watchlist, Portfolio, Stock Detail, LLMFA Chat, and Investor Profile. Selectable investments are limited to Thai and US common stocks. Preferred shares, warrants, DW, DR/DRx, ETFs, mutual funds, gold, oil, cryptocurrency, and Forex investing are excluded. Macroeconomic news about excluded markets may still be relevant to the Daily Brief.

Portfolio records are user-entered current holdings, including separate purchase positions. The system does not submit orders or perform real trading. A transaction ledger, sales accounting, realized gains, cash balances, and dividends received are outside the current scope.

The end of Phase 2 is the target for delivering the full account-based product. Watchlist, Investor Profile, and Discovery follow the capstone prototype, with Portfolio last. The [Phase 1 requirements](../phase-1-planning/functional-requirements.md) cover the prototype. AI assistance with maintaining holdings remains outside the current baseline. [Delivery phases](final-architecture.md#delivery-phases)

The main chatbot page shows history from both chat entry points. Stock Detail shows only conversations explicitly linked to that stock through application context.

Shared Daily Brief and stock summaries have Thai and English versions. Chat automatically receives today's Daily Brief as context. Past briefs may be read, but AI Q&A about an archived Daily Brief is outside scope.

Stock Detail refreshes quotes on page open or explicit request. Home refreshes indices every minute.

**Baseline** requirements below reflect the current slides, with recorded project-owner decisions taking precedence. **Proposed detail** sections add precise validation or acceptance rules for review; they are not approved additions. Acceptance scenarios that exercise a proposed detail are also proposed. A **Pending** reference identifies a product rule that must be resolved before the affected acceptance criteria are complete. All acceptance scenarios are specifications, not executed application tests.

Source references use S1 for the current slide deck, S2 for the outdated v1.4 requirements, and S3 for the previous project's final report. [Source notes](../source-notes.md) identify files, page numbers, conflicts, and historical lessons. [Open questions](../requirements-questions.md) contain the outstanding decisions.

## 2 Shared behavior

### FR-01 Supported stock identity

**Baseline:** Stock research, discovery, Watchlist, and Portfolio operate on Thai and US common stocks with the exclusions in section 1. Stock identity includes its market so the system can distinguish similarly named companies and symbols. Exact exchange coverage and the missing-data policy remain in Q04; the common-stock boundary was confirmed by the owner on 6 November 2026.

**Proposed detail:** Validate that a selected instrument is a supported stock before adding it to personal data or presenting it as a discovery result. Explain unsupported or unavailable instruments without substituting another company. A provider's missing record does not by itself establish that the instrument is an unsupported asset.

**Acceptance:** A supported Thai common stock and a supported US common stock can be selected consistently across features. Requests to select an ETF, preferred share, warrant, DW, or DR/DRx receive an explanation of scope. An ambiguous company name prompts clarification rather than a guessed ticker.

Source: S1 pp. 3, 10, 12-14.

### FR-02 Data freshness and incomplete data

**Baseline:** Daily Brief shows its last update and time until the next update. Home market indices refresh every minute; Home portfolio prices follow the same cadence when Portfolio is delivered. Stock Detail quotes refresh on page open or explicit visitor request. Refresh frequency is distinct from the age of the upstream quote.

**Proposed detail:** Show source/as-of information for prices, financial periods, and generated analysis. If data is unavailable, distinguish missing data from zero and identify stale values. Keep available sections usable when another data source fails. Do not display an incomplete portfolio total as a complete valuation.

**Acceptance:** A quote refreshed now with an earlier source timestamp retains that timestamp. A failed refresh preserves the previous successful data with a stale indication. A missing quote is not treated as a zero-priced holding.

Pending: Q04 for exact data coverage, later Watchlist refresh rules, and acceptable upstream freshness. Source: S1 pp. 4-5, 17-18; Stock Detail refresh confirmed by the owner on 6 November 2026. S2 fallback behavior is supporting historical context.

## 3 Home

### FR-03 Daily Brief content and publication

**Baseline:** Publish one shared Daily Brief per `Asia/Bangkok` calendar date and update it hourly. The brief combines a timestamped global stock index snapshot with important news since Bangkok midnight. It explains leading market developments and their potential implications for Thailand where the evidence supports them. Both languages use the same facts, sources, and evidence cutoff. Users who select the same date, language, and publication version see identical content.

**Confirmed publication rules:** Schedule the Daily Brief for `:25` every hour in `Asia/Bangkok`, including weekends. During each run, the worker uses the shared market data adapter to fetch index observations and approved news feeds directly. The worker validates and freezes the inputs, then makes one Gemini call per generation attempt with tool access disabled. The call returns both reading lengths in Thai and English and today's follow-up cards. The Daily Brief uses Supabase for job state, published briefs, and their archive.

Retain the latest successful publication for each past date; browsing older intraday versions is not required. Until today's first brief is ready, display the previous day's latest brief with its actual date and update time. Do not relabel yesterday's content as today's. If no previous brief exists, show a not-yet-published state.

The snapshot includes the Home indices in FR-05 and representative indices from Asia outside Thailand and from Europe. Exact additional benchmarks and feeds remain open. Compare each observation with its previous session close. Show the source timestamp and identify closed markets, delayed data, or unavailable values where applicable. Approved feeds can cover policy, earnings, trade, energy, and other market-moving developments. Attribute a price move to an event only when the evidence supports the link. [FR-05](#fr-05-market-overview) · [FR-19](#fr-19-grounded-answers-and-citations) · [Market coverage RFC](../rfcs/daily-brief-market-coverage.md)

Provide a short version of a few lines and a longer version users can open, each available in Thai and English. Show the last successful update and time until the next scheduled update. Users can select a past date to read its brief. Archived briefs are read-only: no AI follow-up action is available for a past date.

Chat automatically receives today's latest successful Daily Brief when preparing a financial research answer. The visitor does not need to select or paste it. Only today's brief can be used for Daily Brief Q&A. If today's publication is not ready, identify that context as unavailable; do not attach yesterday's fallback as today's brief. This restriction applies to Daily Brief Q&A, not to ordinary historical stock/financial questions.

**Proposed detail:** New updates may consolidate repeated stories and correct earlier content. A successful hourly update replaces the published version atomically; a failure leaves the previous successful version readable and marks the update as delayed. No-news and not-yet-published states have clear messages. Shared brief content excludes personal information.

**Acceptance:** Two users opening the same date, language, and publication version see identical short and full content. Thai and English versions preserve the same material facts, sources, and cutoff. An hourly publication includes newly selected stories within that Thai calendar day. Updates are scheduled on weekends as well as weekdays. Selecting a past date shows that date's latest successful publication without an AI follow-up control. At a new day's rollover, the previous brief remains labeled with its date until today's first brief is ready. An AI request uses today's brief automatically or identifies it as unavailable; it never treats the displayed prior-day fallback as today's context. A failed update does not erase the previous publication or claim a new successful update.

**Market report acceptance:** A Brief job can publish with an empty Supabase news and filing corpus. Each generation attempt uses one Gemini call and supplies only validated index and feed evidence. The worker excludes evidence dated after the cutoff. A successful feed fetch with zero eligible stories still allows a market snapshot update. If a source fails, publish supported coverage with the gap visible when the available evidence supports a valid report. If the attempt cannot publish, keep the last successful Brief with its original timestamp and show the delay.

On a closed-market day, retain the observation time of the last available close and identify the market as closed where known. When a material global development is verifiable, distinguish the observed move from the interpretation and explain implications for Thailand where supported. Leave the cause open when the evidence only establishes the move.

Source: S1 pp. 4-5, 7. The owner confirmed the schedule, archive policy, rollover, bilingual publication, and today's-only chat context. On 21 November 2026, the owner selected direct index and feed fetches and one Gemini call for the report. [Q04](../requirements-questions.md#q04-supported-data-and-stock-coverage) · [Q06](../requirements-questions.md#q06-shared-content-dates-and-publication)

### FR-04 Daily Brief follow-up cards

**Baseline:** Generate follow-up cards from today's Daily Brief topics. Cards suggest useful questions, areas to examine, and possible effects. Selecting a card lets the user ask the AI about the topic, including its effect on Portfolio and Watchlist when those later features are available. Archived briefs and the previous-day fallback have no Daily Brief AI follow-up action.

**Proposed detail:** Selecting a current-day card opens a supported chat entry point with the chosen topic and today's brief context. Personal impact analysis is generated for the requesting user when personal contexts exist. An empty Portfolio or Watchlist produces an appropriate general explanation without invented holdings. A stale card from a previous date does not initiate archived-brief Q&A.

**Acceptance:** Selecting a current-day card about an economic development carries that development into chat without requiring the user to retype it. Selecting a past brief does not expose an AI follow-up control. A request explicitly asking about an archived Daily Brief explains that Daily Brief Q&A supports today only. Another user's holdings never appear in the resulting answer.

Source: S1 pp. 4, 7; today's-only brief Q&A confirmed by the owner on 6 November 2026.

### FR-05 Market overview

**Baseline:** Display SET, SET50, Dow Jones, S&P 500, and Nasdaq index values. Refresh the displayed data every minute.

**Proposed detail:** Include absolute and percentage changes, source/as-of time, and a textual indication of positive or negative movement. Identify closed-market or delayed values where that information is available.

**Acceptance:** All five indices have an available value or an explicit unavailable state. A refresh failure follows FR-02. Price direction remains understandable without relying on color alone.

Source: S1 p. 5. Display details are also present in S2 p. 3; provider feasibility is pending Q04.

### FR-06 Portfolio overview on Home

**Baseline:** Show total portfolio value, unrealized price profit/loss for current holdings against cost converted at current FX, daily price movement in THB and percent against previous closing prices, and the holdings with the strongest movement today. Refresh prices every minute. Price P/L excludes FX gains/losses under FR-22.

**Acceptance:** Adding or editing a holding updates Home and Portfolio consistently. Both THB and percentage daily profit/loss are displayed when the required prices and conversion data exist. An empty portfolio has a clear empty state.

Use the current-FX valuation rule in FR-22. Pending: Q01-Q02 for previous-close baselines and the meaning of strongest movement. Source: S1 p. 5; current-FX rule confirmed by the project owner on 6 November 2026.

## 4 My Watchlist

### FR-07 Watchlist management

**Baseline:** Users can add and remove up to 20 stocks from their Watchlist. Show each stock's price and percentage price change. Watchlist and Portfolio are separate data lists.

**Proposed detail:** A stock appears once per Watchlist. Adding an existing stock does not consume another slot. Reject the 21st distinct stock with an explanation. Removing a stock from Watchlist does not remove a holding, and adding a holding does not silently add it to Watchlist.

**Acceptance:** A user can add 20 distinct stocks, remove one, and add another. Attempting to add a 21st distinct stock leaves the existing list intact. The same stock may independently exist in both Portfolio and Watchlist.

Source: S1 pp. 6, 12. Access follows FR-21; Q03 covers persistence details and Q04 covers refresh frequency.

### FR-08 Watchlist news and events

**Baseline:** Aggregate stock news and relevant economic/company events for watched stocks, including earnings and dividend dates. Show associated stock identities and order the feed from newest to oldest.

**Proposed detail:** News uses publication time; events retain their event date and distinguish scheduled from past events. Label event types rather than treating an ex-dividend date as a payment date. Show a clear state when no relevant items are available.

**Acceptance:** A feed item identifies the stock it concerns and its relevant date. Removing a stock updates the watched-stock feed. Unavailable events are not invented.

Pending: Q04 for historical range and whether upcoming events need a separate order/view. Source: S1 p. 12.

## 5 Portfolio

### FR-09 Manual holding positions

**Baseline:** Users manually add, edit, and delete holdings. Each purchase position records stock identity, quantity held, purchase price per share, and purchase date. Multiple positions in the same stock may have different quantities, prices, and dates. Portfolio provides personal context for risk analysis and AI answers.

This feature does not submit transactions to a broker. The baseline describes manual records of current holdings, not a transaction history. Users may add purchase positions and manually correct their current holdings. AI-assisted maintenance is deferred.

**Proposed detail:** Require a valid supported stock, positive quantity, positive finite purchase price, and a valid purchase date. Identify the price currency. Explain validation errors before saving. Preserve unrelated positions when a user edits or deletes one. Changes become available to subsequent AI requests.

**Acceptance:** Two positions in one stock remain individually editable and aggregate as one stock for stock-count purposes. Deleting one position preserves the other. An invalid quantity does not overwrite a valid position. Changes never mutate Watchlist.

Access follows FR-21. Pending: Q01-Q03 for fractional quantities, date limits, partial reductions, holding limits, and persistence detail. Source: S1 pp. 6-7 and the owner's current-holdings-only decision on 6 November 2026.

### FR-10 Portfolio summary and concentration

**Baseline:** Display total value in THB, number of distinct stocks, number of industries, weighted average dividend yield, and concentration analysis.

**Proposed detail:** Concentration should identify exposure by stock and industry using a declared weighting basis. Explain missing industry classifications and dividend data. Describe holdings as user-entered records rather than verified broker balances.

**Acceptance:** Several positions in one stock count as one distinct stock. Summaries use the same saved holdings and valuation inputs as Home. Missing yield or industry data is visible rather than silently treated as zero.

Use FR-22 for THB conversion and unrealized price P/L. Pending: Q01-Q02 for concentration presentation, dividend-yield basis, missing-data treatment, and daily valuation baselines. Source: S1 pp. 5-6.

## 6 Stock Detail

### FR-11 Shared daily stock summary

**Baseline:** Provide a short daily summary of the selected stock in Thai and English, covering latest financial performance, notable news, price and volume trends, strengths, and risks. Generate the summary on first open each Thai calendar day using the latest available data, show its as-of time, and reuse the published summary unchanged until midnight in `Asia/Bangkok` for all users. Language versions use the same evidence snapshot and preserve the same material facts and risks. A new Thai date becomes eligible for a new summary on first open.

The shared summary is separate from personalized chat. Use financial-report evidence and the latest available market/news data at generation time, retaining their as-of dates and financial periods. Do not require that calendar day's opening quote if the stock's market has not opened or is closed. Refreshing a displayed quote does not regenerate the shared daily summary. The owner confirmed this latest-available-data rule and Thai calendar boundary on 6 November 2026, replacing the older opening-price assumption.

Until today's summary is published, show the stock's latest earlier summary with its actual publication date and as-of time, and indicate that today's summary is being prepared. Never present an earlier summary as today's. Generate summaries only on first open, at most once per listing per Thai date. Advance generation, including always producing summaries for mega-cap stocks, is deferred. The owner confirmed the earlier-summary display, lazy generation, and deferral of advance generation on 20 November 2026.

**Proposed detail:** Show generation time and the as-of date/period of the evidence. Concurrent first requests produce one shared published result. If generation fails, leave financial data, chat, and any earlier summary usable and show a retryable error.

**Acceptance:** Two users opening the same stock, Thai date, and language receive the same published summary with its as-of time, even if a quote or news changes later that day. While today's summary is being prepared or after it fails, a stock with an earlier summary shows that summary labelled with its own date, and a stock without one shows a preparing or retryable state rather than a blank panel. Viewing a stock page does not generate summaries for other stocks. Selecting Thai or English preserves its evidence cutoff and material facts. The first opening after Thai midnight can generate the next day's summary. Closed-market data retains its actual timestamp rather than being described as a new opening price. A personalized chat response does not change the shared summary. Unsupported conclusions are omitted or explicitly qualified.

Source: S1 p. 13; bilingual versions, Thai-day, latest-data, and fixed-daily-publication rules confirmed by the owner on 6 November 2026.

### FR-12 Financial data and news

**Baseline:** Display stock prices, a price chart, financial statements, stock news, and financial metrics alongside the summary and chat. Fetch a quote on page open and provide an explicit quote refresh action; do not automatically poll Stock Detail quotes every minute. The project owner confirmed retaining these older data requirements on 6 November 2026:

- Price-chart ranges: 1D, 1M, 1Y, and 5Y.
- Financial statements: annual and quarterly views within up to four years of available history, including income statement, balance sheet, and cash flow.
- Financial metrics: P/E, P/BV, ROE, D/E, dividend yield, and market capitalization.

These views/fields are required. Clearly identify unavailable data rather than silently removing a required field or fabricating its value.

Show the reporting period, currency, units, and reporting basis for verified statement figures. Link to the supporting filing for figures sourced from a filing. Ratios retain their reporting period or calculation basis. [Filing and financial data sources](../adr/0003-market-data-and-news-provider-selection.md#filings-and-fundamentals)

**Confirmed filing ingestion:** Check US SEC EDGAR hourly from 06:00 through 23:00, inclusive, Monday through Friday in `America/New_York`. Refresh Company Facts for issuers with new or amended filings. Check Thai SEC iDISC and verified issuer sources at 09:00, 14:00, and 22:00 Monday through Friday in `Asia/Bangkok`. Process new and amended filings in either market and retain the last complete version if processing fails. [Q04](../requirements-questions.md#q04-supported-data-and-stock-coverage)

**Proposed detail:** Distinguish an unavailable range or shorter available reporting history from a valid empty result.

**Acceptance:** Users can select each required chart range, switch between annual and quarterly statements within up to four years of available history, and locate each required financial metric. A quote loads when the page opens; an explicit refresh requests an updated quote without regenerating the daily stock summary. Merely leaving Stock Detail open for one minute does not trigger automatic quote polling. Missing history, a missing range, or an unavailable metric has an explicit state; missing values are not replaced with zero. Users can distinguish a current quote from a prior reporting-period figure and inspect evidence underlying the daily summary.

For a statement figure sourced from a filing, users can follow its source link and verify the value using the displayed period, reporting basis, currency, and units.

The US check follows Eastern time across daylight-saving changes. The Thai check follows Bangkok time. A new or amended filing updates the searchable evidence after processing succeeds. An unchanged filing creates no new version, and a failed import leaves the last complete version available.

Source: S1 p. 13 and S2 pp. 3-4 data details retained by the project owner on 6 November 2026. S7 records the 20 November filing source decision. The owner confirmed the filing check schedules on 21 November 2026. Wider provider coverage remains in Q04.

### FR-13 Stock-bound chat

**Baseline:** Users can ask about the stock currently open without repeating its name. Use the same AI capabilities as the main LLMFA Chat, with the selected stock supplied as authoritative application context. Other stocks may be analyzed for comparison only when the user explicitly requests the comparison.

**Proposed detail:** Resolve the selected stock through validated application state. A vague reference such as "its debt" stays bound to that stock. Changing the selected stock must not silently retain the previous stock binding. State the comparison subjects when a comparison is requested.

**Acceptance:** Asking "How were the latest results?" on stock A analyzes A. Asking to compare A with B can retrieve B. Merely encountering B in a news story does not switch the chat's target to B.

**Confirmed history behavior:** Stock Detail displays only the visitor's conversations explicitly linked to the selected stock through application context. These conversations also appear on the main chatbot page. A general-chat mention of a stock does not create a stock-history link. Switching to another stock displays that stock's linked history without changing an existing conversation's stock binding. FR-14 defines the combined session-history view.

Source: S1 pp. 7-9, 13; history views confirmed by the project owner on 6 November 2026.

## 7 LLMFA Chat and stock discovery

### FR-14 General financial questions and comparison

**Baseline:** Main chat supports stock questions, stock comparisons, and stock discovery. Provide prompt shortcuts such as "Help me choose stocks" and "I do not know where to start." Use relevant financial documents, prices, and news to answer.

Both chat entry points automatically include today's published Daily Brief when preparing a financial research answer. If today's brief is unavailable, chat states the limitation when relevant and can still answer from other financial evidence. Chat uses the Investor Profile only when the user enables it. Watchlist and Portfolio context require the user to attach them to the specific question. [FR-03](#fr-03-daily-brief-content-and-publication) · [FR-17](#fr-17-profile-questionnaire-and-control) · [FR-20](#fr-20-personal-context-isolation)

**Final account-based version:** Main chat and stock-bound chat both require sign-in. The server checks authentication before accepting a chat request. Follow-up cards that open chat use the same sign-in rule. [FR-21](#fr-21-access-and-languages)

**Confirmed history behavior:** The main chatbot page displays the visitor's conversations from both the main chatbot and Stock Detail pages. Stock Detail displays only conversations explicitly linked to the selected stock. The same conversation is represented in both views rather than copied into unrelated histories. A text mention of a ticker does not link a general conversation to that stock. An origin label for stock-page conversations is a proposed presentation detail, not an additional required feature.

**Final account-based history:** Saving signed-in chat history is opt-in. Unsaved chats last only for the current signed-in browser session. Saved conversations expire 90 days after their last message. Users can delete one conversation or clear all history sooner. [FR-20](#fr-20-personal-context-isolation)

**Proposed detail:** Clarify ambiguous questions before performing the wrong analysis. Explain unsupported requests and offer a relevant stock/financial-research next step. Comparisons identify companies, metrics, periods, and currencies so differences are interpretable. Show progress and a recoverable failure state during long requests.

**Acceptance:** A user can compare two supported stocks and trace material factual claims to evidence. A user with an empty profile or portfolio can ask a general financial question. Chat can ask for clarification on a broad prompt. After a conversation on stock A's detail page, that conversation appears in both the main history and stock A's history. Stock A's history excludes conversations linked only to stock B and unlinked general chats mentioning A.

**Final account-based acceptance:** A new signed-in browser session does not restore unsaved chats. A saved conversation expires when 90 days elapse after its last message. Deleting one conversation removes it from both history views and preserves unrelated conversations. Clearing history removes the user's saved conversations and current session history from both views.

Language and access follow FR-21. File uploads, exports, a separate Deep Research mode, and long-term user memory are outside the current feature baseline. Comparison limits remain open in Q05 and Q08. Source: S1 pp. 7-10, 14. The owner confirmed combined and per-stock history and explicit stock association on 6 November 2026.

### FR-15 Discovery plan and user confirmation

**Baseline:** Start discovery from a natural-language request or a manual control. Let users choose whether to use Investor Profile or specify new preferences. Ask follow-up questions as needed, translate preferences into concrete screening criteria, and show a search plan for user confirmation before executing it.

Example criteria include market, sector, market capitalization, P/E, EPS, debt, and dividends. The precise supported filter set and units are pending Q04-Q05.

**Proposed detail:** The plan explains the meaning, value, and unit of each filter. Users may edit or cancel it. Search executes only the confirmed version. Do not translate "low risk" into an unexplained numeric filter or treat screening as proof that a stock is suitable.

**Acceptance:** Asking for dividend stocks produces a visible plan before screening. An unconfirmed or cancelled plan does not execute. Changing criteria after confirmation requires confirmation of the changed plan.

Source: S1 p. 14.

### FR-16 Discovery results

**Baseline:** Execute the confirmed screening plan, explain why returned stocks match it, provide source evidence, and let the user add a result to Watchlist.

**Proposed detail:** Display only validated supported stock identities. Explain unavailable screening fields and insufficient company data. An empty result explains that no supported matches were found under the executed criteria and offers plan editing; never relax the plan silently. Adding a result obeys FR-07.

**Acceptance:** Each displayed result corresponds to the confirmed plan and a valid stock. Adding a result to a full Watchlist explains the 20-stock limit. A provider outage is distinguishable from a successful search with zero matches.

Pending: Q04-Q05 for result count, ranking, provider validation, and incomplete-data policy. The old rule to drop every stock missing from yfinance is not an approved business rule. Source: S1 p. 14; S2 p. 4 is historical context.

## 8 Investor Profile

### FR-17 Profile questionnaire and control

**Baseline:** Users can set an Investor Profile and turn its use on or off. The questionnaire captures:

- Investing experience: beginner under 1 year, basic experience 1-3 years, or experienced over 3 years.
- One investing style: dividends, growth, value investing, or short-term speculation.
- Risk tolerance: low, medium, or high.
- Investment horizon: under 1 year, 1-3 years, or over 3 years.
- Interested markets: Thailand, US, or both; optional selection of multiple industries.

**Confirmed account defaults:** The questionnaire is optional. Investor Profile use is off by default and starts only when the user enables it. Turning it off stops profile use in new requests and Discovery defaults. The server also excludes saved profile details carried by earlier messages or summaries when it builds model context. Users can still state preferences in the current conversation. Disabling AI use preserves the saved profile under the applicable retention policy.

**Confirmed retention and deletion:** Keep the current saved profile until the user deletes it or closes the account. Deleting it removes the profile and summaries derived from it. Earlier chat transcripts remain visible to the user while retained under FR-14. Permanently exclude details from the deleted profile from future model context, including details in those transcripts, and offer to delete affected conversations. [FR-20](#fr-20-personal-context-isolation)

**Acceptance:** A signed-in user can skip the questionnaire and use chat. Completing a profile leaves AI use off until the user enables it. A user can change the profile and disable its use. In an existing conversation, the next request after disabling omits saved profile fields and any earlier chat content that would disclose them to the model. Discovery allows custom preferences instead of the saved profile.

**Profile deletion acceptance:** Deleting the profile removes its record and derived summaries and offers deletion of affected conversations. An earlier conversation can still be viewed while it is retained. Continuing that conversation or creating a new profile does not put data from the deleted profile back into a model request.

Pending: Q03 for cross-device behavior. Source: S1 pp. 3, 7, 15-16. The owner confirmed the account defaults and retention rules on 21 November 2026. [Q07](../requirements-questions.md#q07-personalization-and-personal-data-controls)

### FR-18 Profile effects on answers

**Baseline:** Beginners receive plain language, term explanations, and examples. More experienced users receive concise numerical detail. Dividend-focused analysis starts with yield, consistency, and payout ratio; growth-focused analysis with revenue/profit growth; value-focused analysis with valuation and business quality; short-term analysis with price, volume, and recent news. Risk tolerance and horizon guide the emphasis. Every profile sees the main risks.

**Proposed detail:** Personalization changes explanation and emphasis without changing underlying facts, hiding risk, or claiming that an investment is safe. Explicit preferences in the current request take precedence over saved defaults, subject to supported scope.

**Acceptance:** The same evidence can produce a simpler explanation for a beginner and more numerical detail for an experienced user while retaining consistent facts and material risks. Turning personalization off removes profile-driven framing from new context.

Source: S1 pp. 15-16.

## 9 AI evidence and guardrails

### FR-19 Grounded answers and citations

**Baseline:** Support financial factual claims with retrieved evidence and verifiable citations. Treat system instructions separately from user/retrieved data. When evidence is insufficient, state that the information was not found instead of guessing. Check citation quality and retrieve again when supporting evidence is inadequate. Include a risk disclaimer and do not issue definitive buy/sell instructions.

**Proposed detail:** A citation points to the actual source supporting its associated claim. Distinguish sourced facts, deterministic calculations, interpretations, and hypothetical scenarios. Check dates and units before comparisons. Bound retrieval retries. If evidence remains inadequate, provide a limited answer or state that it could not be verified.

**Acceptance:** A missing financial figure is reported as unavailable. A malicious instruction embedded in a retrieved report cannot change application scope or reveal another user's data. A citation to unrelated material does not count as supporting evidence. A request for a guaranteed profitable trade receives research context and risks without a guarantee or definitive trade instruction.

Source: S1 pp. 8-9. Historical citation and arithmetic failures in S3 pp. 43-45 inform the checks. [Q08](../requirements-questions.md#q08-release-quality-and-evaluation)

### FR-20 Personal context isolation

**Baseline:** AI uses the requesting user's personal context and the application-selected stock where applicable. Portfolio and Watchlist remain independent. Shared Daily Brief and stock summaries are common content.

**Proposed detail:** Only an authorized user may access or modify their personal records. Shared outputs and caches must not include private holdings, profile values, or private chat content. Validate user ownership and stock identity outside model-generated text. Do not permit retrieved text or model output to authorize changes to a user's holdings.

**Confirmed account context controls:** For a signed-in request, verify ownership on the server before reading any personal records. Include only relevant Investor Profile fields when profile use is enabled. Include Watchlist or Portfolio context only when the user attaches that data to the current question. Earlier attachments do not authorize reuse on a new request. Apply the same permissions to account data carried by earlier messages and summaries. Send personal context only to a model service whose terms permit that use.

**Confirmed account deletion rules:** Remove deleted or expired chat data and derived summaries from active application storage and future model context immediately. Account deletion removes the profile, saved chats, and their derived summaries. Keep app-controlled backups for at most 30 days. Before serving traffic after a restore, reapply deletions and enforce chat expirations. Disclose the selected model provider's retention terms separately from the app's deletion and backup policy. [Q07](../requirements-questions.md#q07-personalization-and-personal-data-controls)

**Acceptance:** User A cannot retrieve user B's holdings through chat, a record identifier, or shared content. Editing holdings requires a supported user action. A profile change does not regenerate or personalize a shared stock summary.

**Account context acceptance:** When a user attaches their Watchlist to one question, the model receives only the permitted Watchlist context for that question. A subsequent question without the attachment omits Watchlist data, including details carried in earlier messages. Portfolio follows the same rule independently.

**Account deletion acceptance:** A deleted or expired conversation and its summaries are absent from the next history lookup and model request. Account deletion also removes the saved profile and its summaries. A restore from before a deletion or expiry does not make that data visible or usable in model requests. The retention disclosure states the app's backup window and the selected provider's retention terms separately.

Access follows FR-21. Pending: Q03 for sign-in method and cross-device behavior, and Q07 for the model provider approved for private data. Source: S1 pp. 6-9. The owner confirmed the profile and chat deletion rules on 21 November 2026. [Q08](../requirements-questions.md#q08-release-quality-and-evaluation)

## 10 Confirmed access, language, and valuation rules

### FR-21 Access and languages

**Confirmed by project owner on 6 November 2026:** Guests can browse shared content on Home and Stock Detail. Both chat entry points and all account-private data require sign-in in the final version. Discovery access remains open in Q03.

The final interface supports Thai and English with language selection and locale persistence. Users can select Thai or English versions of both Daily Brief reading lengths and daily stock summaries. Chat answers in Thai or English according to the user's request.

**Proposed detail:** Saving Watchlist, Portfolio, Profile, or account-linked chat history prompts sign-in.

**Acceptance:** Guests can browse shared content. Opening either chat entry point or selecting a chat follow-up prompts sign-in. The server rejects unauthenticated requests to chat or account-private records. Users can switch the interface language, select either language for shared publications, and receive chat answers in the requested supported language. Shared variants preserve the same material facts. Translation preserves provider content and shared publications, and Thai text and financial units remain readable.

### FR-22 Current-FX valuation

**Confirmed by project owner on 6 November 2026:** Use the current USD/THB rate to convert both purchase cost and current market value of US positions. Exclude FX gains/losses from P/L. Do not require historical purchase FX or user-entered FX for this scope.

For each position, `q` is quantity, `b` is purchase price per share in the stock's trading currency, `p` is the current quote, and `f` is THB per unit of that currency. For THB positions, `f = 1`; for USD positions, `f` is the same available current USD/THB rate across one valuation snapshot.

- Current value in THB: `sum(q * p * f)`.
- Cost converted at current FX: `sum(q * b * f)`.
- Unrealized price P/L in THB: `sum(q * (p - b) * f)`.
- Unrealized price P/L percent: `100 * unrealized_price_pnl_thb / cost_converted_at_current_fx`, when the denominator is positive.

Label the gain/loss as price P/L with FX excluded, and label converted cost as using current FX. It is not the user's full historical THB investment return. Fees and dividends-received returns are outside this holdings-only calculation.

**Acceptance example:** Ten US shares bought at USD 100, now USD 110, at current FX 34 THB/USD show THB 37,400 value, THB 34,000 converted cost, and THB 3,400 unrealized price gain (10%). A change in FX alone does not create price P/L when `p = b`. A missing FX rate produces an incomplete/unavailable THB valuation rather than silently assuming a rate.

**Proposed daily-change rule:** Use the same current `f` for current value and the previous regular-session close `c` for each stock: daily price change is `sum(q * (p - c) * f)` and percent is `100 * daily_change_thb / sum(q * c * f)`. This measures movement of currently recorded holdings rather than the account's realized trading-day return. Q02 must resolve same-day purchases and market-session/date labels before this daily rule is final.

## 11 Quality and release acceptance

The confirmed update cadences are hourly Daily Brief updates, one-minute refreshes for Home indices and portfolio prices, and page-open or manual refresh for Stock Detail quotes. The Brief fetches its index and news inputs during the hourly run under [FR-03](#fr-03-daily-brief-content-and-publication). Filing ingestion follows [FR-12](#fr-12-financial-data-and-news). Watchlist is limited to 20 stocks. Provider data delay is not a guaranteed application latency.

**Proposed quality baseline:** Keep ordinary data views usable when AI generation fails; expose useful progress and recoverable errors; preserve saved records on failed writes; support keyboard operation, labeled controls, readable financial units, and non-color indicators. Use transport security and keep credentials outside source control. Measurable acceptance targets remain subject to Q08; architectural choices follow the [ADR criteria](../adr/README.md).

Resolve or explicitly defer the open [requirement questions](../requirements-questions.md#decisions-and-remaining-questions) for each feature before release. Run the applicable acceptance scenarios, including bilingual AI and data isolation checks.
