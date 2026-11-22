# Chat and Stock Discovery

```mermaid
---
title: Figure 3. Chat and Stock Discovery workflow
config:
  theme: neutral
  flowchart:
    curve: linear
    rankSpacing: 36
---
flowchart TB
    investor(["Signed-in investor opens chat"])
    route{"Investor goal?"}

    investor --> route

    route -->|Research a stock or compare stocks| evidence["Retrieve relevant market data and public evidence"]
    evidence --> verify["Check claims against the sources"]
    verify --> answer["Show a cited answer<br/>or explain evidence gaps"]

    route -->|Find stocks in main chat| plan["Propose screening criteria"]
    plan --> review["Investor reviews the screening plan"]
    review -->|Investor confirms the plan| screen["Run the confirmed screen"]
    screen --> matches["Show cited matches<br/>and offer to add them to Watchlist"]
```

As shown in Figure 3, a signed-in investor can use chat to research stocks or use Stock Discovery in main chat to find stocks that match their preferences. For research questions, the application checks its claims against public evidence and returns a cited answer. For Stock Discovery, the application proposes screening criteria for the investor to review. The server runs the screen only after the investor confirms the plan, then shows the matches with supporting evidence.

[Detailed Chat and Stock Discovery design](../backend-data-flow.md#request-time-evidence-and-chat)
