# Backend data flow

These diagrams show the proposed architecture at the end of Phase 2. Airflow runs background jobs, Next.js serves interactive requests, Supabase stores durable state, and Pinecone indexes public evidence. [Final design RFC](final-architecture.md) · [Delivery phases](final-architecture.md#delivery-phases) · [Current server entry points](../developer-guide.md#where-to-work)

## Scheduled evidence ingestion

Airflow ingests public news and filings for retrieval-augmented generation (RAG). The Daily Brief reads completed news batches from Supabase independently of vector indexing.

```mermaid
flowchart TB
    Schedule["Airflow scheduler"]
    Schedule -->|":00 and :30 every hour, Asia/Bangkok"| NewsJob["News ingestion DAG"]
    Schedule -->|"Weekdays, hourly 06:00–23:00 inclusive, America/New_York"| USJob["US filing ingestion DAG"]
    Schedule -->|"Weekdays at 09:00, 14:00 and 22:00, Asia/Bangkok"| THJob["Thai filing ingestion DAG"]
    News["Permitted official releases"] --> NewsJob
    US["US SEC EDGAR filings and Company Facts"] --> USJob
    TH["Thai SEC iDISC and verified issuer filings"] --> THJob
    NewsJob & USJob & THJob --> Ingest["Airflow tasks · fetch changes, extract and validate"]
    Bulk["Operator-triggered backfill and reindex DAG"] -->|Reuse the ingestion and embedding steps| Ingest
    Ingest --> Evidence[("Supabase PostgreSQL<br/>Versioned passages, verified figures and citations")]
    Evidence -->|News check completed| Batch["Mark news batch complete for the Daily Brief"]
    Evidence --> Embed["Embed changed public passages"]
    Embed --> Index[("Pinecone · vectors, passage IDs and scope metadata")]
    Index -->|Confirm all required vectors are searchable| Ready["Activate the version for retrieval in Supabase"]
```

A news check with zero new stories still completes. Keep the previous complete version eligible for retrieval if extraction or indexing fails. Limit concurrent backfills and reindexing to leave capacity for routine refreshes and publications. [News corpus](functional-requirements.md#fr-03-daily-brief-content-and-publication) · [Filing coverage](functional-requirements.md#fr-12-financial-data-and-news) · [Indexing and recovery](final-architecture.md#public-evidence-ingestion-and-rag)

## Shared publications

```mermaid
flowchart TB
    Schedule["Airflow scheduler"] -->|"Hourly at :25, Asia/Bangkok"| Brief["Daily Brief DAG"]
    Web["Next.js Stock Detail"] -->|Record first-open job| Jobs[("Supabase · durable publication jobs")]
    Web -->|Send job ID after recording| API["Authenticated Airflow REST API"]
    API --> Summary["Stock summary DAG"]
    Sweep["Scheduled Airflow recovery task"] -->|Find pending jobs and expired claims| Jobs
    Sweep -->|Resume work by job ID| Summary
    Brief & Summary -->|Invoke Node.js worker| Worker["TypeScript publication worker<br/>Claim job and fix evidence cutoff"]
    Worker <-->|Claim and track job| Jobs
    News[("Supabase · latest completed news batch")] -->|Read at Daily Brief job start| Worker
    Evidence[("Supabase · verified figures, filing passages and issuer news")] -->|Stock summary evidence| Worker
    Market["Market data adapter"] -->|Observed price and volume for stock summaries| Worker
    Worker -->|Score brief stories and generate from fixed evidence| Model["Model via Vercel AI SDK"]
    Model -->|Structured output| Publish["Worker validates claims and citations<br/>Commits both languages and their common evidence snapshot"]
    Publish --> Publications[("Supabase PostgreSQL · shared publications")]
    Publications --> Read["Home and Stock Detail show the latest valid publication<br/>Chat resolves today's Daily Brief"]
```

The brief uses eligible stories published since Bangkok midnight. If no newer completed batch is available after an ingestion failure, the last successful brief keeps its timestamp and Home shows the delay. Next.js records first-open jobs by listing and Bangkok date. Stock Detail polls the server for today's summary and shows a dated earlier summary or a preparing state while it waits. [FR-03](functional-requirements.md#fr-03-daily-brief-content-and-publication) · [FR-11](functional-requirements.md#fr-11-shared-daily-stock-summary) · [Airflow job execution](final-architecture.md#airflow-schedules-and-job-execution)

## Request-time evidence and chat

```mermaid
flowchart TB
    Account["Signed-in investor · main or stock-bound chat"] --> Access["Next.js · verify sign-in, request and usage limits"]
    Access --> Context["Resolve stock, language and permitted history"]
    Brief[("Supabase · today's successful Daily Brief")] --> Context
    Access --> Select["Check ownership and current context settings"]
    Select <-->|Read authorized records| Private[("Supabase · account-private records")]
    Select -->|Add permitted fields and calculated holdings values| Context
    Context --> Model["Approved model via Vercel AI SDK"]
    Model -->|Bounded tool calls| Tools["Server tools · resolve issuer, period, basis and cutoff"]
    Tools <-->|Quotes and price history| Market["Market data adapter"]
    Tools <-->|Verified figures, eligible versions, and ranked text with citations| Evidence[("Supabase · public evidence")]
    Tools -->|Embed scoped financial query and search eligible versions| Index[("Pinecone · public passage index")]
    Index -->|Ranked passage IDs| Tools
    Tools -->|Validated evidence| Model
    Model --> Check["Server checks claims, citations and guardrails"]
    Check --> Answer["Return cited answer or report the evidence gap"]
```

## Other backend reads and workflows

```mermaid
flowchart TB
    Market["Market data adapter<br/>Listing search, quotes, charts and indices"] --> Web["Next.js server and adapters"]
    Public[("Supabase · verified financials, issuer news and publications")] --> Web
    Web --> Display["Home, Stock Detail and listing search"]

    Account["Signed-in investor"] --> Access["Next.js · verify session and ownership"]
    Access <--> Private[("Supabase · Watchlist, holdings, Investor Profile and saved chat")]
    Private -->|Authorized listings| Watchlist["Watchlist"]
    Events["Corporate and macro event sources under evaluation"] --> Watchlist
    Market --> Watchlist
    Private -->|Authorized holdings| Value["Server calculates portfolio value and price P/L"]
    Market -->|Observed quotes| Value
    FX["USD/THB source under evaluation"] -->|Timestamped rate| Value
    Value --> Portfolio["Portfolio and Home portfolio overview"]

    Access -->|Investor's screening preferences| Propose["Model proposes filters"]
    Propose -->|Next.js validates and saves| Plan[("Supabase · versioned Discovery plan")]
    Access -->|Investor confirms exact version| Confirm["Next.js validates confirmation"]
    Plan --> Confirm
    Confirm --> Screen["Server runs the confirmed screen"]
    Public -->|Verified fundamentals| Screen
    Market -->|Market inputs where available| Screen
    Screen -->|Validated matches and evidence| Explain["Model explains why results match"]
    Explain --> Results["Discovery results"]
```

Use the same current USD/THB rate for portfolio cost and value. Discovery uses signed-in access in the proposal, with the access rule open in Q03. [Portfolio valuation](functional-requirements.md#fr-22-current-fx-valuation) · [Discovery confirmation](functional-requirements.md#fr-15-discovery-plan-and-user-confirmation) · [Q03](../requirements-questions.md#q03-access-persistence-and-languages)

## What the model receives

| Workflow | Inputs |
| --- | --- |
| Daily Brief | Eligible news since Bangkok midnight, references, and the evidence cutoff. The model scores stories. The worker selects them in code and sends the resulting snapshot for generation in both languages. |
| Stock summary | Resolved listing, observed prices and volume, verified figures and filing passages, issuer news, and source references and timestamps. |
| AI Q&A and comparison | The investor's message, requested language, permitted history, resolved stock context when applicable, and today's Daily Brief when available. Server tools can add quotes, figures, and cited passages. Comparisons retrieve each issuer separately and align periods, currencies, and units in code. |
| Personal context in chat | Relevant fields from an enabled Investor Profile and any Watchlist or Portfolio context attached to the current question. The server applies current permissions when replaying earlier messages and sends private context only under approved model terms. |
| Discovery | Screening preferences to propose a plan, then validated matches and their evidence to explain the results after the user confirms the plan and the server runs it. |

Supabase keeps source URLs, document versions, citation locations, fiscal periods, and separate publication, observation, fetch, and search visibility times where applicable. The same multilingual embedding model handles public passages and scoped evidence queries. [Retrieval design](../rfcs/financial-evidence-retrieval.md)

The worker validates source IDs and bounds network fetches. The server treats retrieved text as untrusted, validates tool calls, and checks citations against the claims they support. Account-private records and chat stay out of shared jobs, indexes, outputs, caches, and logs. [Trust and privacy](../contracts-and-boundaries.md#trust-and-privacy) · [Final design checks](final-architecture.md#evidence-needed-before-acceptance)
