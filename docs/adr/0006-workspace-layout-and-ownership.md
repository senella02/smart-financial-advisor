# ADR 0006 Workspace Layout and Ownership

Status: Proposed

Date: 2026-11-07

Decision owner: Project owner / Lead

Related requirements: FR-01–FR-05, FR-11–FR-14, FR-19–FR-21; Q04, Q05, Q08

## Context

The owner's SFA-5 setup brief authorizes a fresh, fixture-only foundation so feature contributors can work independently. It prescribes a pnpm TypeScript monorepo while requiring ADRs 0006–0009 to remain Proposed. This record describes the scaffold under review, not an accepted full architecture.

## Decision

Propose `apps/web` for one UI+BFF application and `packages/contracts` for shared schemas, inferred types, internal ports, and explicitly marked examples. Use root tooling without a task runner or extra build for the source-only contracts package.

Frontend owns UI; Backend owns BFF and provider adapter seams; AI owns grounding and generation seams; Lead reviews shared contracts and integrates CI. These are responsibility boundaries, not assignments to named people. Coordinate contract changes before changing consumers. File insertion points are in the [ownership guide](../ownership.md).

## Alternatives considered

- One application with private inline types: fewer folders, but makes independent feature work and later job consumers harder to coordinate.
- Separate backend deployable or a task-runner framework: unnecessary for this setup and outside the prescribed shape.

## Consequences

Contributors can work in separate seams with one shared validation boundary. TypeScript consumers must transpile the contracts source; Next uses `transpilePackages`. A future non-TypeScript consumer or independent distribution would require revisiting packaging. Database, hosting, and provider selection remain open.

## References

- [Requirements](../functional-requirements.md)
- [ADR 0001: fresh build](0001-build-new-with-selective-reuse.md)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [Developer guide](../developer-guide.md)
