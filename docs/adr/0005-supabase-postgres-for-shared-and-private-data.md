# ADR 0005 Supabase PostgreSQL for shared and private data

Status: Accepted

Date: 2026-11-15

Decision source: Owner direction in the SFA-4 working session on 15 November 2026.

Related requirements: [FR-03 shared publications](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication) and [FR-20 personal context isolation](../final/functional-requirements.md#fr-20-personal-context-isolation)

## Context

The web runtime and worker need access to the same durable publication and job state. The original SQLite file worked on a machine with a persistent disk. The deployment in [ADR 0006](0006-vercel-hosting-and-scheduled-publication-trigger.md) gives the web app and worker independent execution lifecycles.

## Decision and rationale

Use PostgreSQL hosted on Supabase for durable application state. Both runtime roles can reach it, and relational constraints and transactions enforce the publication guarantees in [ADR 0004](0004-shared-publication-consistency.md). Supabase is the selected host. Keep the core migrations in PostgreSQL SQL so the schema can move to another PostgreSQL host if needed.

Use PostgreSQL and the same migrations for database-backed development and production. Developers can use local PostgreSQL through the Supabase CLI or a separate hosted development project. This lets tests exercise the same transaction and concurrency behavior as production. Keep development data and credentials separate from production. [Supabase local development](https://supabase.com/docs/guides/local-development/cli/getting-started)

Access the database through server-side modules using scoped roles. Keep shared publication data in a separate schema from account-private data when account features are introduced. The role that reads or generates shared content has no access to private tables. If a schema is exposed through Supabase's Data API, enable row-level security on its exposed tables and account for privileged roles that bypass it. [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Alternatives and tradeoffs

- SQLite gives a single-host deployment an embedded database with no database service to operate. It depends on a persistent disk shared by the web app and worker.
- SQLite for development would reduce local setup. It would also add a second storage implementation and leave PostgreSQL-specific migrations and concurrency behavior untested in the normal development path.
- Another managed or self-hosted PostgreSQL deployment could use the same data model. It would change who operates the service, manages upgrades, and handles backups.

## Consequences

The web app and worker depend on database availability and connection limits. Choose a connection mode for each runtime and keep configuration in the developer guide. Revisit the host if availability, cost, or isolation requirements outgrow it. [Supabase connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres)

## References

- [ADR 0002 Validated contracts and data trust boundaries](0002-validated-contracts-and-data-trust-boundaries.md)
- [ADR 0004 Shared publication consistency](0004-shared-publication-consistency.md)
