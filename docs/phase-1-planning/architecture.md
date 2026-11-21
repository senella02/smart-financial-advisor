# Phase 1 architecture

Phase 1 covers shared Home content, Stock Detail, and grounded Q&A and comparison. Use the shared evidence and publication job contracts for these workflows. See the [Phase 1 requirements](functional-requirements.md) and [contracts and integration boundaries](../contracts-and-boundaries.md).

## Deployment

Vercel Schedules dispatches recurring news, filing, and Daily Brief jobs. Separate Vercel Queues and Functions handle ingestion and publication in the same Vercel project, starting on Hobby. The web server records a stock-summary job on first open and queues its ID. Supabase PostgreSQL stores evidence, job claims, and completed publications. [Hosting decision](../adr/0006-vercel-hosting-and-scheduled-publication-trigger.md) · [Publication consistency](../adr/0004-shared-publication-consistency.md)

```mermaid
flowchart LR
    Visitor["Visitor"] --> Web

    subgraph Vercel["Vercel project"]
        Web["Next.js web app and API"]
        Scheduler["Vercel Schedules"] -->|Daily Brief every hour at :25 Bangkok time| Queue["Vercel Queues · publication"]
        Scheduler -->|Every 30 min| NewsCheck["Official news check"]
        Scheduler -->|Source-local weekday schedules| FilingCheck["US and Thai filing checks"]
        NewsCheck & FilingCheck --> IngestQueue["Vercel Queues · evidence ingestion"]
        Web -->|First-open stock summary job ID| Queue
        Queue --> Worker["Vercel Function · publication worker"]
        IngestQueue --> IngestWorker["Vercel Function · ingestion worker"]
    end

    Web -->|Record summary jobs and read publications| DB[("Supabase PostgreSQL")]
    Worker -->|Claim jobs and publish results| DB
    IngestWorker -->|Store public evidence and index for full-text search| DB
    Web --> Market["Shared market data adapter"]
    Worker -->|Global indices and approved feeds for Daily Brief| Market
    Worker -->|Stock-summary data| Market
    IngestWorker --> News["Permitted official news releases"]
    IngestWorker --> Filings["US SEC EDGAR and Thai SEC iDISC"]
    Web --> Gemini["Google Gemini API"]
    Worker --> Gemini
```

## Retrieval and generation

On 20 November 2026, the owner chose PostgreSQL full-text search for the prototype. The prototype searches eligible passages with Thai word segmentation and exercises the same scope filters and citation format. Its text search provides the baseline for the bilingual evaluation.

The owner's 20 November 2026 prototype choice was `gemini-3.5-flash-lite` on the Gemini API free tier through `@ai-sdk/google`. The prototype must block sensitive, confidential, or personal information before sending a request to unpaid Gemini. Verify quota for an hourly brief alongside guest chat. [FR-20](functional-requirements.md#fr-20-personal-context-isolation)

See the [financial evidence retrieval RFC](../rfcs/financial-evidence-retrieval.md) for scope filters, citation handling, and evaluation. See the [AI workflow orchestration RFC](../rfcs/ai-workflow-orchestration.md) for shared workflow design.
