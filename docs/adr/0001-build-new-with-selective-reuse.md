# ADR 0001 Build a New Product with Selective Reuse

Status: Accepted  
Date: 2026-11-06  
Decision owner: Project owner  
Decision source: Project owner's instruction in the requirements kickoff on 6 November 2026

## Context

The new Smart Financial Advisor continues the previous LLMFA idea, but the owner explicitly requires a project created from scratch. AI capabilities and tooling evolve quickly, so previous design and technology choices must not constrain the new implementation. Reusable work may still save time and effort.

The previous project is available locally at `/Users/thpalanand/Repo/llmfa-capstone`. Its final report explains what the project builds upon. The new working repository is `/Users/thpalanand/Repo/smart-financial-advisor`.

## Decision

Build the new product in this repository with fresh functional requirements, design, architecture, and tool evaluation. Treat the previous project as a reference. Reuse an isolated component, test asset, or other artifact when it meets current requirements and saves effort after adaptation and verification.

Do not copy the previous application's structure, dependencies, deployment, credentials, personal data, or generated stores as the starting point. No technology has been selected by this decision.

## Alternatives considered

- Continue the previous codebase and incrementally update its features. Rejected because it would carry inherited architecture and does not satisfy the owner's instruction to start from scratch.
- Rebuild every artifact without considering reuse. Rejected because the owner permits reuse that saves time and effort.

## Consequences

Requirements can drive a simpler implementation suited to current capabilities. Architecture decisions require fresh evidence. Reuse needs a focused fit/provenance/dependency check; wholesale migration is not implied. Existing legacy code stays unchanged during requirements work.

Revisit a specific reuse choice if adaptation costs exceed a new implementation or it introduces incompatible assumptions.

## References

- [Functional requirements](../functional-requirements.md)
- [Source notes and selective reuse boundary](../source-notes.md)
