# Financial evidence retrieval RFC

Proposed · 20 November 2026

The final design uses Pinecone vector search over public evidence and keeps source passages and citations in Supabase PostgreSQL. Evaluate retrieval in Thai and English before rolling it out. [Final design RFC](../final/final-architecture.md#public-evidence-ingestion-and-rag)

## Context

The app needs current quotes, exact financial figures, and passages that explain what an issuer disclosed. The SCB and SCB X mix-up shows what happens when ranking crosses a legal entity boundary. The research report compares retrieval methods and index placement. Its findings establish tradeoffs, while the relative quality of the methods on our corpus is still open. News and filings follow their approved source schedules. [News schedule](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication) · [Filing schedules](../final/functional-requirements.md#fr-12-financial-data-and-news) · [RAG retrieval research](../research/rag-retrieval-methods.md) · [Market data research](../research/thai-and-us-market-data.md)

The [Security and context RFC](architecture-security-and-context.md) defines the proposed ingestion safety and job/version checks. Preserve the approved source-specific schedules rather than treating all ingestion as hourly. Before using a ranked result, load its passage from Supabase and recheck that its exact source version is still eligible. Missing page provenance must remain unknown; PDF creation time is not source publication time. Partial index updates must not activate an incomplete version.

## Proposed design and rationale

### Reuse the shared quote path

Stock Detail calls the existing server-side market data adapter. Chat can request the same quote through a tool whose server handler resolves the listing and invokes that adapter. Both consumers use the configured source, currency, source observation time, and unavailable status. A quote-only request can use those values directly. The model adds value when the answer needs to relate the price to a filing or news. Sharing the adapter keeps the data rules in one place and fits the existing web and worker architecture. [Quote route](../../apps/web/src/app/api/quote/route.ts), [ADR 0001](../adr/0001-nextjs-application-and-shared-workspace.md), [ADR 0002](../adr/0002-validated-contracts-and-data-trust-boundaries.md)

The existing quote adapter substitutes fetch time when the provider omits observation time. Before chat describes a quote as latest, the shared path needs to preserve the observed time or clearly identify it as unknown. This is a specific reason to change the existing path. The same quote can otherwise look fresh simply because it was fetched recently. Keep Stock Detail's page-open and manual refresh behavior. [Price adapter](../../apps/web/src/server/adapters/live-market-data.ts), [FR-02 freshness](../final/functional-requirements.md#fr-02-data-freshness-and-incomplete-data)

### Filter filing evidence before ranking

Resolve the stable legal entity and market from trusted metadata. Apply document type, actual fiscal period, reporting basis, and any historical publication cutoff before ranking. Stock Detail supplies the selected listing. Ask for clarification when `SCB` could mean the bank or SCB X, and retrieve evidence separately for each issuer in comparisons. Both keyword and embedding search can rank the wrong entity highly when that entity is eligible, so this rule belongs at the retrieval boundary. [FR-01 stock identity](../final/functional-requirements.md#fr-01-supported-stock-identity), [FR-13 stock-bound chat](../final/functional-requirements.md#fr-13-stock-bound-chat), [Capstone case in the research report](../research/rag-retrieval-methods.md#the-problem-rag-solves)

Use verified figures and deterministic calculations for numeric answers. Use passages for explanations, with citations to the source version and specific page, section, or table. An answer such as “Why did margins fall?” can use both paths. If evidence is missing within the resolved scope, report the gap. [Accepted filing and financial data sources](../adr/0003-market-data-and-news-provider-selection.md#filings-and-fundamentals), [FR-19 grounded answers](../final/functional-requirements.md#fr-19-grounded-answers-and-citations)

### Target design with Pinecone vector search

1. **Index public evidence.** On each scheduled ingestion pass, the worker saves new or amended filings and news in Supabase with versioned passage IDs, source publication times, URLs, and page, section, or table references. It embeds changed passages with a multilingual model and upserts the vectors, passage IDs, and scope metadata to Pinecone. Stable IDs let the worker retry a partial write. The shared index contains only public evidence. [Retrieval research](../research/rag-retrieval-methods.md#index-capabilities-and-tradeoffs), [Trust boundaries](../contracts-and-boundaries.md#trust-and-privacy)
2. **Publish complete versions.** Once all passages for a version are searchable, the worker marks it ready in Supabase. Until then the previous complete version remains eligible. Supabase retains revision history and records search visibility separately from source publication time. The index can be rebuilt from the public passages in Supabase. [Index freshness](https://docs.pinecone.io/guides/data/check-data-freshness), [ADR 0005](../adr/0005-supabase-postgres-for-shared-and-private-data.md)
3. **Retrieve and cite.** The server resolves the eligible versions in Supabase for the question's entity, period, reporting basis, and cutoff. It embeds the financial question with the same model and queries Pinecone with those version filters. The server loads the ranked passages and citation details from Supabase, verifies their scope, and supplies them to the model. For a Thai question about an English filing, this lets the search match meaning across languages. If the passages do not support the answer, the model reports the evidence gap. [Metadata filters](https://docs.pinecone.io/guides/search/filter-by-metadata), [Grounded answers](../final/functional-requirements.md#fr-19-grounded-answers-and-citations)

Vector similarity ranks passages for a particular question. For the Daily Brief, the publication worker asks the model to score each eligible story's importance to the market that day and selects stories in code. [Publication workflow](ai-workflow-orchestration.md#three-workflow-shapes)

## Alternatives and conditions to revisit

- **Let the model search for a quote through its own data tool.** This can be enough for standalone Q&A when it returns a verified listing and timestamp. The app also displays quotes outside chat, so a shared adapter gives both consumers the same source and freshness rules. Consider another source if the current one lacks coverage, timestamps, or terms that permit the intended use. [ADR 0003 provider selection](../adr/0003-market-data-and-news-provider-selection.md), [Q04 data coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage)
- **Fetch filings on demand for each question.** This avoids advance indexing and can be useful for a rare document request. Routine search would depend on upstream availability plus parsing time during the chat request. Scheduled indexing lets requests search evidence that has already been processed. Compare source publication time with search visibility before deciding whether to poll more frequently.
- **Keep vector search in Supabase.** Using the same multilingual embeddings with `pgvector` lets us test the value of a dedicated index separately from the value of semantic retrieval. Hybrid search is a further option if keyword and vector searches recover complementary passages. [Research on retrieval and index options](../research/rag-retrieval-methods.md#index-capabilities-and-tradeoffs)

Use the [Phase 1 retrieval baseline](../phase-1-planning/architecture.md#retrieval-and-generation) when evaluating the proposed search design.

## Evidence needed to confirm the design

### Proposed comparison

Compare three methods to see whether combining text and vector rankings finds evidence that either method misses on its own.

| Method | What the comparison should show |
| --- | --- |
| **Text-only** | PostgreSQL full-text search with Thai word segmentation. Measure how well it finds exact filing terms, tickers within the resolved scope, section names, and Thai phrases. [PostgreSQL text ranking](https://www.postgresql.org/docs/current/textsearch-controls.html#TEXTSEARCH-RANKING) |
| **Vector-only** | Multilingual embedding search. Measure whether it recovers the right evidence for paraphrases and Thai questions about English filings. Check whether similar wording ranks higher than the passage containing the required fact. |
| **Hybrid** | Combine the same text and vector rankings using reciprocal rank fusion, which uses the positions in each list. Measure whether the combined results preserve exact matches and recover more of the evidence needed for the answer. [Reciprocal rank fusion paper](https://cormack.uwaterloo.ca/cormack/cormacksigir09-rrf.pdf) |

Use the same approved corpus, passage boundaries, document versions, question text, and eligibility filters for all three methods. Limit results to the first five unique passages per resolved issuer for stock questions and five total for market-wide questions. Use the same text ranking and embedding model for the standalone and hybrid runs. Keep the scored questions separate from the questions used to tune ranking. When comparing Pinecone with `pgvector`, hold the embeddings, similarity measure, and filters fixed so that index placement and ranking quality can be evaluated separately. [Retrieval method research](../research/rag-retrieval-methods.md#how-to-compare-the-methods)

### Cases and scoring

Use Thai and English questions about filings and approved news. Include exact terms, same-language paraphrases, Thai questions over English evidence, and English questions over Thai evidence. Report these groups separately. Label the expected issuer, fiscal period, reporting basis, source version, cutoff, and passages or tables that support each answer. Allow equivalent passages that support the same fact. Use multi-part questions and at least one comparison that requires evidence from both issuers. [FinanceBench](https://arxiv.org/abs/2311.11944) · [MIRACL](https://aclanthology.org/2023.tacl-1.63/)

Include cases where the correct response is to clarify or report missing evidence. Test an ambiguous `SCB` reference, bank versus holding-company filings, consolidated versus company-only figures, an amendment published after a requested cutoff, and plausible results with no eligible evidence. [Evidence scope rules](#filter-filing-evidence-before-ranking)

| Criterion | Measure |
| --- | --- |
| **Complete evidence in the top five** | Primary measure. Report the share of answerable questions for which the returned passages together support every required part of the answer. Count each comparison as complete only when both issuers are supported. Also report cases with partial or missing evidence. |
| **Scope correctness** | Count retrieved passages outside the resolved issuer, market, document type, reporting basis, period, or cutoff. On ambiguous questions, check whether the system asks for clarification before retrieval. |
| **Citation support and missing evidence** | With the same answer model, prompt, and structured figures, check whether each material claim is supported by its cited passage or table. For unanswerable questions, check that the answer states the gap. Score this separately from retrieval. [FR-19](../final/functional-requirements.md#fr-19-grounded-answers-and-citations) |
| **Latency, freshness, and cost** | Compare time to usable evidence, time to a cited answer, and time from source publication to search visibility for a new or amended filing. Report median and 95th-percentile latency, errors, and retries under the same workload. Compare search, embedding, and indexing costs at the same request and update volume. |

### Proposed rollout criteria

- Require zero scope violations and zero unsupported material citations on the held-out set. Retrieving before clarifying a genuinely ambiguous issuer or producing an unsupported answer in a no-evidence case also blocks rollout.
- Prefer hybrid if it improves complete-evidence coverage over the stronger standalone method overall, improves Thai-to-English coverage over text-only, and preserves the required evidence for exact-term cases the text baseline gets right. Report how many questions each method gains or loses. Treat a close result on a small sample as inconclusive.
- Require latency, freshness, and cost to fit the limits agreed under [Q08](../requirements-questions.md#q08-release-quality-and-evaluation). Those limits and the size of the evaluation set remain open.

Quote freshness has its own check. Verify that chat and Stock Detail report the same source timestamp for the same observation, including when the timestamp is missing. [Q04 data coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage)
