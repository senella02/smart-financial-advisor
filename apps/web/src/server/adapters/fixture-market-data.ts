import "server-only";
import { ListingKeySchema, type MarketDataPort } from "@sfa/contracts";
import { quoteFixture, stockIdentityFixture, usStockIdentityFixture } from "@sfa/contracts/fixtures";

export const fixtureMarketData: MarketDataPort = {
  async identify(input) {
    const key = ListingKeySchema.parse(input);
    const stock = [stockIdentityFixture, usStockIdentityFixture].find(({ data }) =>
      data.listing.market === key.market && data.listing.symbol === key.symbol && data.listing.exchangeId === key.exchangeId);
    return stock ? { status: "available", data: stock.data } : { status: "unavailable", reason: "FIXTURE_NOT_FOUND" };
  },
  async quote(input) {
    const key = ListingKeySchema.parse(input);
    const listing = quoteFixture.data.listing;
    return key.market === listing.market && key.symbol === listing.symbol && key.exchangeId === listing.exchangeId
      ? { status: "available", data: quoteFixture.data }
      : { status: "unavailable", reason: "FIXTURE_QUOTE_NOT_FOUND" };
  },
};
