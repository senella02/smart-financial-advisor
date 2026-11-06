# Requirements Sources and Historical Context

Updated: 7 November 2026.

## Source register

### S4 Owner-supplied SFA-5 setup brief

On 7 November 2026 the owner supplied an implementation brief in chat authorizing a fixture-only pnpm/TypeScript monorepo, Next.js App Router UI+BFF, shared Zod contracts, Thai shells, local checks, CI, and an open pull request. This explicitly authorizes setup despite the requirements-phase default; it does not authorize research features, live market/LLM calls, persistence, infrastructure, or deployment. The brief requires ADRs 0006–0009 to remain Proposed and leaves Q04/Q05/Q08 and database/hosting/provider choices open. The original brief is intentionally outside git; the [developer guide](developer-guide.md) records the resulting reviewable setup.

### S1 Current progress slides

[2110488 CAP PROJ I Bi-weekly Progress](../report-documents/2110488%20CAP%20PROJ%20I%20Bi-weekly%20Progress.pdf) has 18 PDF pages. The title page identifies the sixth session as 2 November 2026; the supplied PDF was exported on 6 November 2026. Page numbers below refer to PDF pages.

- Pages 3-6: updated platform areas, hourly Daily Brief, follow-up cards, Home portfolio overview, minute refreshes, and manual Portfolio positions.
- Pages 7-9: AI context in main/stock chat and guardrail requirements. Pages 8 and 9 repeat the same guardrail content; this is one set of requirements.
- Pages 10-12: platform recap, target users, Thai/US scope, older Home/Watchlist descriptions, and 20-stock Watchlist limit.
- Pages 13-14: stock daily summary, financial data, stock-bound chat, and confirmed discovery plan flow.
- Pages 15-16: Investor Profile fields and personalization effects.
- Pages 17-18: candidate data sources and exploratory coverage/latency claims. These do not establish current provider capabilities or contractual data freshness.

### S2 Outdated functional requirements

[Functional Requirements Document v1.4](../report-documents/Functional%20Requirements%20Document%20-%20LLMFA%20v1.4.pdf) has 9 PDF pages and is dated 25 October 2026. It supplies historical detail and possible acceptance scenarios; it is not the new scope authority.

Its implementation-specific cache choices, fixed latency targets, provider fallback rules, exchange lists, financial-history depth, and zero-portfolio rule require reconciliation. A precise old requirement is not automatically a current commitment. The owner subsequently retained the chart ranges, four-year statement history, and listed financial metrics; other historical details remain subject to review.

### S3 Previous LLMFA final report

Local reference: `/Users/thpalanand/Repo/llmfa-capstone/llmfa-final-report.pdf`, 55 PDF pages. It describes the previous project's motivation, implementation, evaluation, and lessons. It is background for the new project, not a requirement to reproduce the previous app.

Relevant sections inspected for this baseline:

- Pages 7-11: evidence-based financial Q&A, mixed structured/unstructured sources, Thai/English context, and freshness problems.
- Pages 21-28: historical architecture, components, deployment, and design tradeoffs.
- Page 34: rate limits, tool argument failures, a historical model/tool integration constraint, and ingestion cost.
- Pages 35-38: earlier chat, Morning Briefing, and Deep Financial Research interfaces.
- Pages 43-45: dated evaluation results and the report's discussion of arithmetic/interpretation errors, static ground-truth limitations, and broken citations.
- Pages 51-52: previous deliverables and future work.

The report's historical accuracy and comparative claims do not establish new-project performance. Its provider/model constraints may have changed and must be checked against current primary documentation if relevant.

## Project-owner answers recorded on 6 November 2026

- Portfolio tracks current holdings only and allows separate purchase positions. It is low priority. AI-assisted portfolio maintenance is a future direction.
- Use current USD/THB for cost and current value, excluding FX gains/losses from reported price P/L.
- Use a Thai UI and support both Thai and English AI interactions.
- Phase 1 has no login system and opens Home, Stock Detail, and AI Q&A/comparison to visitors. In the future account-based version, AI chat and saving account-private data require sign-in; shared content remains browsable.
- Main chatbot history includes conversations from both the main and Stock Detail pages; stock pages show history for that stock. A stock-page origin label is an optional presentation idea, not a committed extra feature.
- Phase 1 history lasts only for the current browser session. Stock-page history includes only explicitly stock-linked conversations; mentioning a stock in general chat does not create that link.
- Retain 1D/1M/1Y/5Y charts, up to four years of statements, and P/E, P/BV, ROE, D/E, dividend yield, and market cap, with clear unavailable-data states.
- Provide both annual and quarterly statement views within the available history.
- Selectable investments are Thai/US common stocks only, excluding preferred shares, warrants, DW, DR/DRx and the already excluded asset classes.
- Daily Brief updates hourly every day and retains the latest publication for each past date. Show the dated previous-day brief until today's first publication is ready.
- Generate stock summaries on first open per Thai calendar day using latest available data and an as-of time; keep the published summary unchanged until Thai midnight. This supersedes the opening-price assumption in the old material.
- Shared Daily Brief short/full content and stock summaries have Thai and English versions; chat answers in the requested supported language.
- Daily Brief Q&A is available only for today, with today's brief automatically attached as chat context. Archived briefs are read-only. This replaces the suggested archived-brief follow-up workflow; the dated previous-day display fallback is not today's AI context.
- Phase 1 targets a capstone prototype/demonstration. Stock Detail quotes refresh on page open or explicit visitor request, not by minute polling. Initial stock-summary trend analysis uses price and volume only; RSI/MACD/EMA are not required.
- Implement Home, Stock Detail, and reliable AI Q&A first; Watchlist, Profile, and Discovery next; Portfolio last, including its Home widget.

These answers supersede conflicting source details. Remaining subquestions and proposed semantics are recorded in [the question record](requirements-questions.md).

## Source conflicts reconciled

These interpretations follow the explicitly updated feature pages. They remain reviewable as part of requirements finalization.

### Daily Brief replaces the morning-only model

S1 pp. 4-5 describe news from Thai midnight, updated hourly, with short/full versions and historical browsing. S1 pp. 10-11 still say Morning Brief; S2 pp. 2-3 specify a 06:00 generation. The draft follows the hourly Daily Brief. It does not carry forward a 06:00-only schedule or a once-per-day publication cache.

### Portfolio is now in scope

S1 pp. 5-7 add personal holdings, multiple positions, summary metrics, and AI context. S1 p. 12 retains "no portfolio data" in its Watchlist recap; S2 pp. 3 and 7 prohibit storing it. The draft treats the prohibition as superseded and preserves separation of Watchlist from Portfolio.

### Minute polling does not establish real-time quotes

S1 p. 5 asks for one-minute refreshes, while p. 17 describes delayed data. These are compatible only if the UI distinguishes application refresh time from the provider's quote timestamp. Exact delays and coverage have not been independently verified.

### Shared content and personal answers have different boundaries

S1 pp. 4 and 13 say briefs/stock summaries are shared. Page 7 adds personal context to chat. The draft preserves common published content and personal follow-up analysis so holdings cannot leak into a shared summary.

### Guardrail outcomes do not select the framework

S1 pp. 8-9 name LangGraph and FastAPI while describing intent handling, ticker binding, grounding, and citation checks. The user's current instruction permits a fresh architecture and tool selection. The draft preserves those observable safeguards without selecting those frameworks or promising that a confidence score proves correctness.

### Provider names do not establish a final data contract

S1 pp. 5, 11, 13 and 17 refer to overlapping provider combinations. S2 p. 4 also drops stocks absent from yfinance. The new requirements define supported-data behavior first. Provider feasibility, source attribution, coverage, and missing-data handling need a new decision; no tool-specific drop rule has been promoted to a business requirement.

## Lessons retained from the previous project

- Keep original source links, dates, company identities, financial periods, and units with evidence. Historical citation failures motivate checking support as well as URL formatting.
- Use explicit financial formulas and fixed examples. The old report's interpretation/arithmetic failures are a reason to test calculations independently of fluent prose.
- Evaluate time-sensitive answers against dated source evidence; static placeholder answers can misjudge live-data responses.
- Make retrieval/tool failures visible and bounded. Rate limits and ingestion cost are design inputs, not reasons to inherit the previous orchestration stack.
- Reuse shared published reports where the product requires common content. Personal context must stay private.

## Selective reuse boundary

No old application code or assets were copied during this phase. No file-by-file implementation reuse audit has been performed.

Potential candidates to inspect when implementation is authorized include source-identity metadata, relevant financial test questions, validated calculations, isolated retrieval/parsing utilities, and useful fixture documents. Each candidate must fit the current scope, have understandable provenance/dependencies, avoid credentials/personal data, and save effort after adaptation and tests.

Do not inherit the old UI, Deep Research feature, broad asset coverage, model routing, databases, multi-platform deployment, generated indexes, or monthly data ingestion merely because they exist. No decision about keeping or replacing a specific implementation has been made.
