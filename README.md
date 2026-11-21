# Smart Financial Advisor

A web application for novice investors researching Thai and US common stocks. It provides evidence and explanations; it does not execute trades. This is a fresh implementation, with selective reuse from the previous LLMFA project only when useful.

## Requirements and delivery

Phase 1 is a fast capstone prototype covering shared Home content, Stock Detail, and grounded chat. The end of Phase 2 is the target for the full account-based product. [Phase 1 requirements](docs/phase-1-planning/functional-requirements.md) · [Final requirements](docs/final/functional-requirements.md) · [Delivery phases](docs/final/final-architecture.md#delivery-phases) · [Open questions](docs/requirements-questions.md)

## Local development

Install the pinned Node and pnpm versions in the [developer guide](docs/developer-guide.md#bootstrap). Then run the following commands.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Run `pnpm check` for lint, typechecking, unit tests, and a production build. See the [developer guide](docs/developer-guide.md) for setup, routes, and code entry points.

## Documentation

### Phase 1 planning

- [Phase 1 requirements](docs/phase-1-planning/functional-requirements.md) cover capstone scope, the pilot corpus, guest chat, and release checks.
- [Phase 1 architecture](docs/phase-1-planning/architecture.md) covers Vercel jobs, retrieval, and generation.
- [UI conventions](docs/phase-1-planning/ui-conventions.md) and the [visual design guide](DESIGN.md) cover the Phase 1 interface.

### Final requirements and design

- [Final functional requirements](docs/final/functional-requirements.md) define full product scope, shared behavior, and acceptance criteria.
- [Final design proposal](docs/final/final-architecture.md) covers the account-based product and delivery phases.
- [Backend data flow](docs/final/backend-data-flow.md) shows proposed ingestion, publications, and interactive workflows.

### Shared references

- [Question record](docs/requirements-questions.md) tracks owner answers and unresolved decisions.
- [Source notes](docs/source-notes.md) record source precedence and historical context.
- [Research](docs/research/) and [supporting RFCs](docs/rfcs/) cover providers, evidence retrieval, and AI workflows.
- [Architecture decisions](docs/adr/README.md) and [contracts and integration boundaries](docs/contracts-and-boundaries.md) cover decisions, responsibilities, and trust rules.
- [AGENTS.md](AGENTS.md) and the [developer guide](docs/developer-guide.md) cover contributor guidance and setup.
