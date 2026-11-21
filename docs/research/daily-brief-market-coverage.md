# Daily Brief market coverage research

21 November 2026

This report records the baseline before the owner selected live index and feed fetches. [Current Daily Brief workflow](../rfcs/daily-brief-market-coverage.md)

## Question

What do the current pilot, SFA-4, and the previous LLMFA Morning Briefing provide for an hourly report on Thai and global markets? Compare geographic and asset coverage, evidence for numbers and explanations, publication timing, and reuse.

## Findings

| Reference | Coverage and evidence | Publication and reuse |
| --- | --- | --- |
| Smart Financial Advisor pilot | The confirmed corpus starts with approved official policy, economic data, and issuer releases. FR-03 already calls for market-moving global news, but the final numerical snapshot lists the five Home indices, all from Thailand and the US. | Ingestion checks at `:00` and `:30` Bangkok time. The hourly Brief starts from the latest completed batch and uses one cutoff for both languages. [FR-05 Home indices](../final/functional-requirements.md#fr-05-market-overview) · [Original ingestion decision](../source-notes.md#s6-owner-confirmed-application-and-worker-boundary) |
| SFA-4 at `c3f624a` | The market news adapter reads Google News RSS for Thailand and the US, Yahoo Finance RSS, and Finnhub general news when configured. The method combines and deduplicates headlines and returns up to 16 items with source metadata. The configured searches favor Thailand and the US. The adapter does not establish geographic coverage or verify the body of a story. | The Node worker imports the same adapter as the web code, fetches during the publication run, and stores the published result in SQLite. The branch provides a reference for feed integration and shared imports. [Adapter](https://github.com/senella02/smart-financial-advisor/blob/c3f624a746095a7a4fdbf73f87194846973bd038/apps/web/src/server/adapters/live-market-data.ts#L498-L514) · [Worker](https://github.com/senella02/smart-financial-advisor/blob/c3f624a746095a7a4fdbf73f87194846973bd038/apps/worker/src/index.ts#L152-L189) |
| LLMFA Morning Briefing | The template presents an executive summary, leading market drivers, analysis, and an outlook. The agent prompt requests article research, Thai, US and Japanese index history, macroeconomic series, and crypto quotes. The sample shows how one energy story can connect geopolitical developments, oil prices, equities, and monetary policy. Its final section gives tactical allocation ratings. | The old agent uses web search and article-fetch tools before writing a structured report. The prompt and example establish the intended format and scope, while leaving hourly performance and citation accuracy unmeasured. [Template](https://github.com/llmfa-capstone/llmfa-capstone/blob/a067931aa95f9c29f0f7a3bc51bea25f0b2fe4d2/the_morning_briefing/template.md) · [Example](https://github.com/llmfa-capstone/llmfa-capstone/blob/a067931aa95f9c29f0f7a3bc51bea25f0b2fe4d2/the_morning_briefing/example.md) · [Agent prompt](https://github.com/llmfa-capstone/llmfa-capstone/blob/a067931aa95f9c29f0f7a3bc51bea25f0b2fe4d2/llm/src/agents/daily_report/prompts.py) |

Official releases anchor reported figures and decisions. Headline feeds can surface events outside the official pilot, including cross-market developments. Confirming that a headline exists supplies less evidence than reading the original article or release. A market quote supports the observed move and its timing. A causal explanation needs separate evidence.

## Open evidence

- Establish which news sources permit automated collection, storage, display, and AI use. Yahoo publishes terms with restrictions on automated collection and certain reuse. Google describes News as an index of publisher content. These references leave rights for the specific SFA-4 feeds and underlying articles open. Finnhub entitlement also remains open. [Yahoo terms](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html) · [Google News publisher documentation](https://support.google.com/news/publisher-center/answer/9606634) · [Q04](../requirements-questions.md#q04-supported-data-and-stock-coverage)
- Measure the value of added news against the official-only corpus. Compare geographic coverage, useful stories, verified citations, and duplicate events on a macro-event day, an earnings day, and a quiet day.
- Verify the proposed global benchmarks one at a time. Observe provider coverage, latest trade or release time, closed-market behavior, and source delays. Measure run time and the effect of an unavailable feed before setting a publication deadline.
