---
name: Smart Financial Advisor
description: Thai-first stock research with visible evidence and publication context
---

## Overview

Working design direction selected by the agent on 14 November 2026 and open to owner review.

**Public information desk** is the selected visual direction. A compact indigo navigation band anchors open white reading areas on a cool pale ground. Plain Thai explanations lead research sections. A repeatable evidence row keeps source, relevant date, and publication context attached to the content they describe. This evidence row is the signature across Home, Stock Detail, and chat.

The audience is a novice investor with limited time. Design for short reading and checking sessions in ordinary room or daylight conditions; this is a design assumption, not a confirmed device requirement. A light presentation supports this scene. Dark mode and theme settings are outside this first convention set.

The [Phase 1 requirements](docs/phase-1-planning/functional-requirements.md) define product behavior. The [UI conventions](docs/phase-1-planning/ui-conventions.md) define interactions and content across Phase 1 routes.

## Colors

Use a restrained palette with indigo for navigation, actions, and selection. Reserve red and green for meaningful financial direction or explicit status. Brand color must not imply a positive return.

Core roles:

- `background` (#F5F7FB): page ground and quiet support regions.
- `surface` (#FFFFFF): reading areas, inputs, and overlays.
- `foreground` (#17243B): headings, primary copy, and numeric values.
- `muted-foreground` (#56647B): dates, source metadata, and secondary labels. Never reduce its opacity to create another text tier.
- `primary` (#334DB3): navigation band, primary actions, and underlined links on light backgrounds. Text on a filled primary surface is white.
- `selected` (#E9EDFB): selected control background with primary text and a visible selected marker.

Supporting roles:

- `primary-hover` (#293E91) and `primary-active` (#213273): feedback on filled actions, both with white text.
- `border` (#D8DEEA): structural separators only. This pale line cannot be the sole boundary of an input or essential control.
- `control-border` (#75819B): essential input and outlined-control boundaries on light backgrounds.
- `focus` (#7130A5): a 3px outer ring with a 2px surface-colored separation. On indigo surfaces retain the white separation so focus stays distinct.
- `positive` (#176343): an increase, with a plus sign and direction text.
- `negative` (#AE2638): a decrease or error, with separate labels explaining which meaning applies.
- `warning` (#815600): delayed or limited information, with a visible reason.

Text roles above target at least 4.5:1 on white, background, and selected surfaces. Control boundaries target 3:1. These are the specified pairings; do not assume every role works on every colored background. Use primary color for the default price series, separate volume geometry, and text/line-style distinctions for multiple series. Do not make a chart's meaning depend on hue.

## Typography

Use **Sarabun** for Thai and Latin UI, headings, publications, and values. Its multiscript coverage and available weights are recorded in [Google Fonts' description](https://github.com/google/fonts/blob/main/ofl/sarabun/DESCRIPTION.en_us.html) and [font metadata](https://github.com/google/fonts/blob/main/ofl/sarabun/METADATA.pb). Use a regular-width face, no decorative display pairing. The intended font stack is Sarabun, Tahoma, Arial, sans-serif.

Use weights 400 for reading text, 500 for controls, 600 for section headings, and 700 sparingly for page headings or the main quote.

Starting type scale:

- Main quote or index focus: 2rem, line-height 1.4, weight 600.
- Page heading: 1.75rem, line-height 1.5, weight 700.
- Section heading: 1.25rem, line-height 1.6, weight 600.
- Body and input text: 1rem, line-height 1.75, weight 400.
- Controls: 1rem, line-height 1.5, weight 500, with enough vertical padding for Thai marks.
- Supporting metadata: 0.875rem, line-height 1.65, weight 400. Do not shrink essential metadata further to make a row fit.

Use fixed rem sizes rather than viewport-scaled headings. Leave Thai tracking at normal and never force uppercase UI labels. Left-align prose and text labels; right-align comparable numbers. Aim for a readable prose measure around 65 characters, capped at 48rem, then verify Thai line lengths visually because `ch` measures Latin glyphs. Avoid justified paragraphs, fixed-height text boxes, clipped tone marks, and ellipsis on company identities, units, warnings, or financial periods.

## Layout

Use one shared shell and a mobile-first reading order. The global navigation is a compact horizontal indigo band. Section backgrounds and whitespace define hierarchy before containers do. Keep the main content left aligned within a centered maximum width of 78rem, with 1rem side padding on phones and 2rem on larger screens.

Spacing starts from 4, 8, 12, 16, 24, 32, and 48 CSS pixels. Use 8 or 12 within compact groups, 16 or 24 inside larger regions, and 32 or 48 between major sections. Leave more space before a heading than after it. Never use fixed heights for articles, answers, or financial tables.

Responsive starting points are 40rem, 64rem, and 80rem, adjusted only when real content needs it. Below 64rem, research and chat stack in document order. At larger widths, a second column is allowed only when the reading area and a usable chat pane both fit. The stock chat pane starts around 22rem wide. The main chat reading area stays within 48rem even on a wide screen. Route-specific order and wireframes belong in surface briefs.

On phones, avoid independent scroll panes for whole page sections. Use a labeled, contained horizontal scroll region for genuinely two-dimensional financial tables. Controls wrap without losing labels. Keep navigation and composer clear of focused content and the on-screen keyboard. Desktop side-by-side information must retain a coherent single-column reading order.

## Elevation & Depth

Use flat surfaces with a separator or a background change. Reading content does not float in a field of identical shadowed cards. Reserve a soft neutral shadow for temporary overlays when separation is otherwise unclear. Do not combine decorative borders and shadows on every region. No glass, gradient washes, financial-themed textures, or glowing states.

Motion answers an action: about 150ms for hover/press feedback and 200ms for opening or closing a region. Pending requests use honest status text, not fake percentages. Do not animate changing digits, rearrange index order, or stage page-load entrances. Under reduced motion, state changes remain immediate and understandable.

## Shapes

Use restrained rounded rectangles: a 6px starting radius for controls, 12px for independent grouped items or overlays. Open reading sections have no container radius. Pills are reserved for compact market or state labels, never every heading and action. Status labels contain words, not an unexplained colored dot.

Standalone controls have a 44px minimum target in each dimension. Input and button heights may grow for wrapped Thai text or zoom. Share one icon stroke family, generally 20px inside controls, without letting icon size determine the target size.

## Components

Use the [UI conventions](docs/phase-1-planning/ui-conventions.md#components-and-feedback) for interaction and feedback details.

- **Buttons and links.** Primary actions use `primary` with white text, `primary-hover` on hover, and `primary-active` when pressed. Quieter actions use outlined or text treatments; outlined controls use `control-border`. Use the control typography and 6px radius, with padding that preserves the 44px minimum target and allows Thai labels to wrap. Links navigate and remain visibly identifiable; buttons perform actions. Apply the shared focus ring. Pending actions retain their label and width; disabled actions explain the reason when it is not obvious.
- **Cards.** Reserve cards for independent items such as suggested follow-up questions. Use `surface`, a 12px radius, and 16–24px internal spacing, with a separator or background change before adding a shadow. Do not nest cards or wrap ordinary publications, answers, and statement tables in cards. Use semantic headings within each group.
- **Inputs and composer.** Use a visible label above a white field, `foreground` text, `control-border`, a 6px radius, and the shared focus ring. Use the body/input type scale and enough padding for Thai marks. Place errors beside the field and preserve entered text after recoverable failure. The chat composer is multiline with an explicit send button; placeholder text never substitutes for a label.
- **Navigation and selection.** The navigation band uses `primary` with white labels. Mark the current route with a persistent visible indicator and programmatic current state. Language and range controls use the `selected` background, primary text, and a marker beyond color. Tabs switch panels; ordinary choice buttons expose selection without pretending to be tabs. Keep controls beside the content they affect and allow them to wrap on narrow screens.
- **Evidence rows and status labels.** Repeat a compact evidence row beside the publication, quote, or answer it describes. Use supporting metadata typography and `muted-foreground`, with identifiable source links and separately labeled source, publication, and refresh dates where applicable. Let long titles and timestamps wrap. Status labels use words; positive and negative movements also include signs and direction text. Never use an unexplained colored dot or hide essential evidence behind hover.
- **Financial tables and data regions.** Use open sections with aligned rows and quiet structural separators. Right-align comparable values with tabular figures; retain captions, headings, units, periods, and unavailable states. Tables scroll within their labeled region on small screens while the page reflows. Use primary color for the price series and provide accessible values. Do not invent observations or hide required periods to fit a layout.

## Do's and Don'ts

- Keep source evidence next to claims and preserve the difference between a publication date, evidence cutoff, quote time, and refresh attempt.
- Show a short explanation before optional detail without hiding material risks or missing data.
- Use open sections, tables, and lists for reading and comparison. Use cards when an item is independently actionable.
- Keep Thai UI and bilingual publication controls distinct. Test both scripts and long labels.
- Render real content or an explicit unavailable state. Visibly label synthetic data in demonstrations.
- Do not add buy/sell calls, performance promises, confidence scores, fabricated figures, or "live" badges unsupported by evidence.
- Do not add later-phase navigation, accounts, personalization controls, theme switching, or decorative onboarding.
