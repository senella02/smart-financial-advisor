# ADR 0003 Value Holdings at Current FX

Status: Accepted  
Date: 2026-11-06  
Decision owner: Project owner  
Decision source: Owner selected current FX with FX gains/losses excluded during the requirements kickoff  
Related requirements: FR-06, FR-09, FR-10, FR-22; Q01-Q02

## Context

Portfolio is a low-priority record of current holdings and separate purchase positions, without a transaction ledger. Home and Portfolio must display aggregate THB values even when some holdings trade in USD. Reconstructing actual historical THB investment returns would require purchase-date FX and additional accounting rules.

## Decision

Store purchase prices in the stock's trading currency. Use one available current USD/THB rate consistently within a valuation snapshot to convert both current value and purchase cost. Report unrealized price P/L with FX gains/losses excluded. Historical purchase FX and user-entered FX are not required.

Label converted cost as using current FX and distinguish price P/L from a full historical THB investment return. The formulas and fixed example are in FR-22. Currency conversion is deterministic application behavior rather than a calculation invented by the model.

This decision does not finalize the previous-close convention for daily movement, treatment of same-day purchases, a provider, or an acceptable FX-data age; Q02 tracks those details.

## Alternatives considered

- Historical purchase FX, including FX gains/losses in returns. Not chosen because the owner selected the simpler current-FX rule.
- Separate native-currency totals only. Not chosen because the target requires a THB portfolio overview.

## Consequences

Users do not need to enter FX for each purchase. THB cost is a current conversion of native cost, not historical THB cash spent. Existing price gains expressed in THB can vary with the conversion rate even though FX investment returns are excluded. Missing FX means the THB aggregate is incomplete; a guessed rate is not acceptable.

Revisit if the product later needs broker reconciliation, actual THB performance, or a transaction ledger. Those features would require a new financial data model and acceptance examples.

## References

- [Valuation formulas in functional requirements](../functional-requirements.md#fr-22-current-fx-valuation)
- [Remaining portfolio questions](../requirements-questions.md)
