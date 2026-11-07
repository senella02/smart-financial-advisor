# Project Agent Guidance

Read [AGENTS.md](../AGENTS.md) for repository-wide instructions and documentation homes. Supporting files are active guidance only when linked from that entry point.

## Shared changes

- Before changing a shared interface, identify its producers and consumers and agree on the smallest schema/example change with affected contributors. Update contracts, fixtures, adapters, UI, relevant tests, and docs together. Current shapes and limits are in the [contract guide](../docs/contracts-and-boundaries.md).
- Keep downloaded direct dependencies exact and commit lockfile updates. `workspace:*` links local packages. Review compatibility notes and run affected [checks](../docs/developer-guide.md#checks-and-testing-scope) on tooling changes; routine version changes do not need an ADR.
- Keep fixture data visibly marked as demo data. Preserve semantic sections, keyboard access, and visible focus when replacing page placeholders.

## Project skills

No custom project skills exist. Add `.agents/skills/<skill-name>/SKILL.md` with `name` and `description` frontmatter only when a repeatable project workflow justifies it. Keep supporting scripts and references in that skill folder; do not copy standing instructions or the old project's skill collection.
