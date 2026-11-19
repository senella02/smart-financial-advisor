# Smart Financial Advisor

A web application for novice investors researching Thai and US common stocks. It provides evidence and explanations; it does not execute trades. This is a fresh implementation, with selective reuse from the previous LLMFA project only when useful.

## Product scope

Phase 1 covers shared content on Home, Stock Detail, and AI Q&A and comparison without login. The owner finalized the first [requirements baseline](docs/functional-requirements.md) on 7 November 2026. The [question record](docs/requirements-questions.md) tracks remaining product decisions.

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
- [Visual design](DESIGN.md) and [UI conventions](docs/ui-conventions.md) cover Phase 1 interactions and route design.
- [Source notes](docs/source-notes.md): source precedence, original PDF references, and historical context.
- [Architecture decisions](docs/adr/README.md): significant architectural choices, supported rationale, and ADR criteria.
- Read the layer responsibilities, trust rules, and handoffs in [Contracts and integration boundaries](docs/contracts-and-boundaries.md).
- [AGENTS.md](AGENTS.md): contributor instructions, with supporting guidance in [.agents](.agents/README.md).
