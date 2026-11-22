# Smart Financial Advisor system block diagram

Proposed Phase 2 architecture

```mermaid
---
config:
  theme: neutral
  flowchart:
    curve: linear
---
flowchart TB
    users["Guests and signed-in investors"]
    feeds["Market data and approved news feeds"]
    filings["US SEC EDGAR, Thai SEC iDISC<br/>and permitted issuer releases"]

    subgraph system["Smart Financial Advisor"]
        web["Next.js on Vercel<br/>Web UI, chat, Stock Discovery and portfolio"]
        jobs["Apache Airflow<br/>Ingestion, Daily Brief and stock summaries"]
        db[("Supabase PostgreSQL<br/>Shared evidence, publications and jobs<br/>Account-private records")]
        index[("Pinecone<br/>Public passage index")]
    end

    users --> web
    feeds -->|Live market data| web
    feeds -->|Indices and news| jobs
    filings --> jobs
    web -->|First-open job ID| jobs
    web <-->|Public and authorized account records| db
    jobs <-->|Shared records only| db
    jobs -->|Index public passages| index
    web -->|Search public passages| index
```

Guests can browse Home and Stock Detail. Signed-in investors can use chat, Stock Discovery, Watchlist, Portfolio and Investor Profile. The proposed sign-in provider is Supabase Auth.

Airflow fetches live indices and approved news feeds for the hourly Daily Brief. Airflow also generates stock summaries on first open. Both publications use public inputs and are published in Thai and English. Next.js and the publication worker call models through the Vercel AI SDK. Sending private context requires approved provider terms.

[Final architecture](../final-architecture.md) · [Backend data flow](../backend-data-flow.md)
