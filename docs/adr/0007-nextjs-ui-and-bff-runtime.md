# ADR 0007 Next.js UI and BFF Runtime

Status: Proposed

Date: 2026-11-07

Decision owner: Project owner / Lead

Related requirements: FR-03–FR-05, FR-11–FR-14, FR-20–FR-21

## Context

SFA-5 prescribes Next.js App Router as one UI+BFF deployable. Phase 1 is account-free research, but SFA-5 only creates page shells. It must not implement chat, publication generation, authentication, or live market calls.

## Decision

Propose Server Components for `/`, `/stocks/[market]/[symbol]`, and `/chat`, with server-only application modules under `src/server`. Route Handlers can later expose validated BFF operations when a feature needs them; setup adds no HTTP trigger or writable endpoint.

Keep Thai interface strings in `src/messages/th.ts`, set HTML language to Thai, and provide semantic navigation and keyboard focus. Use fixture-only stock routes, unavailable prices, and a global visible demo label. The minimal CSS is a scaffold, not a visual-design decision.

Disable Next's automatic agent-instruction generation with `agentRules: false` to preserve the owner's shared-guidance boundary; the root AGENTS.md only gains the permitted developer-guide link.

## Alternatives considered

- Client-only UI plus separate API: adds another deployable without a setup need.
- A different framework: outside the owner's prescribed SFA-5 stack.

## Consequences

Server modules can consume shared contracts directly without an internal HTTP hop. Secrets and future provider adapters stay server-only. No hosting platform, cache policy, provider, authentication method, polling, or scheduler is selected. Revisit deployment separation only when actual runtime requirements justify it.

## References

- [ADR 0004: account-free Phase 1](0004-start-with-account-free-research.md)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Next.js agentRules configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/agentRules)
- [Contract boundaries](../contracts-and-boundaries.md)
