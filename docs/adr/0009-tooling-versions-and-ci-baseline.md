# ADR 0009 Tooling, Versions, and CI Baseline

Status: Proposed

Date: 2026-11-07

Decision owner: Project owner / Lead

Related requirements: FR-01–FR-02, FR-19–FR-21; Q04, Q05, Q08; SFA-5 AC1–AC6

## Context

The SFA-5 brief prescribes pnpm, TypeScript, Next.js, Zod, Vitest, ESLint, Playwright, and CI, but its suggested versions were explicitly unverified. Exact stable release metadata was checked against the Node release index and npm registry on 7 November 2026. Setup must be reproducible without global tool changes, credentials, deployment, or live financial/LLM services.

## Decision

Propose these exact versions, committed in manifests/lockfile and tested locally on macOS arm64:

- Node **26.13.0**, LTS **Lithium**, released 28 October 2026; `.nvmrc` and CI use this pin. The local Node download was checked against Node's SHA256 release file.
- pnpm **12.18.0**; `packageManager`, engines, CI, and bootstrap docs agree.
- Next and eslint-config-next **16.4.5**; React and react-dom **19.3.1**.
- TypeScript compiler **7.0.2** via `@typescript/native: npm:typescript@7.0.2`.
- TypeScript API compatibility package **6.0.2** via `typescript: npm:@typescript/typescript6@6.0.2`.
- Zod **4.6.7**, Vitest **5.1.0**, ESLint **10.14.0**, Playwright test **1.65.0**.
- `@types/node` **26.6.6**, `@types/react` and `@types/react-dom` **19.3.0**, `server-only` **0.0.1**.

All downloaded direct dependencies are exact, including aliases; `workspace:*` links the local contracts package. The lockfile pins transitive packages. pnpm's native executable and Node were installed under a temporary tooling directory for local verification; no global Node/pnpm update was performed.

Use ESLint CLI with Next's flat configuration. `check` runs lint, generated-route-aware typecheck, non-watch unit tests, and production build in that order. Playwright Chromium tests run separately against a production server; no existing server is reused. CI runs the frozen install, `check`, browser installation, and smoke tests for branch pushes and PRs. GitHub Actions have read-only permissions and immutable commit pins (checkout v7.0.1, setup-node v7.1.0, pnpm/action-setup v6.1.1). No deploy/publish steps or custom secrets exist.

## Alternatives considered

- Install the suggested TypeScript 7 directly under `typescript`: tested and rejected because `typescript-eslint` refuses its missing compiler API. Use Microsoft's documented side-by-side aliases instead; `tsc` remains TypeScript 7 and API consumers import TypeScript 6. The compatibility package exposes `tsc6`, avoiding binary-name collisions.
- Downgrade ESLint to 9: rejected because that release line is EOL. Next 16.4.5 explicitly supports ESLint 10, although three bundled plugins still declare older peer ranges.
- Add a task runner, a separate contracts build, another test framework, hosting, or deployment: unnecessary for setup and outside the owner's scope.

## Consequences

The complete supported toolchain needs Node 26; the Mac's pre-existing Node 20/pnpm 8 are insufficient. There is one documented peer-warning limitation: `eslint-plugin-import@2.32.0`, `eslint-plugin-jsx-a11y@6.10.2`, and `eslint-plugin-react@7.37.5` have peer ranges ending at ESLint 9. No peer ranges are silently overridden; actual lint and build validation exercise the installed stack. Recheck these peers on upgrades.

The initial npm advisory scan found moderate dev-only minimatch advisory GHSA-g3hv-75wg-m249. A targeted pnpm override moves affected versions 7–10 to verified stable **11.0.5**; remove it when upstream ranges include a patched release. Full checks passed with the override and the repeated scan reported zero known advisories. pnpm recorded exact release-age exceptions for `playwright-core@1.65.0`, `minimatch@11.0.5`, and `@isaacs/nonrecursive-glob-match@1.1.0`; there is no global release-age bypass. Native build permissions are limited to esbuild, sharp, and unrs-resolver.

SFA-5 checks do not establish data coverage, freshness, AI accuracy, privacy controls for future accounts, or a production service level. Q04/Q05/Q08 and database/hosting/provider/model choices remain open. Revisit the compatibility alias and override when upstream tools support TypeScript 7's API and patched glob versions directly.

## Validation evidence

On 7 November 2026, `pnpm check` passed locally: lint with zero warnings, typecheck, **16 unit tests in two files**, and production build. `pnpm audit --json` after the override reported **0 vulnerabilities**. `pnpm test:e2e` passed **5 Chromium tests** for Thai/demo routes, keyboard navigation/focus, no external browser requests, the US fixture, and unknown-listing 404. The dev server returned HTTP 200, and desktop Home/mobile Stock screenshots were visually checked for readable Thai and overflow.

Reproduced from a clean temporary clone of scaffold commit `c2a944b`, with no copied node_modules, build outputs, environment files, or credentials: `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test:e2e`, and `pnpm audit --json` all passed with the same test counts and zero advisories. `pnpm dev` started successfully; Home, Thai Stock, and Chat returned HTTP 200 with UTF-8 demo labels. Git status remained clean, and no agent-instruction file was generated. This uses the normal shared dependency/browser download caches, not an empty-cache or offline installation. Hosted CI results are recorded separately in the PR handoff after execution.

## References

- [Node release index](https://nodejs.org/dist/index.json) and [26.13.0 checksums](https://nodejs.org/dist/v26.13.0/SHASUMS256.txt)
- npm metadata: [pnpm](https://registry.npmjs.org/pnpm/12.18.0), [Next](https://registry.npmjs.org/next/16.4.5), [React](https://registry.npmjs.org/react/19.3.1), [react-dom](https://registry.npmjs.org/react-dom/19.3.1)
- npm metadata: [TypeScript 7](https://registry.npmjs.org/typescript/7.0.2), [TypeScript 6 API](https://registry.npmjs.org/@typescript%2Ftypescript6/6.0.2), [Zod](https://registry.npmjs.org/zod/4.6.7), [Vitest](https://registry.npmjs.org/vitest/5.1.0)
- npm metadata: [ESLint](https://registry.npmjs.org/eslint/10.14.0), [Next ESLint config](https://registry.npmjs.org/eslint-config-next/16.4.5), [Playwright](https://registry.npmjs.org/@playwright%2Ftest/1.65.0), [server-only](https://registry.npmjs.org/server-only/0.0.1)
- npm metadata: [Node types](https://registry.npmjs.org/@types%2Fnode/26.6.6), [React types](https://registry.npmjs.org/@types%2Freact/19.3.0), [React DOM types](https://registry.npmjs.org/@types%2Freact-dom/19.3.0)
- [Microsoft's TypeScript side-by-side guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)
- [Next ESLint setup and compatibility](https://nextjs.org/docs/app/api-reference/config/eslint), [ESLint version support](https://eslint.org/version-support/)
- [Minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [patched registry release](https://registry.npmjs.org/minimatch/11.0.5)
- [pnpm settings](https://pnpm.io/settings), [Playwright webServer](https://playwright.dev/docs/test-webserver)
- Official CI releases: [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0), [pnpm/action-setup v6.1.1](https://github.com/pnpm/action-setup/releases/tag/v6.1.1)
- [Developer guide](../developer-guide.md), [open questions](../requirements-questions.md)
