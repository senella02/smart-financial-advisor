import "server-only";
import { stockIdentityFixture, usStockIdentityFixture } from "@sfa/contracts/fixtures";
import { fixtureMarketData } from "./adapters/fixture-market-data";
import { liveMarketData } from "./adapters/live-market-data";
import type { ListingKey } from "@sfa/contracts";

// Resolve fixture routes locally; no real symbol or exchange lookup is implied.
export async function getDemoStock(market: string, symbol: string) {
  const fixture = [stockIdentityFixture, usStockIdentityFixture].find(({ data }) =>
    data.listing.market === market && data.listing.symbol === symbol);
  if (!fixture) return null;
  const result = await fixtureMarketData.identify(fixture.data.listing);
  return result.status === "available" ? { fixture: true as const, data: result.data } : null;
}

export async function getStock(market: string, symbol: string) {
  // Check fixture first for test compatibility
  const demo = await getDemoStock(market, symbol);
  if (demo) return demo;

  // Live lookup
  if (market !== "TH" && market !== "US") return null;
  const listingKey: ListingKey = {
    market,
    symbol,
    exchangeId: market === "TH" ? "SET" : "US",
  };
  const liveResult = await liveMarketData.identify(listingKey);
  return liveResult.status === "available" ? { fixture: false as const, data: liveResult.data } : null;
}

export { liveMarketData };
