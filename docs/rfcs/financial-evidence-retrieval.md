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

Vector similarity ranks passages for a particular question. The hourly Daily Brief gets its stock index observations and news feeds through the shared market data adapter during the run. [Daily Brief inputs](daily-brief-market-coverage.md#fetch-index-observations-and-news-at-run-time)

## Alternatives and conditions to revisit

- **Let the model search for a quote through its own data tool.** This can be enough for standalone Q&A when it returns a verified listing and timestamp. The app also displays quotes outside chat, so a shared adapter gives both consumers the same source and freshness rules. Consider another source if the current one lacks coverage, timestamps, or terms that permit the intended use. [ADR 0003 provider selection](../adr/0003-market-data-and-news-provider-selection.md), [Q04 data coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage)
- **Fetch filings on demand for each question.** This avoids advance indexing and can be useful for a rare document request. Routine search would depend on upstream availability plus parsing time during the chat request. Scheduled indexing lets requests search evidence that has already been processed. Compare source publication time with search visibility before deciding whether to poll more frequently.
- **Keep vector search in Supabase.** Using the same multilingual embeddings with `pgvector` lets us test the value of a dedicated index separately from the value of semantic retrieval. Hybrid search is a further option if keyword and vector searches recover complementary passages. [Research on retrieval and index options](../research/rag-retrieval-methods.md#index-capabilities-and-tradeoffs)

Use the [Phase 1 retrieval baseline](../phase-1-planning/architecture.md#retrieval-and-generation) when evaluating the proposed search design.

## Evidence needed to confirm the design

### Evaluation datasets and runs

| Decision | Dataset and test conditions | Report |
| --- | --- | --- |
| **How well does the answer model use financial evidence?** | Use the public 150-question FinanceBench sample. Give the model each question and its annotated evidence, with retrieval turned off and the reference answer and justification withheld. Use the same evidence and prompt for each model. | Report answer accuracy by question type. Check the figure, unit, currency, fiscal period, calculation, and support for material claims where applicable. |
| **Does hybrid search earn its added cost for this app?** | Use a held-out Smart Financial Advisor set with Thai and English questions and verified evidence from supported Thai and US stocks. Run the three search methods below against the same documents. Give search the question and resolved scope. Keep reference passages and answers in the scorer. | Use complete-evidence coverage as the primary measure. Report per-question gains and losses, `nDCG@5`, scope failures, latency, freshness, and cost. |

Run the same three search methods on FinanceBench as an additional US English benchmark. Index the full source filings for the included questions and score the returned passages against the annotated evidence. Report these results alongside the project results. Apply the rollout criteria to the held-out project set. Use the public sample under its noncommercial terms and record the dataset revision, question IDs, and source filing versions for each run. [FinanceBench paper](https://arxiv.org/abs/2311.11944) · [Public sample and license](https://huggingface.co/datasets/PatronusAI/financebench)

### Proposed comparison

Compare three methods to see whether combining text and vector rankings finds evidence that either method misses on its own.

| Method | What the comparison should show |
| --- | --- |
| **Text-only** | PostgreSQL full-text search with Thai word segmentation. Measure how well it finds exact filing terms, tickers within the resolved scope, section names, and Thai phrases. [PostgreSQL text ranking](https://www.postgresql.org/docs/current/textsearch-controls.html#TEXTSEARCH-RANKING) |
| **Vector-only** | Multilingual embedding search. Measure whether it recovers the right evidence for paraphrases and Thai questions about English filings. Check whether similar wording ranks higher than the passage containing the required fact. |
| **Hybrid** | Combine the same text and vector rankings using reciprocal rank fusion, which uses the positions in each list. Measure whether the combined results preserve exact matches and recover more of the evidence needed for the answer. [Reciprocal rank fusion paper](https://cormack.uwaterloo.ca/cormack/cormacksigir09-rrf.pdf) |

Use the same approved corpus, passage boundaries, document versions, question text, and eligibility filters for all three methods. Limit results to the first five unique passages per resolved issuer for stock questions and five total for market-wide questions. Use the same text ranking and embedding model for the standalone and hybrid runs. Keep the scored questions separate from the questions used to tune ranking. When comparing Pinecone with `pgvector`, hold the embeddings, similarity measure, and filters fixed so that index placement and ranking quality can be evaluated separately. [Retrieval method research](../research/rag-retrieval-methods.md#how-to-compare-the-methods)

### Questions to add to the project set

Write Thai questions as an investor would ask them about filings and approved news. Use translations as paired controls for some questions and add questions originally written in Thai. Report Thai questions over Thai evidence, Thai questions over English evidence, and the matching English-language groups separately. Include these cases.

- **Thai to Thai.** Ask `กำไรสุทธิส่วนที่เป็นของผู้ถือหุ้นของบริษัทใหญ่ของ ADVANC งวดนี้เท่าไร` against a Thai filing with the period specified. Pair an exact line item with a plain-language paraphrase. Include a case that distinguishes consolidated and company-only figures.
- **Thai to English.** Ask `ยอดขายของ AAPL ไตรมาสนี้โตเท่าไรเทียบกับไตรมาสเดียวกันปีก่อน` against an English filing. Fix the quarter in the test case and require evidence for both periods. Include questions that mix Thai wording with an English ticker or filing term.
- **Cross-issuer comparison.** Ask `รายได้ไตรมาสล่าสุดของ AAPL กับ WMT โตเท่าไรเทียบกับช่วงเดียวกันปีก่อน` with a fixed publication cutoff. Check both issuers' actual fiscal periods and require the current and prior-year figures for each issuer.
- **Ambiguity, cutoff, and missing evidence.** Ask `SCB กำไรเท่าไร` without a selected listing and expect clarification when the bank and holding company are both plausible. Include a question whose latest eligible filing predates an amendment and a question for which the approved sources cannot support the requested figure.

For each answerable question, record the expected answer, the facts needed to derive it, the issuer, fiscal period, reporting basis, source version, publication cutoff, and supporting passages or tables. Allow equivalent evidence that supports the same fact. For clarification and missing-evidence cases, record the expected behavior. Keep examples used to tune search out of the held-out set. [Evidence scope rules](#filter-filing-evidence-before-ranking) · [MIRACL](https://aclanthology.org/2023.tacl-1.63/)

### Scoring and reporting

| Criterion | Measure |
| --- | --- |
| **Complete evidence in the top five** | Primary measure. Report the share of answerable questions for which the returned passages together support every required fact. Count a comparison as complete only when the passages support all required facts for both issuers. Also report partial coverage as the share of required facts supported in each question. |
| **Ranking quality (`nDCG@5`)** | Secondary measure for answerable questions. Judge the pooled top-five results from all three methods and include known reference passages in the judged pool. Grade each passage `2` for direct support of a required fact, `1` for related context, and `0` for irrelevant or out-of-scope material. Compute the score within each result list and average issuer scores for a comparison before averaging across questions. [NIST TREC ranking evaluation](https://trec.nist.gov/pubs/trec29/papers/OVERVIEW.DL.pdf) |
| **Scope correctness** | Count retrieved passages outside the resolved issuer, market, document type, reporting basis, period, or cutoff. Run ambiguous questions through the chat entry point with unresolved scope and check whether it asks for clarification before retrieval. |
| **Citation support and missing evidence** | With the same answer model, prompt, and structured figures, check whether each material claim is supported by its cited passage or table. For unanswerable questions, check that the answer states the gap. Score this separately from retrieval. [FR-19](../final/functional-requirements.md#fr-19-grounded-answers-and-citations) |
| **Latency, freshness, and cost** | Compare time to usable evidence, time to a cited answer, and time from source publication to search visibility for a new or amended filing. Report median and 95th-percentile latency, errors, and retries under the same workload. Compare search, embedding, and indexing costs at the same request and update volume. |

### Proposed rollout criteria

- Require zero scope violations and zero unsupported material citations on the held-out set. Retrieving before clarifying a genuinely ambiguous issuer or producing an unsupported answer in a no-evidence case also blocks rollout.
- Prefer hybrid when it reaches the agreed minimum gain in complete-evidence coverage over the stronger standalone method on the project set. Require better Thai-to-English coverage than text-only and preserve complete evidence for the exact-term cases text-only gets right. Report gains, losses, and net gain for the same questions overall and by group. Treat a close result on a small sample as inconclusive.
- Compare the gain with the added 95th-percentile retrieval latency and cost per 1,000 queries at the same load and index update volume. When hybrid yields a positive net gain, report the added cost per additional question with complete evidence at the expected traffic mix. Agree on the minimum gain, sample size, and limits for latency, freshness, and cost before scoring the held-out set. [Q08](../requirements-questions.md#q08-release-quality-and-evaluation)

Quote freshness has its own check. Verify that chat and Stock Detail report the same source timestamp for the same observation, including when the timestamp is missing. [Q04 data coverage](../requirements-questions.md#q04-supported-data-and-stock-coverage)
