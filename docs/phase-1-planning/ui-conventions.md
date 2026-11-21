# Phase 1 UI conventions

These conventions define the Phase 1 interaction and content design. The functional requirements define feature scope and behavior, and the question record tracks unresolved rules. [Phase 1 requirements](functional-requirements.md), [Question record](../requirements-questions.md)

Use the visual design and route briefs alongside these shared conventions. [Visual design](../../DESIGN.md), [Home](../../apps/web/.impeccable/surfaces/src-app-page-tsx.md), [Stock Detail](../../apps/web/.impeccable/surfaces/src-app-stocks-market-symbol-page-tsx.md), [Chat](../../apps/web/.impeccable/surfaces/src-app-chat-page-tsx.md)

## Navigation and orientation

Limit navigation to Phase 1 features. Use a shared top navigation with **หน้าหลัก**, **ค้นหาหุ้น**, and **ถาม AI**. The stock-search control opens a labeled search region. Search results identify company, symbol, and market. An ambiguous result requires an explicit selection.

Links navigate. Buttons change state or perform actions. The current route has a persistent visible and programmatic current state. Keep a skip link, one main landmark, one page heading, and ordered section headings. Support browser Back and direct links. A stock page starts with its identity and a route back to Home or search.

On small screens, wrap the same navigation into two rows rather than hiding it behind an unlabeled icon. Stock search occupies a full row when necessary. Language, date, range, and statement controls remain beside the section they affect.

## Publications, dates, and freshness

Use distinct labels for distinct clocks:

- **ข้อมูล ณ** identifies a source observation or evidence cutoff. Keep its date, time, and time zone where available. A report also names its financial period.
- **เผยแพร่เมื่อ** identifies when the application published generated content.
- **ตรวจสอบล่าสุด** identifies the application's last successful fetch. It never replaces the source time.
- **อัปเดตครั้งถัดไป** identifies a scheduled Daily Brief update. After a missed update, show that the update is delayed rather than counting below zero or claiming a successful update.

Display the Bangkok calendar date for publications. Show an explicit Gregorian year in date controls and full timestamps, with a Thai label identifying ค.ศ. Retain exchange-session dates when relevant. Display source dates that have no timestamp as dates.

Keep an absolute timestamp beside any relative age. Use closed-market, provider-delay, or stale labels only when source metadata or the agreed freshness policy supports them. After a failed refresh, say **อัปเดตไม่สำเร็จ แสดงข้อมูลล่าสุดที่มี** if previous data is still visible. [Q04 data coverage and freshness](../requirements-questions.md#q04-supported-data-and-stock-coverage)

Daily Brief language uses a labeled **ภาษาเนื้อหา** control with **ไทย** and **English**. Mark the English publication region with the correct language attribute. Short/full controls change reading depth within the same publication. Date changes select the latest successful publication for that date, not an intraday version browser.

Give today, previous-day fallback, archive, not-yet-published, and update-failed states distinct presentations. Show the actual publication date and make brief-specific AI controls available only for today's brief. Keep navigation to general chat available. [FR-03 Daily Brief publication](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication)

Keep the displayed publication and offer to load the newer one without moving focus or resetting an expanded article. When the reader accepts the update, replace the content, dates, language pair, and sources together.

## Financial information

Prices show their trading currency as THB or USD. Indices show points, not a currency. Statements identify currency, scale, annual or quarterly basis, and reporting period in their caption. A compact market-cap label must have its exact magnitude available without hover. Do not infer a metric's period or basis from its name.

Right-align comparable numbers and use tabular figures where the chosen font supports them. Keep a consistent precision within one field and retain source precision in accessible detail when formatting rounds it. Do not choose provider precision or accounting formulas in a component. Format currency, percentages, ratios, and counts by field rather than adding a universal two-decimal rule.

Price increases and decreases have a sign and a Thai direction label as well as semantic color. A zero change is neutral. A negative financial result is not automatically a UI error. Missing values say **ไม่มีข้อมูล** with an available reason; zero remains `0`. Unsupported, not found, failed retrieval, no results, and shorter available history remain distinguishable.

Stock Detail retains all required chart ranges: **1D**, **1M**, **1Y**, **5Y**, with Thai accessible names. Start with a price line chart suited to novice reading; volume can use an aligned lower plot when data exists. Candlesticks and technical overlays are not needed for the confirmed initial analysis. Label axes with date/time and currency, preserve gaps, and expose the visible series as an accessible table or equivalent values. Do not smooth a series into invented observations. Explain unavailable ranges instead of silently replacing them.

Provide annual and quarterly controls for financial statements. Show an unavailable state for required metrics when data is missing. Explain each metric in plain Thai and describe its limits. [FR-12 Financial data and news](../final/functional-requirements.md#fr-12-financial-data-and-news)

Tables keep a caption, row headings, column headings, and units. On small screens, allow horizontal scrolling inside the labeled table region, with a visible overflow cue and keyboard access. The rest of the page reflows. Keep company identity or the metric label visible while comparing columns where feasible. Do not convert financial statements into repeated unlabeled cards or hide required periods to fit the viewport. See [W3C table guidance](https://www.w3.org/WAI/tutorials/tables/).

## Evidence and AI answers

A material factual claim has a nearby citation link with an accessible source name. Source detail contains title, publisher, original URL, publication or reporting date when known, and the relevant evidence cutoff. Citation numbering identifies references, not confidence. Never link an unsupported claim to an unrelated document or to a fabricated source. Keep source text and retrieved instructions untrusted.

Separate reported facts from interpretation through plain headings and language. Identify deterministic calculations and hypothetical examples when present. Do not invent confidence percentages, analyst ratings, financial figures, news, or provider capabilities to make a design look complete. Risk explanations remain visible in short and full analysis. Use a concise Thai research disclaimer near the answer area; a disclaimer does not replace specific uncertainty or risks.

Identify each company, market, metric, currency, and period in comparison answers. Explain differences in currency or reporting period that affect the comparison. If a comparison limit is set, show it before submission. [Q05 chat and discovery boundaries](../requirements-questions.md#q05-chat-and-discovery-boundaries)

## Chat entry points and history

Use a visible composer label, a multiline field, and an explicit **ส่งคำถาม** button. Enter inserts a newline. Ctrl+Enter or Cmd+Enter may submit with a visible hint. Do not submit while a Thai input method is composing text. The same behavior applies in both chat entry points.

Main chat offers grounded starting prompts such as explaining a financial term, interpreting available results, or comparing named stocks. Do not offer "find the best stocks for me" or a discovery workflow before screening is implemented. No prompts imply saved holdings or a risk profile.

Stock chat displays a persistent identity line above the conversation and composer. A comparison request names the additional subject explicitly. Changing the stock switches its history view without rebinding an existing conversation. A mere ticker mention in main chat creates no stock-history association.

Use a compact stock-origin label in main history. Show **ประวัติการสนทนาอยู่เฉพาะเซสชันนี้** near history. [Q03 access, persistence, and languages](../requirements-questions.md#q03-access-persistence-and-languages)

Keep the submitted question visible during a request. Show only real progress states, such as retrieval or answer generation when those signals exist; otherwise use a neutral pending message. Announce status changes without reading each streamed token. A recoverable error retains the draft and offers a labeled retry. Incomplete output must not look like a verified complete answer. Retry must not duplicate the visible question.

Keep focus in the composer after sending and make the answer reachable in normal reading order. Auto-scroll only when the reader is already following the latest response. Offer a route to the latest answer when they have scrolled away. A sticky composer must remain usable with the mobile keyboard and must not cover the last answer, focused content, or source links.

## Components and feedback

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

Keyboard users can reach navigation, search results, date selection, publication controls, data controls, evidence links, history, and the composer. Check screen-reader output for context, table headings, pending status, and failures. No forced animation, auto-advancing carousel, or flashing ticker is needed. Honor reduced motion.
