# Project Agent Guidance

Read [AGENTS.md](../AGENTS.md) for repository-wide instructions and documentation homes. Supporting files are active guidance only when linked from that entry point.

## Shared changes

- Coordinate shared-interface changes with affected contributors. Follow the [contract change rules](../docs/contracts-and-boundaries.md#contract-changes) and the trust boundaries on that page.
- Keep downloaded direct dependencies exact and commit lockfile updates. `workspace:*` links local packages. Review compatibility notes and run affected [checks](../docs/developer-guide.md#checks-and-testing-scope) on tooling changes; routine version changes do not need an ADR.
- Keep fixture data visibly marked as demo data. Preserve semantic sections, keyboard access, and visible focus when replacing page placeholders.

## UI design reference

The selected working visual direction is in [DESIGN.md](../DESIGN.md). Read [UI conventions](../docs/ui-conventions.md) and the linked route briefs before implementing Home, Stock Detail, or chat. They describe the next UI target; existing UI and fixtures are disposable placeholders. Requirements retain authority over scope and behavior. Keep this design reference separate from product rules in PRODUCT.md.

## Project skills

Shared skills are vendored in [skills/](skills/) for every contributor. Agents with `.agents/skills` discovery load them directly; other agents should read the relevant `SKILL.md`. Source pins, updates, and per-machine setup are in the [developer guide](../docs/developer-guide.md#shared-agent-skills).

- Design: [UI/UX Pro Max](skills/ui-ux-pro-max/SKILL.md) for searchable guidance, [Frontend Design](skills/frontend-design/SKILL.md) for visual direction, and [Impeccable](skills/impeccable/SKILL.md) for targeted design/review commands. Use the relevant workflow for the task rather than combining every design process.
- Coding: [Ponytail](skills/ponytail/SKILL.md) for the smallest complete solution; pstack's [TDD](skills/tdd/SKILL.md), [TypeScript](skills/typescript-best-practices/SKILL.md), and `principle-*` skills for focused engineering guidance.
- Writing and review: [technical-writing](skills/technical-writing/SKILL.md), [unslop](skills/unslop/SKILL.md), [benchmark-checklist](skills/benchmark-checklist/SKILL.md), [correct](skills/correct/SKILL.md), [sharpen](skills/sharpen/SKILL.md), [bro](skills/bro/SKILL.md), [in-your-own-words](skills/in-your-own-words/SKILL.md), and [ketchup](skills/ketchup/SKILL.md) / [ketchup-video](skills/ketchup-video/SKILL.md).
- Verification authoring: [create-verification-skill](skills/create-verification-skill/SKILL.md) / [maintain-verification-skill](skills/maintain-verification-skill/SKILL.md), their [formal](skills/create-formal-verification-skill/SKILL.md) [counterparts](skills/maintain-formal-verification-skill/SKILL.md), and [statechart](skills/statechart/SKILL.md).

These are available workflows, not a mandate to run them all. Pstack's `disable-model-invocation: true` is preserved: invoke those skills explicitly when needed. Project requirements, authorized scope, ADR criteria, and privacy rules take precedence over generic recommendations. [PRODUCT.md](../PRODUCT.md) contains only confirmed, durable product rules and requirements links. Keep implementation status in task plans such as `plan.md`. Do not promote temporary experiments, scaffold choices, or observed code into product requirements. Establish design conventions through requested design work. Do not create parallel requirements merely because a skill suggests them.

Add `.agents/skills/<skill-name>/SKILL.md` with `name` and `description` frontmatter only when a repeatable project workflow justifies it. Keep supporting scripts and references in that skill folder; do not copy standing instructions or the old project's skill collection.
