# Phase 1 UI conventions

These conventions guide the next implementation of Home, Stock Detail, and chat. They describe a design target, not delivered behavior. Existing screens, components, and fixtures are disposable implementation material. [DESIGN.md](../DESIGN.md) owns the visual language; this document owns shared interaction and content conventions. Route composition belongs in the [Home](../apps/web/.impeccable/surfaces/src-app-page-tsx.md), [Stock Detail](../apps/web/.impeccable/surfaces/src-app-stocks-market-symbol-page-tsx.md), and [chat](../apps/web/.impeccable/surfaces/src-app-chat-page-tsx.md) briefs.

The [functional requirements](functional-requirements.md) remain authoritative. A convention below selects a presentation, not a new product capability or approval of every **Proposed detail** in the baseline. Unresolved product rules remain in the [question record](requirements-questions.md). No provider coverage, latency, or data freshness threshold is established here.

## Requirement boundaries

- **FR-01:** Display market, symbol, and company name together at stock selection and research entry points. Thai and US common stocks are the supported investment scope. An index in the Home overview is context, not a selectable investment. Search is an entry to Stock Detail, not discovery screening.
- **FR-02, FR-05:** Home includes SET, SET50, Dow Jones, S&P 500, and Nasdaq. Its minute refresh cadence is separate from upstream data age. A quote's source time remains visible after a refresh.
- **FR-03, FR-04:** Daily Brief has a Bangkok calendar date, short and full views, Thai and English publication versions, last successful update, next scheduled update, and a past-date selector. Only today's published brief offers AI follow-up cards. Yesterday's fallback keeps yesterday's date and offers no brief follow-up action.
- **FR-11, FR-12:** Stock Detail includes the fixed daily bilingual summary, quote, price chart, financial statements, metrics, news, and stock-bound chat. Quote refresh is page-open or manual. It never implies daily-summary regeneration.
- **FR-13, FR-14:** Main history combines both chat entry points. Stock history includes only conversations explicitly linked through application context. History lasts for the current browser session, with no login requirement.
- **FR-19, FR-20:** Keep factual claims traceable to evidence, missing information explicit, risks visible, and visitor conversations separate from shared publications. Do not present definitive buy/sell instructions.
- **FR-21:** Phase 1 UI, metadata, and accessible labels are Thai. UI strings use matching Thai and English dictionary keys. Publication-language controls affect only the shared publication. They are not an interface-language selector. Chat follows the requested supported answer language.

Do not display empty or locked navigation for Watchlist, Portfolio, Investor Profile, or discovery. Do not add account controls, uploads, exports, Deep Research, broker actions, or restoration of earlier sessions. The full baseline retains later features; their UI is outside this pass.

## Navigation and orientation

Use a shared top navigation with **หน้าหลัก**, **ค้นหาหุ้น**, and **ถาม AI**. The stock-search control opens a labeled search region rather than navigating to a demo ticker. Search results identify company, symbol, and market. An ambiguous result requires an explicit selection; no guessed company or invented coverage claim.

Links navigate. Buttons change state or perform actions. The current route has a persistent visible and programmatic current state. Keep a skip link, one main landmark, one page heading, and ordered section headings. Support browser Back and direct links. A stock page starts with its identity and a route back to Home or search.

On small screens, wrap the same navigation into two rows rather than hiding it behind an unlabeled icon. Stock search occupies a full row when necessary. Language, date, range, and statement controls remain beside the section they affect.

## Publications, dates, and freshness

Use distinct labels for distinct clocks:

- **ข้อมูล ณ** identifies a source observation or evidence cutoff. Keep its date, time, and time zone where available. A report also names its financial period.
- **เผยแพร่เมื่อ** identifies when the application published generated content.
- **ตรวจสอบล่าสุด** identifies the application's last successful fetch. It never replaces the source time.
- **อัปเดตครั้งถัดไป** identifies a scheduled Daily Brief update. After a missed update, show that the update is delayed rather than counting below zero or claiming a successful update.

Use `Asia/Bangkok` for publication dates and Thai-day boundaries. Display an explicit Gregorian year in date controls and full timestamps, with a Thai label identifying ค.ศ. Retain exchange-session dates when relevant. Do not imply that a US session and the Thai calendar day are identical. Source date-only values stay date-only; never manufacture midnight or an observation time.

Keep an absolute timestamp available beside any relative age. Avoid an unqualified "live" badge. Closed-market, provider-delay, or stale labels require known metadata or the policy eventually resolved under Q04. A failed refresh can state **อัปเดตไม่สำเร็จ แสดงข้อมูลล่าสุดที่มี** without inventing an age threshold.

Daily Brief language uses a labeled **ภาษาเนื้อหา** control with **ไทย** and **English**. Mark the English publication region with the correct language attribute. Short/full controls change reading depth within the same publication. Date changes select the latest successful publication for that date, not an intraday version browser.

Today, previous-day fallback, archive, not-yet-published, and update-failed are distinct presentations. Selecting an archive removes brief-specific AI controls. General chat remains available for ordinary historical financial research. A new chat request uses today's available brief independently of the date being read on Home. If today's brief is absent, explain that limitation when relevant.

An update notice must not move keyboard focus, reset an expanded article, or replace text under a reader mid-sentence. Keep the displayed snapshot and offer to load the newer publication. When accepted, update the content, dates, language pair, and sources together. This is a reading convention, not a change to the hourly publication schedule.

## Financial information

Prices show their trading currency as THB or USD. Indices show points, not a currency. Statements identify currency, scale, annual or quarterly basis, and reporting period in their caption. A compact market-cap label must have its exact magnitude available without hover. Do not infer a metric's period or basis from its name.

Right-align comparable numbers and use tabular figures where the chosen font supports them. Keep a consistent precision within one field and retain source precision in accessible detail when formatting rounds it. Do not choose provider precision or accounting formulas in a component. Format currency, percentages, ratios, and counts by field rather than adding a universal two-decimal rule.

Price increases and decreases have a sign and a Thai direction label as well as semantic color. A zero change is neutral. A negative financial result is not automatically a UI error. Missing values say **ไม่มีข้อมูล** with an available reason; zero remains `0`. Unsupported, not found, failed retrieval, no results, and shorter available history remain distinguishable.

Stock Detail retains all required chart ranges: **1D**, **1M**, **1Y**, **5Y**, with Thai accessible names. Start with a price line chart suited to novice reading; volume can use an aligned lower plot when data exists. Candlesticks and technical overlays are not needed for the confirmed initial analysis. Label axes with date/time and currency, preserve gaps, and expose the visible series as an accessible table or equivalent values. Do not smooth a series into invented observations. Explain unavailable ranges instead of silently replacing them.

Financial statements expose annual/quarterly controls and income statement, balance sheet, and cash flow views within up to four years of available history. Always retain P/E, P/BV, ROE, D/E, dividend yield, and market capitalization fields, including unavailable states. Metric help explains the term in plain Thai without calling an isolated ratio a buy/sell signal.

Tables keep a caption, row headings, column headings, and units. On small screens, allow horizontal scrolling inside the labeled table region, with a visible overflow cue and keyboard access. The rest of the page reflows. Keep company identity or the metric label visible while comparing columns where feasible. Do not convert financial statements into repeated unlabeled cards or hide required periods to fit the viewport. See [W3C table guidance](https://www.w3.org/WAI/tutorials/tables/).

## Evidence and AI answers

A material factual claim has a nearby citation link with an accessible source name. Source detail contains title, publisher, original URL, publication or reporting date when known, and the relevant evidence cutoff. Citation numbering identifies references, not confidence. Never link an unsupported claim to an unrelated document or to a fabricated source. Keep source text and retrieved instructions untrusted.

Separate reported facts from interpretation through plain headings and language. Identify deterministic calculations and hypothetical examples when present. Do not invent confidence percentages, analyst ratings, financial figures, news, or provider capabilities to make a design look complete. Risk explanations remain visible in short and full analysis. Use a concise Thai research disclaimer near the answer area; a disclaimer does not replace specific uncertainty or risks.

Comparison answers identify each company, market, metric, currency, and period. Do not imply that THB and USD prices or unlike reporting periods are directly comparable. Do not invent a comparison-stock limit while Q05 and Q08 remain open. If an eventual measured limit exists, explain it before submission.

## Chat entry points and history

Use a visible composer label, a multiline field, and an explicit **ส่งคำถาม** button. Enter inserts a newline. Ctrl+Enter or Cmd+Enter may submit with a visible hint. Do not submit while a Thai input method is composing text. The same behavior applies in both chat entry points.

Main chat offers grounded starting prompts such as explaining a financial term, interpreting available results, or comparing named stocks. Do not offer "find the best stocks for me" or a discovery workflow before screening is implemented. No prompts imply saved holdings or a risk profile.

Stock chat displays a persistent identity line above the conversation and composer. A comparison request names the additional subject explicitly. Changing the stock switches its history view without rebinding an existing conversation. A mere ticker mention in main chat creates no stock-history association.

The main history shows the same conversations represented in stock history, rather than copies. A compact stock-origin label is a selected presentation convention, not a new product rule. Show **ประวัติการสนทนาอยู่เฉพาะเซสชันนี้** near history without promising a precise browser-close or multi-tab lifetime before storage behavior is selected.

Keep the submitted question visible during a request. Show only real progress states, such as retrieval or answer generation when those signals exist; otherwise use a neutral pending message. Announce status changes without reading each streamed token. A recoverable error retains the draft and offers a labeled retry. Incomplete output must not look like a verified complete answer. Retry must not duplicate the visible question.

Keep focus in the composer after sending and make the answer reachable in normal reading order. Auto-scroll only when the reader is already following the latest response. Offer a route to the latest answer when they have scrolled away. A sticky composer must remain usable with the mobile keyboard and must not cover the last answer, focused content, or source links.

## Components and feedback

Reuse the locally owned Button and Card machinery where it fits the chosen design. Existing colors, radii, variants, fixture props, and page composition do not constrain the redesign. Add primitives only when a confirmed flow needs them; do not create a parallel component library or download a full kit.

- Primary buttons name the next action. Secondary actions use quieter outlined or text treatments. Never give every section a primary button.
- Cards group independent items such as suggested follow-up questions. A reading section, statement table, or answer does not require a card. Avoid nested cards.
- Inputs have visible labels and field-local errors. Placeholder text is an example, never the only label. Preserve entered text on recoverable failure.
- Language and chart-range choices use buttons with selected state. Tabs are for switching panels and follow the [W3C tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Use manual activation when selection triggers a slow fetch.
- Disclosures expose their expanded state and keep the trigger available. Overlays support dismissal, return focus, and never trap content in a clipped container.
- Icons use one SVG family with consistent strokes. Text carries the action or status; decorative icons are hidden from assistive technology. Do not use emoji or Unicode arrows as an icon system.

Every applicable control has default, hover, pressed, selected, keyboard focus, disabled, and pending states. Disabled controls need an understandable reason when it is not obvious. Pending actions keep their label and width stable. Selection uses more than color. Hover is never the only way to discover an action or source.

Reserve skeleton space for initial loading. Do not render dummy zeros, fabricated charts, or plausible financial examples as loading content. Section-local errors keep successful sections usable. A retry acts on the failed section, not a full-page reset. Distinguish no publication, empty history, no search results, insufficient evidence, missing data, and retrieval failure through specific language and a valid next action.

## Accessibility and responsive checks

Adopt WCAG 2.2 AA as the design target, without claiming certification or changing unresolved release criteria in Q08. Text contrast is at least 4.5:1; essential control boundaries and graphical indicators are at least 3:1. Focus is visible and never covered by navigation or the composer. Use 44-by-44 CSS pixel targets for standalone controls as a project convention; WCAG AA's minimum target criterion is 24-by-24 with exceptions. See [contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), and [focus visibility](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

Check 320, 390, 768, 1024, and 1440 CSS pixel widths. Reflow ordinary content at 320 CSS pixels, including the equivalent 400% zoom case. Financial tables may scroll locally under the [two-dimensional-content exception](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Text enlargement must not clip Thai marks, truncate essential labels, or reorder the reading sequence. Test both long Thai UI labels and English publication content.

Keyboard users can reach navigation, search results, date selection, publication controls, data controls, evidence links, history, and the composer. Check actual screen-reader output for context, table headings, pending status, and failures when these flows are implemented. No forced animation, auto-advancing carousel, or flashing ticker is needed. Honor reduced motion.

## Decisions reserved for implementation

Q04 still governs exact exchanges, supported data, source delay, stale thresholds, and unavailable-provider policy. Q05 and Q08 still govern measured comparison/request limits and evaluation targets. Q03 leaves history storage and multi-tab behavior to implementation; later account persistence remains open. Do not resolve those questions through UI copy, timers, badges, or fixtures.

This design pass changes no provider, storage, runtime, financial formula, or trust boundary. It needs no new ADR. Keep future execution results in the relevant issue or PR. Before claiming the UI implements these conventions, inspect the real responsive screens and exercise the critical paths above. A successful build alone is insufficient evidence.
