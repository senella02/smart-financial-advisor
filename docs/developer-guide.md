# Developer Guide

This is a fixture-only scaffold for Phase 1 feature work. It runs without accounts, environment configuration, credentials, a database, or external market/AI services. The [requirements](functional-requirements.md) remain authoritative; this setup does not deliver their research features.

## Bootstrap

Use Node **26.13.0** and pnpm **12.18.0**, pinned in [`.nvmrc`](../.nvmrc), [`package.json`](../package.json), and [CI](../.github/workflows/checks.yml). The workspace enforces these engines. With an existing Node version manager such as nvm:

```sh
nvm install
nvm use
```

If Corepack is already installed, `corepack pnpm` honors `packageManager`; use it in place of `pnpm` below. To install pnpm without changing global tools, use an isolated temporary directory in your shell:

```sh
SFA_TOOLS_DIR="$(mktemp -d)"
npm install --prefix "$SFA_TOOLS_DIR" --save-exact pnpm@12.18.0
export PATH="$SFA_TOOLS_DIR/node_modules/.bin:$PATH"
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Stop with Ctrl+C. Dependency downloads are development/CI traffic; the app makes no live financial or LLM calls. `.env.example` is explanatory only; copying it is unnecessary. Future secrets must be server-only and kept in ignored `.env.local`, never `NEXT_PUBLIC_*`.

## Routes

- `/`: Thai Home shell, index insertion point and Daily Brief insertion point.
- `/stocks/TH/FIXTURE_TH_A`: fake Thai listing, quote/daily-summary/stock-chat insertion points.
- `/stocks/US/FIXTURE_US_B`: fake US listing using the same shell.
- `/chat`: main-chat and combined-history insertion points.

All pages show an explicit localized **Demo** warning. Phase 1 ships Thai UI only. Thai/English dictionaries and a shared message accessor prepare for English UI later; no language selector is exposed. No real prices, returns, news, summaries, chat answers, refresh buttons, or writable financial API endpoints are supplied. The historical contract examples use dates in 2000 and are not today's data. Unknown listings return 404.

## Checks and testing scope

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm check` aggregates **lint → typecheck → non-watch unit tests → production build**. Use `pnpm test` for the fast test loop while developing; run `pnpm check` before opening or updating a PR. `typecheck` generates Next route types before checking the contracts, tooling/tests, and web app. `lint` uses the ESLint CLI and Next flat config, never `next lint`. The production build checks Next.js compilation and bundling that unit tests do not exercise.

Keep tests proportional to implemented behavior. Current unit tests protect financial value/missing-data validation, listing identity, dates and publication context, citation references, private/shared input boundaries, fixture-only adapter behavior, and translation-key parity. Contract tests validate schemas, not unimplemented services or live financial accuracy. Do not add coverage targets or tests for static placeholder copy and trivial accessors.

Playwright is deferred while the pages are placeholders. Add a small browser suite alongside the first implemented critical user flow, such as opening stock research or submitting a chat question, and check keyboard access, focus, and error/unavailable states there. Until then, manually check navigation and keyboard access when changing page markup; unit tests and a build do not verify browser behavior. See [Playwright's guidance on testing user-visible behavior](https://playwright.dev/docs/best-practices#test-user-visible-behavior).

CI runs the frozen install and `pnpm check` on pull requests and pushes to `main`. Feature-branch pushes are checked when a PR is open, avoiding duplicate push/PR runs; GitHub documents [event and branch filtering](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow). Actions are commit-pinned, permissions are read-only, and there are no browser downloads, deploy jobs, custom secrets, or publishing steps. Tooling compatibility notes are below. Exact versions live in manifests and the lockfile; execution results belong in the relevant PR.

## Tooling compatibility and maintenance

TypeScript uses side-by-side aliases: `@typescript/native` supplies the TypeScript 7 compiler (`tsc`), while `typescript` resolves to the TypeScript 6 API compatibility package for tooling such as `typescript-eslint`. Keep both aliases until API consumers support the newer compiler; see [Microsoft's side-by-side guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0).

The setup uses ESLint 10. Its bundled `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-react` versions declare peer ranges ending at ESLint 9. No peer-range override is configured. Recheck these installed plugin constraints and run affected checks when upgrading.

`pnpm-workspace.yaml` temporarily overrides affected minimatch 7–10 versions to 11.0.5 for [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Remove the override when upstream ranges include a patched version and affected checks pass. Release-age exceptions are package/version-specific; native build permissions are limited to esbuild, sharp, and unrs-resolver. Review these settings when changing the associated packages rather than adding broad bypasses.

## Where to work

Read the [contracts/boundary guide](contracts-and-boundaries.md). `packages/contracts/src/index.ts` owns shared schemas/types/ports; `fixtures.ts` owns machine-marked examples. `apps/web/src/server/research.ts` composes fixture adapters for the UI. Future external adapters stay server-only and must validate actual provider responses.

Home lives in `apps/web/src/app/page.tsx`, Stock Detail in `apps/web/src/app/stocks/[market]/[symbol]/page.tsx`, and main chat in `apps/web/src/app/chat/page.tsx`. Shared navigation is `apps/web/src/app/layout.tsx`, UI translation keys are in `apps/web/src/messages/th.json` and `en.json`, selected by `messages/index.ts`, and styles are `apps/web/src/app/globals.css`.

Next's automatic agent-file generation is disabled so running dev does not inject tool instructions into shared guidance. `next-env.d.ts` and `.next` are generated locally and gitignored.

## Shared UI components

The web app uses [Tailwind CSS's PostCSS integration](https://tailwindcss.com/docs/installation/framework-guides/nextjs) and locally owned [shadcn/ui components](https://ui.shadcn.com/docs). Button and Card live in `apps/web/src/components/ui`; their upstream MIT license is kept alongside them. They were installed manually from the official `shadcn-ui/ui` repository's `new-york-v4` source. Local adaptations use the `@/lib/utils` class-merging helper, import only the Radix Slot primitive, render CardTitle as a semantic `h2`, and give titles/buttons relaxed line height for Thai text.

For the next UI implementation, follow [DESIGN.md](../DESIGN.md), [UI conventions](ui-conventions.md), and their route briefs. Existing UI and fixtures are disposable placeholders, not design authority. Reuse component machinery where it fits, including Button variants for navigation links. Keep shared colors, font, and radius tokens in `apps/web/src/app/globals.css`, with component variants in their component files. Keep copy in the translation dictionaries. Preserve labeled sections and heading order; do not wrap every section in a Card.

`apps/web/components.json` configures future component additions. From the repo root, run `pnpm dlx shadcn@4.23.0 add <component> -c apps/web` when a feature needs one. Review generated code, dependencies, and any global-style changes, retain exact direct dependency versions, and run the checks above. Component source is owned here, so upstream changes require review rather than arriving automatically through a package upgrade. No separate shared UI workspace package is needed for the single web app.

## Shared agent skills

All shared skills live under [.agents/skills](../.agents/skills/). They become available on the next Codex turn; reload another agent if it caches its skill list. Vendored skill code is excluded from the application ESLint pass and keeps its own upstream checks. No personal plugin install is needed. See [.agents/README.md](../.agents/README.md#project-skills) for when to use each family.

### UI/UX Pro Max

[UI/UX Pro Max](../.agents/skills/ui-ux-pro-max/SKILL.md) is vendored under `.agents/skills/ui-ux-pro-max`, so contributors receive the same skill, data, and scripts with their checkout. Agents supporting that directory can discover it automatically; other agents should follow the link in [.agents/README.md](../.agents/README.md). Newly installed skills are available in Codex on the next turn. No global CLI or npm/pip dependency is required. The search tool requires an existing Python 3 installation; if missing, install Python from [python.org](https://www.python.org/downloads/).

From the repository root, smoke-check the bundled search:

```sh
python3 -B .agents/skills/ui-ux-pro-max/scripts/search.py "keyboard focus" --domain ux
python3 -B .agents/skills/ui-ux-pro-max/scripts/search.py "responsive layout" --stack nextjs
```

Source: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), commit [`6ae86f61f520d6ca229d2f40e070410638c908c5`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/6ae86f61f520d6ca229d2f40e070410638c908c5), installed 14 November 2026 from `.claude/skills/ui-ux-pro-max`. The upstream [MIT license](../.agents/skills/ui-ux-pro-max/LICENSE) is retained. Local adaptations replace Claude plugin paths with repository-local commands and update the Python invocation guidance. Treat recommendations as design guidance; the project requirements and [shared UI conventions](#shared-ui-components) remain authoritative.

To update, use a temporary checkout of a reviewed upstream commit, replace the vendored skill directory with that commit's `.claude/skills/ui-ux-pro-max` contents, retain the license, reapply the command-path adaptations, update this source pin, and rerun both smoke checks plus a `--design-system` query. Review the diff before sharing it. Do not run a global installer or add generated design-system output merely to update the skill.

### Additional sources and updates

Installed 14 November 2026, with each upstream license retained in its skill directory:

- [Anthropic Frontend Design](https://github.com/anthropics/skills/tree/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/frontend-design): commit `2c5958ecac7cee2b583967a2c4981d0f4a75c579`, copied without changes, including `LICENSE.txt`.
- [Impeccable](https://github.com/pbakaus/impeccable/tree/fb46cc6e356253a5d9945c4e3667c20c3d699cc8/.agents/skills/impeccable): commit `fb46cc6e356253a5d9945c4e3667c20c3d699cc8`, version 4.9.1, engine 0.1.24. Includes its references, scripts, agent briefs, Apache license, and third-party notice. The Unix launcher is executable. Local integration guidance is added to `SKILL.md`.
- [Ponytail](https://github.com/DietrichGebert/ponytail/tree/96608e078b2d5ea607c5c3b8b5a54d1c1fba6846/skills/ponytail): commit `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`, the requested core skill plus MIT license. No runtime setup.
- [Pstack](https://github.com/cursor/plugins/tree/3dbd22ff12742fb28c9700b9760baa29ed41dc13/pstack/skills): commit `3dbd22ff12742fb28c9700b9760baa29ed41dc13`. The portable subset contains 24 `principle-*` skills, `benchmark-checklist`, `bro`, `correct`, `in-your-own-words`, `sharpen`, `tdd`, `technical-writing`, `typescript-best-practices`, `unslop`, `ketchup`, `ketchup-video`, both verification authoring/maintenance pairs, and `statechart`. Each retains pstack's MIT license. Local adaptations change `.cursor/skills/` to `.agents/skills/` in the ordinary verification pair and restore the statechart launcher's executable bit. Upstream invocation controls are preserved.

Pstack omissions: `setup-pstack`, `poteto-mode`, `poteto-help`, `arena`, `swarm`, `architect`, `how`, `why`, `interrogate`, `no-comments`, `automate-me`, `reflect`, `recall`, `show-me-your-work`, `make-bot-ui`, and `figure-it-out` depend on Cursor model/rule configuration, named agents, transcript storage, automation endpoints, or the omitted orchestration workflows. `teach` and `blast-radius` require those omitted investigation/orchestration skills. Portable skills may mention those workflows as context; they are not installed or required entry points here. No Cursor personal settings, hooks, automation jobs, or account connections were copied.

To update a family, review a temporary checkout of the new upstream commit, replace only its installed skill directories, retain its licenses/notices, reapply the adaptations above, and update its pin here. Do not copy upstream project configuration, personal settings, or additional skill families implicitly.

### Impeccable setup and use

The repo-local manual-copy installation follows [upstream's instructions](https://github.com/pbakaus/impeccable#installation). On first use each machine downloads a platform-specific, checksum-verified engine to its user cache (`~/.impeccable/bin/` by default). It needs network access, `curl` or `wget`, and a SHA-256 utility on Unix. Windows uses the bundled `.cmd` launcher. No API key or npm install is needed for the basic context/design commands.

```sh
.agents/skills/impeccable/scripts/impeccable engine-probe
.agents/skills/impeccable/scripts/impeccable context --target apps/web/src/app/page.tsx
```

[PRODUCT.md](../PRODUCT.md) was initialized from the existing requirements with the owner's confirmation. It links to the authoritative docs rather than replacing them. Keep `PRODUCT.md` limited to durable product rules and requirements links. Implementation status belongs in task plans such as `plan.md`; experiments and scaffold choices are not product rules. The requested design pass established working conventions in [DESIGN.md](../DESIGN.md), rather than inferring them from the scaffold. It is a pre-implementation seed; capture actual tokens and review rendered screens after the first build. Design conventions and a build-path preference are not prerequisites for installing the skill. Use `$impeccable polish <target>` or `$impeccable audit <target>` in Codex, or ask another agent to read the shared skill and run that command.

Automatic edit hooks are optional and harness-specific; this shared install uses manual checks. After changing UI, run `.agents/skills/impeccable/scripts/impeccable detect --json <changed targets>`. If a contributor wants automatic checks, use the skill's hooks setup for their harness. Codex requires approving a project hook through `/hooks`; manual copying alone does not install one. Do not confuse the skills' bundled agent briefs with registered harness subagents.

For optional live browser iteration, start the command with `IMPECCABLE_LIVE_COPY_AGENT=chat` (or `off` to disable Apply), so copy edits remain in the current chat. Upstream otherwise falls back to a local agent CLI with approvals and sandboxing bypassed when no chat is polling. Live iteration needs a running local dev server and browser; it is not required for ordinary skill use. No live server or automatic hook is started during installation. Ephemeral Impeccable files are ignored, while shared context/config artifacts remain trackable.

### Pstack statechart setup

The prose skills need no account or runtime. Statechart requires a TypeScript-capable runtime (the project's pinned Node version qualifies), Java 11+, and TLC. Either use an existing `mise` installation, which downloads its pinned Java/TLC on first use, or provide `TLA2TOOLS` and optionally `JAVA`. Do not add these tools to the web app's dependencies. See [the bundled skill](../.agents/skills/statechart/SKILL.md).

For a local TLC install without mise, from the repo root:

```sh
mkdir -p .ai-local/tools
curl -fL https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar -o .ai-local/tools/tla2tools-1.7.4.jar
```

Verify SHA-256 `936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88` with `shasum -a 256` (macOS) or `sha256sum` (Linux) before use. This pin matches the vendored `statechart/scripts/run.ts`. Then set `TLA2TOOLS` to that file's absolute path for each checker invocation. Set `JAVA` if Java is not on PATH. Work on model copies in a scratch folder outside the repo; the output directory must be new or empty. The checker returns 0 for a pass, 1 for a detected violation, and 2 for a tool error. Its local Java RMI socket may require permission outside an agent sandbox.

Optional SVG rendering uses `pele@1.9.0`, installed outside the app workspace only when requested, per [render.md](../.agents/skills/statechart/references/render.md). Optional video generation needs suitable rendering/encoding tools; `ketchup-video` specifies the artifact, not a bundled encoder. Formal-verification authoring selects a verifier for the actual target; installation does not create or prove a model of this application.

## Target architecture and open choices

Follow [ADR 0001](adr/0001-nextjs-application-and-shared-workspace.md) for the application/worker boundary and outstanding technology choices, and [ADR 0002](adr/0002-validated-contracts-and-data-trust-boundaries.md) for integration and trust boundaries. There is no worker, scheduler, ingestion, or publication execution in the current code, so no worker startup command exists. Product follow-ups remain in the [question record](requirements-questions.md).
