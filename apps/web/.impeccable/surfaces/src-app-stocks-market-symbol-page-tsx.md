---
version: 1
slug: "src-app-stocks-market-symbol-page-tsx"
primary_target: "src/app/stocks/[market]/[symbol]/page.tsx"
related_targets: []
---

# Stock Detail

Mode: Operate. Design target only.

Use the [visual conventions](../../../../DESIGN.md) and [interaction conventions](../../../../docs/phase-1-planning/ui-conventions.md). Primary job: research the selected common stock and inspect evidence or ask a stock-bound question. Authority: FR-01, FR-02, FR-11 through FR-13, and FR-21.

## Direction contract

THESIS: Keep stock identity, source time, and explanation legible while the visitor moves between financial evidence and stock-bound questions.

OWN-WORLD: Public information desk. Shared indigo shell, open white data and reading regions, aligned figures, and the same evidence rows as Home.

STORY: Identify the company and market, distinguish the quote from the fixed daily summary, inspect a chart or statement, and ask with the selected stock visibly bound.

FIRST VIEWPORT: Identity and company name span the content width, followed by quote, currency, source time, and manual quote refresh. Beneath, a broad research column starts with daily summary and content-language control, then price/volume chart. A narrower desktop chat column keeps stock context and composer visible. On narrow screens, put stock chat after the short summary and before the remaining chart, statements, metrics, and news; keep it collapsed behind a labeled disclosure initially so the document remains navigable.

FORM: Grounded candidate 5, public information and wayfinding. seed:4be8e5895fd07ce1. Agent-selected working direction. Signature interaction: inspect financial-period evidence and return to the same section without losing the stock binding. Quote refresh changes only quote state.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Composition

```text
[Shared Thai navigation                       Search]
[Market / symbol / company                           ]
[Quote / currency / source time / Refresh quote       ]
[Daily summary / content language | Stock chat context]
[Summary and evidence             | Conversation      ]
[Chart 1D 1M 1Y 5Y / volume        | Composer          ]
[Metrics / statements / news below                    ]
```

## Required variations

Provide available, missing, loading, and failed states independently for quote, daily summary, chart, metrics, statements, and news. A summary retains its Thai-date publication and evidence cutoff after quote refresh. A shorter history explains its range. Annual/quarterly and statement-type controls remain with the financial table. Risks stay visible in the daily summary. Stock history contains explicitly linked conversations only.

The mobile disclosure expands in normal document flow and has an explicit return-to-research control. Do not duplicate a second conversation or silently rebind one on stock navigation. Available data and chat remain usable when summary generation fails. Exact coverage and stale policy remain Q04 decisions; comparison limits remain Q05 and Q08 decisions.
