# Backend data flow

This is the backend design for the Phase 1 prototype and later account features. The Yahoo Finance market-data adapter exists today. Scheduled ingestion, evidence storage, publication jobs, and model integration are planned. Dotted arrows show later delivery paths. [Phase 1 deployment diagram](adr/0006-vercel-hosting-and-scheduled-publication-trigger.md#phase-1-deployment-diagram) · [Current server entry points](developer-guide.md#where-to-work) · [Access requirements](functional-requirements.md#fr-21-access-and-languages)

## Scheduled evidence ingestion

The ingestion worker builds the corpus for retrieval-augmented generation (RAG). The same public news feeds the Daily Brief. Live quotes and chart data use the request-time adapter shown below.

```mermaid
flowchart TB
    Schedule["Vercel Schedules"] -->|":00 and :30 every hour, Asia/Bangkok"| NewsJob["Official news check"]
    Schedule -->|"Weekdays, hourly 06:00–23:00 inclusive, America/New_York"| USJob["US filing check"]
    Schedule -->|"Weekdays at 09:00, 14:00 and 22:00, Asia/Bangkok"| THJob["Thai filing check"]
    NewsJob & USJob & THJob --> Queue["Vercel Queues · evidence ingestion"]
    Queue --> Ingest["Vercel Function · ingestion worker<br/>Resolve configured source, bound fetches and detect new or amended items"]
    News["Permitted official releases<br/>Central-bank policy, inflation, jobs and pilot issuer earnings"] --> Ingest
    US["US SEC EDGAR filings and Company Facts<br/>Refresh facts for issuers with new or amended filings"] --> Ingest
    TH["Thai SEC iDISC and verified issuer copies<br/>Annual and interim filings"] --> Ingest
    Ingest -->|Extract passages and reconcile issuer, period, basis, currency and units| Stage[("Supabase PostgreSQL · staged evidence<br/>Versioned passages, verified figures, source metadata and citations")]
    Stage --> Text["Phase 1 · PostgreSQL full-text indexing<br/>Segment Thai text"]
    Stage -.->|Embed changed public passages| Vector[("Later · Pinecone<br/>Vectors, passage IDs and scope metadata")]
    Text --> Ready["Expose complete evidence in Supabase<br/>Activate filing version or complete news batch"]
    Vector -.->|Confirm search visibility| Ready
```

The filing pilot covers AAPL, JPM, and WMT in the US and ADVANC, KBANK, and PTT in Thailand. Seed the latest annual report, latest interim filing, and comparable prior-year interim filing for each issuer. Keep the last complete version eligible if an update fails. A news check with zero new stories still completes. [Official news corpus](functional-requirements.md#fr-03-daily-brief-content-and-publication) · [Pilot filing scope](functional-requirements.md#fr-12-financial-data-and-news) · [Evidence retrieval RFC](rfcs/financial-evidence-retrieval.md)

## Shared publications

```mermaid
flowchart TB
    Schedule["Vercel Schedules"] -->|"Daily Brief every hour at :25, Asia/Bangkok"| Queue["Vercel Queues · publication"]
    Web["Next.js Stock Detail"] -->|First open that Thai calendar day · record and dispatch job ID| Queue
    Queue --> Worker
    News[("Supabase · latest completed news batch")] -->|Read when Daily Brief job starts| Worker
    Filings[("Supabase · verified figures, filing passages and issuer news")] -->|Stock summary evidence| Worker
    Market["Yahoo Finance · observed price and volume"] -->|Stock summary market data| Worker
    Worker["Vercel Function · publication worker<br/>Claim job and fix evidence cutoff"] -->|Score eligible news for Daily Brief| Model["Gemini via Vercel AI SDK"]
    Model -->|Story scores| Worker
    Worker -->|Fixed public evidence snapshot| Model
    Model --> Publish["Worker checks claims and citations<br/>Commits both languages and the same evidence snapshot"]
    Publish --> Publications[("Supabase PostgreSQL<br/>Shared publications and durable job state")]
    Publications --> Read["Home and Stock Detail read latest successful publication<br/>Chat reads today's Daily Brief"]
```

The hourly brief uses eligible stories published since Bangkok midnight from the latest completed batch at job start. If ingestion fails and no newer completed batch is available, the last successful brief keeps its timestamp and the update shows a delay. The publication worker can resume pending or expired stock-summary claims on its scheduled run. [FR-03](functional-requirements.md#fr-03-daily-brief-content-and-publication) · [First-open workflow](rfcs/ai-workflow-orchestration.md#three-workflow-shapes)

## Request-time evidence and chat

```mermaid
flowchart TB
    Guest["Phase 1 guest chat<br/>Message, requested language and browser-session history"] --> Context
    Account["Final version chat request"] -.-> SignIn["Next.js verifies sign-in"]
    SignIn -.-> Context
    Brief["Supabase · today's successful Daily Brief"] --> Context
    Private[("Later · Account-private records")] -.-> Access["Verify sign-in, ownership and consent<br/>Select fields and calculate portfolio values in code"]
    Access -.->|Minimum authorized context on approved model terms| Context
    Context["Next.js server<br/>Validate request and usage limits, resolve stock context"] --> ChatModel["Gemini via Vercel AI SDK<br/>Chat and comparison"]
    ChatModel -->|Approved tool call| Tools["Server tools · apply issuer, period, reporting basis and cutoff filters"]
    Yahoo["Yahoo Finance · quotes and price history"] --> Tools
    Evidence[("Supabase · verified figures, filing and news passages, citations")] -->|Structured reads and Phase 1 full-text search| Tools
    Tools -.->|Later · resolve eligible versions| Evidence
    Tools -.->|Embed scoped financial query and search eligible versions| Vector[("Pinecone · public passage index")]
    Vector -.->|Ranked passage IDs| Tools
    Tools -.->|Load ranked text and citations by ID| Evidence
    Tools -->|Validated tool results| ChatModel
    ChatModel --> ChatCheck["Check citations, figures and safety rules"]
    ChatCheck --> Answer["Return cited answer with risk warning, or report an evidence gap"]
```

## Other backend reads and later workflows

```mermaid
flowchart TB
    Market["Yahoo Finance<br/>Listing search, quotes, chart data and indices"] --> Web["Next.js server and shared adapters"]
    Public[("Supabase · complete financial statements, issuer news and shared publications")] --> Web
    Web --> Display["Home, Stock Detail and listing search"]

    Account["Signed-in investor"] -.-> Access["Next.js · verify session and ownership"]
    Access -.-> Private[("Supabase · Watchlist, holdings, Investor Profile and chat history")]
    Private -.->|Authorized saved listings| Watchlist["Watchlist · combine saved stocks with quotes and upcoming events"]
    Events["Corporate and macro event sources<br/>Under evaluation"] -.-> Watchlist
    Market -.-> Watchlist
    Private -.->|Authorized holdings| Value["Portfolio valuation in code<br/>Use the same rate for cost and value"]
    Market -.->|Observed quotes| Value
    FX["USD/THB rate source<br/>Under evaluation"] -.->|Timestamped rate| Value
    Value -.-> Portfolio["Portfolio and Home portfolio overview"]

    Access -.->|Preferences and enabled profile fields| Model["Later · approved model service"]
    Model -.->|Propose screening filters| Plan["Validate and save a versioned Discovery plan"]
    Plan -.->|Investor confirms exact version| Screen["Server runs confirmed stock screen"]
    Public -.->|Verified fundamentals| Screen
    Market -.->|Market inputs where available| Screen
    Screen -.->|Validated matches and supporting data| Model
    Model -.->|Explain why results match| Discovery["Discovery results"]
```

The event and FX providers remain under evaluation. Portfolio values use observed quotes and current FX under FR-22. [Service options](research/final-architecture-service-options.md) · [Portfolio valuation](functional-requirements.md#fr-22-current-fx-valuation) · [Discovery confirmation](functional-requirements.md#fr-15-discovery-plan-and-user-confirmation)

## What the model receives

| Workflow | Data sent to the model |
| --- | --- |
| Daily Brief | Eligible news since Bangkok midnight from the latest completed batch, with source references and the cutoff. The model scores eligible stories. The worker selects stories in code and sends the resulting snapshot for generation in both languages. |
| Stock summary | The resolved listing, observed price and volume, verified figures and filing passages, issuer news, and the titles, links, periods, and timestamps needed for citations and freshness. The first open of each Thai calendar day starts the job. [FR-11](functional-requirements.md#fr-11-shared-daily-stock-summary) |
| AI Q&A and comparison | The visitor's message, relevant session history, requested language, resolved stock context where applicable, and today's successful Daily Brief where available. Approved tools can add observed quotes, verified figures, and public filing or news passages with citations. Comparisons retrieve each issuer separately and align figures by period, currency, and unit in code. |
| Later account features | The server can add relevant fields from an enabled Investor Profile and only the Watchlist or Portfolio context attached to the current question, subject to provider terms. It applies the same permissions to earlier messages. Discovery uses the model to propose screening criteria and explain results. The server executes only the confirmed plan version. |

Supabase keeps source URLs, document versions, page, section, or table references, reporting periods, and separate publication, observation, and fetch times where available. The later vector path uses the same multilingual embedding model for public passages and scoped evidence queries. The Phase 1 generation model plan uses the Gemini API free tier with provider data restrictions applied by the server. [Provider decision](adr/0003-market-data-and-news-provider-selection.md) · [Retrieval design](rfcs/financial-evidence-retrieval.md) · [AI workflow RFC](rfcs/ai-workflow-orchestration.md)

The worker validates source IDs and bounds network fetches. The server keeps retrieved text separate from instructions, validates tool calls, and checks that citations support the claims before returning an answer. It checks the guest message and history against the model provider's data restrictions before sending them. Use scoped database roles and keep account-private records and visitor conversations out of shared jobs, indexes, outputs, caches, and logs. [Trust and privacy](contracts-and-boundaries.md#trust-and-privacy) · [Phase 1 security release gates](functional-requirements.md#11-quality-and-release-acceptance)

## Decisions for team review

| Decision | Options and evidence needed |
| --- | --- |
| Retrieval rollout | Carry the Phase 1 full-text design and the later Pinecone target into the review. Compare full-text search, Pinecone, and pgvector on the same bilingual evaluation set before approving the embedding model and vector rollout. [Retrieval evaluation](rfcs/financial-evidence-retrieval.md#evidence-needed-to-confirm-the-design) |
| Guest usage and operating limits | Set exact request size, tool-call, retry, and guest concurrency limits. Define the latency and operating budget for Phase 1. [Q08](requirements-questions.md#q08-release-quality-and-evaluation) |
| Later account data | Choose a sign-in method, cross-device behavior, and a model service approved for private data. The agreed profile, chat, and backup retention rules are in Q07. [Q03](requirements-questions.md#q03-access-persistence-and-languages) · [Q07](requirements-questions.md#q07-personalization-and-personal-data-controls) |
