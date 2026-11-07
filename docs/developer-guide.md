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

## Target architecture and open choices

Follow [ADR 0001](adr/0001-nextjs-application-and-shared-workspace.md) for the application/worker boundary and outstanding technology choices, and [ADR 0002](adr/0002-validated-contracts-and-data-trust-boundaries.md) for integration and trust boundaries. There is no worker, scheduler, ingestion, or publication execution in the current code, so no worker startup command exists. Product follow-ups remain in the [question record](requirements-questions.md).
