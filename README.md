# Smart Financial Advisor

A web application for novice investors researching Thai and US common stocks. It provides evidence and explanations; it does not execute trades. This is a fresh implementation, with selective reuse from the previous LLMFA project only when useful.

## Project status

The owner finalized the first [requirements baseline](docs/functional-requirements.md) on 7 November 2026 and confirmed readiness to implement Phase 1: Home shared content, Stock Detail, and AI Q&A/comparison without login. Later features and unresolved details are defined in the requirements and [question record](docs/requirements-questions.md).

The code currently supplies only a **fixture scaffold** (SFA-5): three Thai page shells with translation dictionaries prepared for later English UI, shared contracts and fake examples, local checks, and CI. No live financial data, AI answers, accounts, chat persistence, or worker is implemented. The [accepted ADRs](docs/adr/README.md#decisions) describe the target architecture, including separate background execution.

## Local development

Install the pinned Node and pnpm versions in the [developer guide](docs/developer-guide.md#bootstrap). Then run the following commands.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Run `pnpm check` for lint, typechecking, unit tests, and a production build. See the [developer guide](docs/developer-guide.md) for setup, routes, and code entry points.

## Documentation

- [Functional requirements](docs/functional-requirements.md): product scope, behavior, and acceptance criteria; specifications rather than implemented features.
- [Question record](docs/requirements-questions.md): owner answers and unresolved decisions.
- [Visual design](DESIGN.md) and [UI conventions](docs/ui-conventions.md): selected working direction, Phase 1 interaction rules, and route briefs for the next UI implementation; design targets rather than implemented behavior.
- [Source notes](docs/source-notes.md): source precedence, original PDF references, and historical context.
- [Architecture decisions](docs/adr/README.md): significant architectural choices, supported rationale, and ADR criteria.
- Read the layer responsibilities, trust rules, and handoffs in [Contracts and integration boundaries](docs/contracts-and-boundaries.md).
- [AGENTS.md](AGENTS.md): contributor instructions, with supporting guidance in [.agents](.agents/README.md).
