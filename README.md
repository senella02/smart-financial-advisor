# Smart Financial Advisor

A web application for novice investors researching Thai and US common stocks. It provides evidence and explanations; it does not execute trades. This is a fresh implementation, with selective reuse from the previous LLMFA project only when useful.

## Project status

The owner finalized the first [requirements baseline](docs/functional-requirements.md) on 7 November 2026 and confirmed readiness to implement Phase 1: Home shared content, Stock Detail, and AI Q&A/comparison without login. Later features and unresolved details are defined in the requirements and [question record](docs/requirements-questions.md).

The code currently supplies only a **fixture scaffold** (SFA-5): three Thai page shells with translation dictionaries prepared for later English UI, shared contracts and fake examples, local checks, and CI. No live financial data, AI answers, accounts, chat persistence, or worker is implemented. The [accepted ADRs](docs/adr/README.md#decisions) describe the target architecture, including separate background execution.

## Local development

Use the Node and pnpm versions pinned in [`.nvmrc`](.nvmrc) and [`package.json`](package.json). With those tools available:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). No credentials or environment configuration are needed. Run `pnpm check` for lint, typechecking, unit tests, and a production build. See the [developer guide](docs/developer-guide.md) for tool bootstrap, testing scope, routes, and compatibility notes.

## Documentation

- [Functional requirements](docs/functional-requirements.md): product scope, behavior, and acceptance criteria; specifications rather than implemented features.
- [Question record](docs/requirements-questions.md): owner answers and unresolved decisions.
- [Source notes](docs/source-notes.md): source precedence, original PDF references, and historical context.
- [Architecture decisions](docs/adr/README.md): significant architectural choices, supported rationale, and ADR criteria.
- [Contracts and boundaries](docs/contracts-and-boundaries.md): current schemas, adapter usage, and implementation limits.
- [AGENTS.md](AGENTS.md): contributor instructions, with supporting guidance in [.agents](.agents/README.md).

## Repository layout

- `apps/web/`: Next.js App Router page shells and server-only fixture adapters.
- `packages/contracts/`: shared schemas, inferred types, internal ports, and marked examples.
- `docs/`: requirements, implementation guides, and ADRs.
- `report-documents/`: supplied source PDFs, preserved as historical evidence.

The previous checkout at `/Users/thpalanand/Repo/llmfa-capstone` is read-only reference material and is not required to run this project.
