# ADR 0004 Start with Account Free Research

Status: Accepted  
Date: 2026-11-06  
Decision owner: Project owner  
Decision source: Owner clarified Phase 1 access and confirmed research-first delivery during requirements finalization  
Related requirements: FR-03-FR-05, FR-11-FR-14, FR-19-FR-21; Q03, Q05, Q08

## Context

The full target includes personal Watchlist, Investor Profile, and Portfolio features. An earlier access decision required sign-in for saving personal data, but the owner clarified that Phase 1 should focus on Home, Stock Detail, and AI chat without a login system. Account-required AI chat is a future requirement.

## Decision

Deliver shared Home content and Daily Brief, Stock Detail, and grounded AI Q&A/comparison without login in Phase 1, targeting a capstone prototype/demonstration. Defer account infrastructure and personal features. Discovery screening follows in the next feature group; Portfolio and its Home widget have the lowest priority.

Show visitor conversations from both chat entry points in the main history, and only explicitly stock-linked conversations on each stock's detail page. A ticker mention in a general conversation does not create a stock-history link. History lasts only for the current browser session; cross-session restoration and cross-device synchronization are outside Phase 1. These details were confirmed by the owner on 6 November 2026.

A visitor's history remains private to that visitor; account-free access does not authorize a shared public conversation history.

The future account-based version requires an account for AI chat and account-private records. This decision does not select an authentication provider, visitor storage mechanism, guest-to-account migration, or usage limits.

## Alternatives considered

- Require sign-in before any Phase 1 AI interaction. Not chosen because the owner explicitly deferred login while keeping AI chat in scope.
- Deliver all six product areas in Phase 1. Not chosen because the owner accepted research-first delivery and placed Portfolio last.

## Consequences

Phase 1 can demonstrate the core stock-research experience before personal-data and account flows are introduced. Chat cannot depend on saved Watchlist, Portfolio, or Profile context in this phase. Acceptance must cover visitor history isolation, stock binding, evidence, and both supported AI languages.

Account-based history synchronization, migration, and authentication need later decisions. Introducing accounts must preserve the distinction between common generated content and private conversations.

## References

- [Functional scope and access](../functional-requirements.md)
- [Open history and account questions](../requirements-questions.md)
- [ADR 0001](0001-build-new-with-selective-reuse.md)
