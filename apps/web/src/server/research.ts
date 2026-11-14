import "server-only";
import { stockIdentityFixture, usStockIdentityFixture } from "@sfa/contracts/fixtures";
import { fixtureMarketData } from "./adapters/fixture-market-data";
import { liveMarketData } from "./adapters/live-market-data";
import type { ListingKey } from "@sfa/contracts";

export async function getStock(market: string, symbol: string) {
  // Check fixture first for test compatibility
  const fixture = [stockIdentityFixture, usStockIdentityFixture].find(({ data }) =>
    data.listing.market === market && data.listing.symbol === symbol);
  if (fixture) {
    const result = await fixtureMarketData.identify(fixture.data.listing);
    return result.status === "available" ? { fixture: true as const, data: result.data } : null;
  }

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

export const getDemoStock = getStock;
export { liveMarketData };
