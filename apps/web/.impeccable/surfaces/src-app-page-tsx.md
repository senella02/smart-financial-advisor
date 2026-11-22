---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Home

Mode: Operate, with a Read area for the full Daily Brief. Design target only.

Use the [visual conventions](../../../../DESIGN.md) and [interaction conventions](../../../../docs/phase-1-planning/ui-conventions.md). Primary job: check market context, understand the dated brief, then open stock research or ask about a current-day topic. Authority: FR-02 through FR-05 and FR-21.

## Direction contract

THESIS: A dated briefing with traceable evidence, organized for reading after a quick market check. Avoid a marketing hero and repeated dashboard cards.

OWN-WORLD: Public information desk. Indigo navigation, open white prose areas, a cool ground, Sarabun, and an evidence row that separates source time from publication time.

STORY: The visitor recognizes the date and data state, reads the short explanation, opens detail or evidence, then asks about an eligible topic.

FIRST VIEWPORT: Shared top navigation and search, one compact five-index strip, then the Daily Brief heading, date and content-language controls. On wide screens, brief content takes roughly two thirds and current-day questions one third. Put short/full reading controls with the brief. On phones, stack indices, brief, then questions; let index rows wrap rather than become a carousel. Never push the brief below a promotional introduction.

FORM: Grounded candidate 5, public information and wayfinding. seed:4be8e5895fd07ce1. Agent-selected working direction, not owner approval. Signature interaction: open a claim's source detail without losing the reading position. Updates announce availability without replacing prose mid-read.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Composition

```text
[Thai navigation                         Stock search]
[SET] [SET50] [Dow Jones] [S&P 500] [Nasdaq]
[Brief date / content language / publication status    ]
[Short briefing and full-text disclosure | Ask today   ]
[Claims and evidence rows               | Topic cards ]
```

## Required variations

Show today, dated previous-day fallback, archive, not yet published, and failed update as distinct states. Only today has brief follow-up cards. Retain the last successful data with honest metadata on refresh failure. Keep all five index identities visible when values are unavailable. Long Thai text and English publication content expand naturally.

No portfolio overview, saved interests, discovery prompts, or account controls. Exact provider coverage and stale thresholds remain Q04 decisions. No invented publication, quote, or news values are needed to implement the unavailable states.
