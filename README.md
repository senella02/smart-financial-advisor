# Smart Financial Advisor

A new web application that helps novice investors with limited time understand markets, research Thai and US stocks, discover candidates, and assess the risks of holdings they record themselves.

The project starts from scratch, with selective reuse from the previous LLMFA project. Its design, architecture, models, tools, and deployment stack have not been selected.

## Current work

Functional requirements are being reconciled against the latest progress slides and project-owner answers. Feature scope is captured; unresolved product rules are tracked explicitly before the requirements are finalized.

Phase 1 is a capstone prototype containing Home's shared market content and Daily Brief, Stock Detail, and grounded AI Q&A/comparison, with no login system. Chat history lasts for the browser session: the main chatbot shows both entry points and Stock Detail shows explicitly stock-linked conversations. Charts cover 1D/1M/1Y/5Y, annual/quarterly statements cover up to four years, and the confirmed financial metrics show clear unavailable-data states. Selectable investments are Thai/US common stocks only.

Daily Brief updates hourly every day and keeps each past date's latest publication. Until today's first publication, show the dated previous brief. Chat automatically receives today's brief; archived briefs are read-only. Stock summaries are generated on first open per Thai calendar day from latest available data, with an as-of time, and remain fixed until midnight. Shared Daily Brief and stock summaries are available in Thai and English.

Home indices refresh every minute. Stock Detail quotes refresh on page open or explicit request, while initial stock-summary trend analysis uses price and volume only.

Watchlist, Investor Profile, and Discovery follow; Portfolio is last, including Home's portfolio widget. Portfolio records current holdings and purchase positions only. The UI is Thai and AI supports Thai/English. The future account-based version requires an account for AI chat and saving account-private data, while shared content remains browsable by guests.

- [Functional requirements](docs/functional-requirements.md): the editable requirements baseline, with acceptance criteria.
- [Questions to finalize](docs/requirements-questions.md): decisions still needed from the product owner.
- [Source notes](docs/source-notes.md): source precedence, conflicts, and lessons from the previous project.
- [Architecture decision records](docs/adr/README.md): decisions, rationale, and a template for future ADRs.
- [AGENTS.md](AGENTS.md): project instructions for coding agents.
- [.agents](.agents/README.md): agent guidance and the location for future project skills.

## Reference documents

- [Current progress slides](report-documents/2110488%20CAP%20PROJ%20I%20Bi-weekly%20Progress.pdf), session dated 2 November 2026, exported 6 November 2026.
- [Previous functional requirements v1.4](report-documents/Functional%20Requirements%20Document%20-%20LLMFA%20v1.4.pdf), dated 25 October 2026. Historical details must be checked against current requirements.
- Previous project: `/Users/thpalanand/Repo/llmfa-capstone`; background report: `llmfa-final-report.pdf` in that directory. This reference is outside the new repository and is not required to understand the current requirements.

## Repository layout

- `report-documents/`: original supplied PDFs; preserve them as source material.
- `docs/`: editable functional requirements and supporting context.
- `docs/adr/`: architecture decision records.
- `.agents/`: supporting agent guidance; project skills belong in `.agents/skills/` when needed.

No application code, dependency stack, or runtime commands are defined yet.
