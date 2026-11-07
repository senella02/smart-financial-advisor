import "server-only";
import { stockIdentityFixture, usStockIdentityFixture } from "@sfa/contracts/fixtures";
import { fixtureMarketData } from "./adapters/fixture-market-data";

// Resolve fixture routes locally; no real symbol or exchange lookup is implied.
export async function getDemoStock(market: string, symbol: string) {
  const fixture = [stockIdentityFixture, usStockIdentityFixture].find(({ data }) =>
    data.listing.market === market && data.listing.symbol === symbol);
  if (!fixture) return null;
  const result = await fixtureMarketData.identify(fixture.data.listing);
  return result.status === "available" ? { fixture: true as const, data: result.data } : null;
}
