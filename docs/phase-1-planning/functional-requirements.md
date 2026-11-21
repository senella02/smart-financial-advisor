# Phase 1 functional requirements

The project owner confirmed the capstone scope on 6 and 7 November 2026 and approved the pilot corpus and security release gates on 21 November 2026. The [question record](../requirements-questions.md) tracks decisions and open details.

## Scope

The capstone demo uses shared Home content and the Daily Brief, Stock Detail, and AI Q&A and comparison in both chat entry points. It uses guest chat, browser-session history, and a Thai interface.

The demo excludes Watchlist, Investor Profile, Discovery, Portfolio, and Home's portfolio overview. Daily Brief follow-ups give general explanations without inventing holdings. Shared publications and chat support Thai and English.

## Shared requirements and acceptance

Apply the relevant shared behavior and acceptance scenarios below with the Phase 1 rules on this page. The linked requirements retain their baseline, proposed, and pending status.

| Area | Shared requirements |
| --- | --- |
| Stock identity and timestamps | [FR-01 and FR-02](../final/functional-requirements.md#2-shared-behavior) cover Thai and US common stocks, market identity, source timestamps, and unavailable data. |
| Home | [FR-03 through FR-05](../final/functional-requirements.md#3-home) cover the Daily Brief, current-day follow-ups, the archive, and one-minute index refresh. |
| Stock Detail | [FR-11 through FR-13](../final/functional-requirements.md#6-stock-detail) cover first-open summaries, page-open or manual quote refresh, financial data, news, and stock-bound chat. |
| Chat | [FR-13 and FR-14](../final/functional-requirements.md#fr-13-stock-bound-chat) cover grounded Q&A and comparison, today's automatic Daily Brief context, combined main history, and explicitly stock-linked history. |
| Evidence and quality | [FR-19](../final/functional-requirements.md#fr-19-grounded-answers-and-citations) covers grounding and citations. Apply the applicable [quality criteria](../final/functional-requirements.md#11-quality-and-release-acceptance). |

## Daily Brief and Stock Detail pilot

### FR-03 Daily Brief sources

During the hourly run, the worker fetches global stock index observations and approved news feeds through the shared market data adapter. Enable sources after confirming terms for automated fetching, publication, and the intended AI use. Keep the original URL and source timestamp. The worker sends the validated inputs to Gemini in one call and stores the published result and job state in Supabase. [FR-03](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication) · [Market coverage RFC](../rfcs/daily-brief-market-coverage.md)

### FR-11 Shared daily stock summary

Use price and volume for technical analysis. RSI, MACD, EMA, and other technical indicators are outside Phase 1. Generate only on first open, at most once per listing per Thai date, with no further daily cap. While today's summary is being prepared, show the latest earlier summary with its actual publication date and as-of time.

### FR-12 Financial data and filings

**Confirmed Phase 1 filing pilot:** Start with AAPL, JPM, and WMT in the US and ADVANC, KBANK, and PTT in Thailand. Seed each issuer with its latest filed annual report, latest available interim filing, and the corresponding prior-year interim filing. Use US 10-K and 10-Q filings with Company Facts for standard financial figures. Use Thai 56-1 One Reports, audited annual statements, and reviewed interim statements with management's discussion where available. Confirm the source terms for ingestion and intended use. The pilot validates extraction and citations before expanding toward the required statement history. [Q04](../requirements-questions.md#q04-supported-data-and-stock-coverage)

For each pilot issuer, verify the seed documents against the issuer, actual fiscal period, and reporting basis in the source. The latest interim and prior-year comparison use corresponding fiscal periods. Unavailable or unapproved filings have an explicit gap and add no substitute evidence from another issuer or period.

## Chat and access

### FR-14 General financial questions and comparison

**Phase 1 prototype:** Both chat entry points use guest access and keep conversations for the current browser session. Users can switch between entry points during that session. A new session starts with empty history.

**Prototype acceptance:** Guests can open both chat entry points and see their conversations while navigating within the same browser session. A new session starts with empty history.

### FR-21 Access and languages

**Prototype acceptance:** As confirmed on 6 and 7 November 2026, guests can open Home, Stock Detail, and both chat entry points. Navigation, page labels, metadata, and accessibility labels render in Thai. Pages declare Thai as the document language and omit the interface-language selector. Shared publications and chat support Thai and English. See FR-14 for browser-session history.

## Evidence and session isolation

### FR-19 Grounded answers and citations

**Confirmed Phase 1 guardrails:**

- Validate chat requests and tool arguments on the server. Resolve the issuer, reporting period, and cutoff in code. The model can use only approved read-only tools. Treat browser history and retrieved text as untrusted data. Keep credentials on the server, and limit ingestion to configured sources with fetch size and time limits.
- Verify that cited passages support material claims before displaying an answer or publishing a brief or stock summary. Check relevant figures, units, periods, and reporting basis. Include the risk warning and state any evidence gap. Definitive buy or sell instructions and profit guarantees are prohibited.
- Disable raw HTML in generated content and allow only safe citation URL schemes. Enforce request size, tool-call, retry, and guest concurrency limits on the server. [Q08](../requirements-questions.md#q08-release-quality-and-evaluation) tracks the values for those limits.

**Phase 1 acceptance:** In Thai and English, check that adversarial messages or retrieved content cannot cause unauthorized actions, fetches, or secret disclosure. Check that material claims with fabricated figures or unsupported citations are withheld, including claims based on the wrong issuer, period, reporting basis, or source. Financial guidance includes the required risk warning. Generated markup stays inert and unsafe citation URLs are rejected. Oversized requests and requests that exceed tool, retry, or concurrency limits are stopped with a clear response.

### FR-20 Personal context isolation

The prototype has no account-based personal context. A visitor's chat history belongs to that visitor.

**Confirmed Phase 1 guardrails:** Keep prototype guest chat history within the browser session. Keep chat text out of shared publications, caches, logs, and traces. Check the current message and any history before forwarding them to the model. While using unpaid Gemini, prevent sensitive, confidential, or personal information from reaching it. The prototype must demonstrate this restriction before exposing open-ended guest chat on that service. A controlled demonstration can use public-data prompts. [Gemini API terms](https://aistudio.google.com/docs/terms#data-use-unpaid)

**Phase 1 acceptance:** Use synthetic markers in two independent sessions. Each visitor sees only their session's conversations, even when another session knows the stock or conversation identifier. Session markers and raw prompts are absent from shared briefs, stock summaries, caches, logs, and traces. Synthetic private data in a message or its history is blocked before an unpaid Gemini request.

## Release acceptance

Evaluate the capstone demo against the applicable functional acceptance scenarios. Production availability and concurrency targets remain open.

**Phase 1 security release gates:** The Phase 1 acceptance checks in [FR-19](#fr-19-grounded-answers-and-citations) and [FR-20](#fr-20-personal-context-isolation) must pass. A failed publication job that overwrites the last valid brief or stock summary also blocks release. When evidence is missing, a response that reports the gap passes the security check. When an update is delayed, the last successful publication remains available with its original timestamp and the delay is visible. [Q08](../requirements-questions.md#q08-release-quality-and-evaluation) · [FR-03](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication) · [FR-11](../final/functional-requirements.md#fr-11-shared-daily-stock-summary)
