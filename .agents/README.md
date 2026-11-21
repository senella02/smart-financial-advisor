# Project Agent Guidance

Read [AGENTS.md](../AGENTS.md) for repository-wide instructions and documentation homes. Supporting files are active guidance only when linked from that entry point.

## Shared changes

- Coordinate shared-interface changes with affected contributors. Follow the [contract change rules](../docs/contracts-and-boundaries.md#contract-changes) and the trust boundaries on that page.
- Keep downloaded direct dependencies exact and commit lockfile updates. `workspace:*` links local packages. Review compatibility notes and run affected [checks](../docs/developer-guide.md#checks-and-testing-scope) on tooling changes; routine version changes do not need an ADR.
- Label synthetic data where users see it. Preserve semantic sections, keyboard access, and visible focus.

## UI design reference

Read the [visual design](../DESIGN.md), [UI conventions](../docs/phase-1-planning/ui-conventions.md), and linked route briefs before changing Home, Stock Detail, or chat. Follow the [Phase 1 requirements](../docs/phase-1-planning/functional-requirements.md) for scope and behavior.

## Project skills

Shared skills are vendored in [skills/](skills/) for every contributor. Agents with `.agents/skills` discovery load them directly; other agents should read the relevant `SKILL.md`. Source pins, updates, and per-machine setup are in the [developer guide](../docs/developer-guide.md#shared-agent-skills).

- Design: [UI/UX Pro Max](skills/ui-ux-pro-max/SKILL.md) for searchable guidance, [Frontend Design](skills/frontend-design/SKILL.md) for visual direction, and [Impeccable](skills/impeccable/SKILL.md) for targeted design/review commands. Use the relevant workflow for the task rather than combining every design process.
- Coding: [Ponytail](skills/ponytail/SKILL.md) for the smallest complete solution; pstack's [TDD](skills/tdd/SKILL.md), [TypeScript](skills/typescript-best-practices/SKILL.md), and `principle-*` skills for focused engineering guidance.
- Writing and review: [technical-writing](skills/technical-writing/SKILL.md), [unslop](skills/unslop/SKILL.md), [benchmark-checklist](skills/benchmark-checklist/SKILL.md), [correct](skills/correct/SKILL.md), [sharpen](skills/sharpen/SKILL.md), [bro](skills/bro/SKILL.md), [in-your-own-words](skills/in-your-own-words/SKILL.md), and [ketchup](skills/ketchup/SKILL.md) / [ketchup-video](skills/ketchup-video/SKILL.md).
- Verification authoring: [create-verification-skill](skills/create-verification-skill/SKILL.md) / [maintain-verification-skill](skills/maintain-verification-skill/SKILL.md), their [formal](skills/create-formal-verification-skill/SKILL.md) [counterparts](skills/maintain-formal-verification-skill/SKILL.md), and [statechart](skills/statechart/SKILL.md).

Invoke Pstack skills marked `disable-model-invocation: true` explicitly when needed. Follow the project's scope, requirements, privacy rules, and [documentation rules](../AGENTS.md#documentation-rules) when applying skills.

Add `.agents/skills/<skill-name>/SKILL.md` with `name` and `description` frontmatter only when a repeatable project workflow justifies it. Keep supporting scripts and references in that skill folder; do not copy standing instructions or the old project's skill collection.
