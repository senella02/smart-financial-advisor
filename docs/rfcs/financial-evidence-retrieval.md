# Financial evidence retrieval RFC

Proposed · 20 November 2026

## Context

The app needs current quotes, exact financial figures, and passages that explain what an issuer disclosed. The SCB and SCB X mix-up shows what happens when ranking crosses a legal entity boundary. The research report compares retrieval methods and index placement. Its findings establish tradeoffs, while the relative quality of the methods on our corpus is still open. This proposal assumes an hourly document ingestion handoff. [RAG retrieval research](../research/rag-retrieval-methods.md), [Market data research](../research/thai-and-us-market-data.md)

## Proposed design and rationale

### Reuse the shared quote path

Stock Detail calls the existing server-side market data adapter. Chat can request the same quote through a tool whose server handler resolves the listing and invokes that adapter. Both consumers use the configured source, currency, source observation time, and unavailable status. A quote-only request can use those values directly. The model adds value when the answer needs to relate the price to a filing or news. Sharing the adapter keeps the data rules in one place and fits the existing web and worker architecture. [Quote route](../../apps/web/src/app/api/quote/route.ts), [ADR 0001](../adr/0001-nextjs-application-and-shared-workspace.md), [ADR 0002](../adr/0002-validated-contracts-and-data-trust-boundaries.md)

The existing quote adapter substitutes fetch time when the provider omits observation time. Before chat describes a quote as latest, the shared path needs to preserve the observed time or clearly identify it as unknown. This is a specific reason to change the existing path. The same quote can otherwise look fresh simply because it was fetched recently. Keep Stock Detail's page-open and manual refresh behavior. [Price adapter](../../apps/web/src/server/adapters/live-market-data.ts), [FR-02 freshness](../functional-requirements.md#fr-02-data-freshness-and-incomplete-data)

### Filter filing evidence before ranking

Resolve the stable legal entity and market from trusted metadata. Apply document type, actual fiscal period, reporting basis, and any historical publication cutoff before ranking. Stock Detail supplies the selected listing. Ask for clarification when `SCB` could mean the bank or SCB X, and retrieve evidence separately for each issuer in comparisons. Both keyword and embedding search can rank the wrong entity highly when that entity is eligible, so this rule belongs at the retrieval boundary. [FR-01 stock identity](../functional-requirements.md#fr-01-supported-stock-identity), [FR-13 stock-bound chat](../functional-requirements.md#fr-13-stock-bound-chat), [Capstone case in the research report](../research/rag-retrieval-methods.md#the-problem-rag-solves)

Use validated structured sources for figures and deterministic calculations. Use passages for explanations, with citations to the source version and specific page, section, or table. An answer such as “Why did margins fall?” can use both paths. If evidence is missing within the resolved scope, report the gap. [FR-19 grounded answers](../functional-requirements.md#fr-19-grounded-answers-and-citations)

### Index document changes in the existing database

Have the worker check for new or amended filings and news hourly under the ingestion assumption. Prepare the changed passages before making a document version searchable. Retain the previous complete version if processing fails. Preserve earlier filing versions and store source publication time separately from search visibility so historical queries respect what was public by their cutoff. The existing database can publish a complete version in one transaction. Hourly document freshness and on-demand quote retrieval each follow their own source clock. [ADR 0001](../adr/0001-nextjs-application-and-shared-workspace.md), [ADR 0005](../adr/0005-supabase-postgres-for-shared-and-private-data.md), [FR-03 Daily Brief](../functional-requirements.md#fr-03-daily-brief-content-and-publication)

Use PostgreSQL full-text search as the reference retrieval path. It can filter and rank in the same store as the issuer and document metadata. Evaluate multilingual embeddings and hybrid ranking against that baseline on the same Thai and English evidence questions. Add a ranking method only when the comparison shows it recovers needed evidence at an acceptable latency. A dedicated index would also need to justify the cost of keeping a second store synchronized. [Retrieval comparison criteria](../research/rag-retrieval-methods.md#how-to-compare-the-methods)

## Alternatives and conditions to revisit

- **Let the model search for a quote through its own data tool.** This can be enough for standalone Q&A when it returns a verified listing and timestamp. The app also displays quotes outside chat, so a shared adapter gives both consumers the same source and freshness rules. Consider another source if the current one lacks coverage, timestamps, or terms that permit the intended use. [ADR 0003 provider selection](../adr/0003-market-data-and-news-provider-selection.md), [Q04 data coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage)
- **Fetch filings on demand for each question.** This avoids advance indexing and can be useful for a rare document request. Routine search would depend on upstream availability plus parsing time during the chat request. Hourly indexing lets requests search evidence that has already been processed. Compare source publication time with search visibility before deciding whether to poll more frequently.
- **Start with hybrid search or a dedicated index.** Either may help if the lexical baseline misses Thai-to-English evidence or filtered queries become slow. Compare evidence recall, scope violations, latency, and update visibility before taking on embedding or index synchronization work. [Research on retrieval and index options](../research/rag-retrieval-methods.md#index-capabilities-and-tradeoffs)

## Evidence needed to confirm the design

Compare a small labeled Thai and English set that includes SCB versus SCB X, amended filings, a historical cutoff, and a Thai question over an English report. For quotes, verify that chat and Stock Detail use the same listing and source time for the same observation, including when the time is missing. Retrieval results, acceptable source delay, and ranking thresholds remain open. [Q04 data coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage), [Q08 evaluation](../requirements-questions.md#q08-release-quality-and-evaluation)
