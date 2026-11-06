# Developer Guide — SFA-5

This is a fixture-only scaffold for independent Phase 1 feature work. It runs without accounts, environment configuration, credentials, a database, or external market/AI services. The [requirements](functional-requirements.md) remain authoritative; this setup does not deliver their research features.

## Bootstrap

Use Node **26.13.0 LTS** and pnpm **12.18.0**. `.nvmrc`, package engines, packageManager, and CI agree. With an existing Node version manager such as nvm:

```sh
nvm install
nvm use
```

If Corepack is already installed, `corepack pnpm` honors `packageManager`; use it in place of `pnpm` below. Node 26 does not bundle Corepack. To install pnpm without changing global tools, use an isolated temporary directory in your shell:

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

All pages show **ข้อมูลสาธิต / Demo**. No real prices, returns, news, summaries, chat answers, refresh buttons, or writable API endpoints are supplied. The historical contract examples use dates in 2000 and are not today's data. Unknown listings return 404.

## Checks and browser setup

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

On Linux, use `pnpm exec playwright install --with-deps chromium` to install browser system dependencies too. `test:e2e` starts and stops its own production server on port **3100** and requires a successful build first. It refuses to reuse an existing server. Playwright reports and traces stay gitignored.

`pnpm check` aggregates **lint → typecheck → non-watch unit tests → production build**. Browser tests are separate because Chromium must first be installed. `typecheck` generates Next route types before checking the contracts, tooling/tests, and web app. `lint` uses the ESLint CLI and Next flat config, never `next lint`.

CI runs the frozen install, `check`, Chromium installation, and browser smoke on every branch push and pull request. Actions are commit-pinned, permissions are read-only, and there are no deploy jobs, custom secrets, or publishing steps. The [tooling ADR](adr/0009-tooling-versions-and-ci-baseline.md) records versions, primary sources, compatibility constraints, and actual validation results.

## Where to work

Read the [ownership/insertion-point guide](ownership.md) and [contracts/boundary guide](contracts-and-boundaries.md). `packages/contracts/src/index.ts` owns shared schemas/types/ports; `fixtures.ts` owns machine-marked examples. `apps/web/src/server/research.ts` composes fixture adapters for the UI. Future external adapters stay server-only and must validate actual provider responses.

The root lockfile is committed. Change direct versions deliberately, keep them exact, run the affected checks, and update ADR 0009. `workspace:*` is a local package reference, not an unpinned downloaded dependency. Shared-contract changes need producer/consumer coordination and Lead review.

Next's automatic agent-file generation is disabled so running dev does not inject tool instructions into shared guidance. `next-env.d.ts` and `.next` are generated locally and gitignored.

## Limits and open choices

ADRs 0006–0009 are **Proposed**, as requested by the SFA-5 brief. Database, hosting, provider, model, scheduler, and visual design remain open. [Q04](requirements-questions.md#q04-supported-data-and-stock-coverage) coverage/freshness, [Q05](requirements-questions.md#q05-chat-and-discovery-boundaries) operating limits, and [Q08](requirements-questions.md#q08-release-quality-and-evaluation) release acceptance are unresolved. Browser `sessionStorage` is a contract only; no chat persistence is implemented.
