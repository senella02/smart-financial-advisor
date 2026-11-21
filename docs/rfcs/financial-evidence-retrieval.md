# Financial evidence retrieval RFC

Proposed · 20 November 2026

On 20 November 2026, the owner chose **Supabase PostgreSQL full-text search** for Phase 1 and **Pinecone vector search** as the target after Phase 1. Supabase holds the evidence and citations in both designs. A bilingual evaluation will test the Pinecone design before rollout.

## Context

The app needs current quotes, exact financial figures, and passages that explain what an issuer disclosed. The SCB and SCB X mix-up shows what happens when ranking crosses a legal entity boundary. The research report compares retrieval methods and index placement. Its findings establish tradeoffs, while the relative quality of the methods on our corpus is still open. This proposal assumes an hourly document ingestion handoff. [RAG retrieval research](../research/rag-retrieval-methods.md), [Market data research](../research/thai-and-us-market-data.md)

## Proposed design and rationale

### Reuse the shared quote path

Stock Detail calls the existing server-side market data adapter. Chat can request the same quote through a tool whose server handler resolves the listing and invokes that adapter. Both consumers use the configured source, currency, source observation time, and unavailable status. A quote-only request can use those values directly. The model adds value when the answer needs to relate the price to a filing or news. Sharing the adapter keeps the data rules in one place and fits the existing web and worker architecture. [Quote route](../../apps/web/src/app/api/quote/route.ts), [ADR 0001](../adr/0001-nextjs-application-and-shared-workspace.md), [ADR 0002](../adr/0002-validated-contracts-and-data-trust-boundaries.md)

The existing quote adapter substitutes fetch time when the provider omits observation time. Before chat describes a quote as latest, the shared path needs to preserve the observed time or clearly identify it as unknown. This is a specific reason to change the existing path. The same quote can otherwise look fresh simply because it was fetched recently. Keep Stock Detail's page-open and manual refresh behavior. [Price adapter](../../apps/web/src/server/adapters/live-market-data.ts), [FR-02 freshness](../functional-requirements.md#fr-02-data-freshness-and-incomplete-data)

### Filter filing evidence before ranking

Resolve the stable legal entity and market from trusted metadata. Apply document type, actual fiscal period, reporting basis, and any historical publication cutoff before ranking. Stock Detail supplies the selected listing. Ask for clarification when `SCB` could mean the bank or SCB X, and retrieve evidence separately for each issuer in comparisons. Both keyword and embedding search can rank the wrong entity highly when that entity is eligible, so this rule belongs at the retrieval boundary. [FR-01 stock identity](../functional-requirements.md#fr-01-supported-stock-identity), [FR-13 stock-bound chat](../functional-requirements.md#fr-13-stock-bound-chat), [Capstone case in the research report](../research/rag-retrieval-methods.md#the-problem-rag-solves)

Use verified figures and deterministic calculations for numeric answers. Use passages for explanations, with citations to the source version and specific page, section, or table. An answer such as “Why did margins fall?” can use both paths. If evidence is missing within the resolved scope, report the gap. [Accepted filing and financial data sources](../adr/0003-market-data-and-news-provider-selection.md#filings-and-fundamentals), [FR-19 grounded answers](../functional-requirements.md#fr-19-grounded-answers-and-citations)

### Target design with Pinecone vector search

1. **Index public evidence.** On each hourly ingestion pass, the worker saves new or amended filings and news in Supabase with versioned passage IDs, source publication times, URLs, and page, section, or table references. It embeds changed passages with a multilingual model and upserts the vectors, passage IDs, and scope metadata to Pinecone. Stable IDs let the worker retry a partial write. The shared index contains only public evidence. [Retrieval research](../research/rag-retrieval-methods.md#index-capabilities-and-tradeoffs), [Trust boundaries](../contracts-and-boundaries.md#trust-and-privacy)
2. **Publish complete versions.** Once all passages for a version are searchable, the worker marks it ready in Supabase. Until then the previous complete version remains eligible. Supabase retains revision history and records search visibility separately from source publication time. The index can be rebuilt from the public passages in Supabase. [Index freshness](https://docs.pinecone.io/guides/data/check-data-freshness), [ADR 0005](../adr/0005-supabase-postgres-for-shared-and-private-data.md)
3. **Retrieve and cite.** The server resolves the eligible versions in Supabase for the question's entity, period, reporting basis, and cutoff. It embeds the financial question with the same model and queries Pinecone with those version filters. The server loads the ranked passages and citation details from Supabase, verifies their scope, and supplies them to the model. For a Thai question about an English filing, this lets the search match meaning across languages. If the passages do not support the answer, the model reports the evidence gap. [Metadata filters](https://docs.pinecone.io/guides/search/filter-by-metadata), [Grounded answers](../functional-requirements.md#fr-19-grounded-answers-and-citations)

Vector similarity ranks passages for a particular question. For the Daily Brief, the publication worker asks the model to score each eligible story's importance to the market that day and selects stories in code. [Publication workflow](ai-workflow-orchestration.md#three-workflow-shapes)

### Phase 1 with Supabase alone

Start with the same versioned passages, scope filters, and citation format. Search the eligible passages using PostgreSQL full-text search with Thai word segmentation for Thai queries and documents. This delivers cited retrieval with one store and gives us a measurable baseline before provisioning Pinecone. Chat calls the same filing and news tools in both designs.

## Alternatives and conditions to revisit

- **Let the model search for a quote through its own data tool.** This can be enough for standalone Q&A when it returns a verified listing and timestamp. The app also displays quotes outside chat, so a shared adapter gives both consumers the same source and freshness rules. Consider another source if the current one lacks coverage, timestamps, or terms that permit the intended use. [ADR 0003 provider selection](../adr/0003-market-data-and-news-provider-selection.md), [Q04 data coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage)
- **Fetch filings on demand for each question.** This avoids advance indexing and can be useful for a rare document request. Routine search would depend on upstream availability plus parsing time during the chat request. Hourly indexing lets requests search evidence that has already been processed. Compare source publication time with search visibility before deciding whether to poll more frequently.
- **Keep vector search in Supabase.** Using the same multilingual embeddings with `pgvector` lets us test the value of a dedicated index separately from the value of semantic retrieval. Hybrid search is a further option if keyword and vector searches recover complementary passages. [Research on retrieval and index options](../research/rag-retrieval-methods.md#index-capabilities-and-tradeoffs)

## Evidence needed to confirm the design

Compare Phase 1 full-text search, Supabase with `pgvector`, and the proposed Pinecone index on the same passages, filters, and result count. Use identical embeddings for the two vector runs. Label the expected source passages for Thai and English questions, including SCB versus SCB X, an amendment after a historical cutoff, a Thai question over an English report, and a question with no supporting evidence.

Record how often the required evidence appears in the first *k* results, scope violations, and whether citations support the generated claims. Report cross-language results separately. Compare end-to-end lookup latency, time until a complete revision becomes searchable, and cost at the same ingestion and query volume. Use those results to assess readiness for the Pinecone rollout. Evaluation thresholds remain open. For quotes, verify that chat and Stock Detail report the same source time for the same observation, including when that time is missing. [Q04 data coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage), [Q08 evaluation](../requirements-questions.md#q08-release-quality-and-evaluation)
