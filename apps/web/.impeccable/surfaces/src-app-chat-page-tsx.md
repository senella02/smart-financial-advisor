---
version: 1
slug: "src-app-chat-page-tsx"
primary_target: "src/app/chat/page.tsx"
related_targets: []
---

# Main chat

Mode: Operate, with Read behavior for answers. Design target only.

Use the [visual conventions](../../../../DESIGN.md) and [interaction conventions](../../../../docs/ui-conventions.md). Primary job: ask or compare, understand a supported answer, and follow its evidence. Authority: FR-13, FR-14, and FR-19 through FR-21.

## Direction contract

THESIS: A readable conversation with visible research context and source evidence. No trading controls, model dashboard, or fabricated personal context.

OWN-WORLD: Public information desk. Shared indigo navigation, a cool history region, white answer area, Sarabun, and evidence rows consistent with published research.

STORY: Start or reopen a current-session conversation, see its context, ask a question, then read facts, interpretation, risks, and sources.

FIRST VIEWPORT: Shared navigation above a desktop history column of about 18rem and a centered conversation area capped at 48rem. History includes both entry points. The empty conversation presents a heading, a few grounded starting prompts, and the labeled composer. Once populated, the answer owns the reading area and the composer remains at its lower edge. On phones, history opens through a labeled disclosure above the conversation; avoid a permanent sidebar or a second nested conversation scroller.

FORM: Grounded candidate 5, public information and wayfinding. seed:4be8e5895fd07ce1. Agent-selected working direction. Signature interaction: open a source beside its claim, then return without losing the conversation position. Announce answer status, preserve drafts, and avoid scrolling a reader away from earlier content.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

The FINISH line applies to a future UI build.

## Composition

```text
[Shared Thai navigation                       Search]
[Session history | Conversation heading and context  ]
[Main and stock  | User question                     ]
[conversations   | Answer / risks / evidence          ]
[                |                                   ]
[Session notice  | Labeled composer / Send question   ]
```

## Required variations

Show empty session history, current conversation, pending request, insufficient evidence, unavailable today's brief, recoverable request error, and an explicitly stock-linked conversation. Explain unavailable brief context when relevant; keep ordinary financial Q&A available. A general ticker mention does not create a stock-history association. Old messages retain the dates and cutoffs that applied when generated.

Reuse composer behavior from Stock Detail. No login prompt, file attachment, export, Deep Research, discovery screening, saved profile, or account-history promise. Do not choose a storage lifetime beyond the confirmed browser-session rule. Q05 and Q08 retain request/comparison limits; multi-tab behavior remains an implementation choice.
