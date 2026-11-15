import { NextResponse } from "next/server";
import { liveMarketData } from "@/server/research";
import type { ListingKey } from "@sfa/contracts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market");
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();

  if (
    (market !== "TH" && market !== "US") ||
    !symbol ||
    symbol.length > 30 ||
    !/^[A-Z0-9.^-]+$/.test(symbol)
  ) {
    return NextResponse.json(
      { status: "error", code: "INVALID_PARAMS", message: "Invalid stock listing" },
      { status: 400 },
    );
  }

  const listing: ListingKey = {
    market,
    symbol,
    exchangeId: market === "TH" ? "SET" : "US",
  };

  const result = await liveMarketData.news(listing);
  return NextResponse.json(result);
}
