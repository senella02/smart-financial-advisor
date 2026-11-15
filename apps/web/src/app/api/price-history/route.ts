import { NextResponse } from "next/server";
import { liveMarketData } from "@/server/research";
import type { ListingKey } from "@sfa/contracts";

const ranges = ["1D", "1M", "1Y", "5Y"] as const;
type ChartRange = (typeof ranges)[number];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market");
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();
  const range = searchParams.get("range");

  if (
    (market !== "TH" && market !== "US") ||
    !symbol ||
    !range ||
    !ranges.includes(range as ChartRange)
  ) {
    return NextResponse.json(
      { status: "unavailable", reason: "INVALID_PARAMS" },
      { status: 400 },
    );
  }

  const listing: ListingKey = {
    market,
    symbol,
    exchangeId: market === "TH" ? "SET" : "US",
  };

  const result = await liveMarketData.priceHistory(listing, range as ChartRange);
  return NextResponse.json(result);
}
