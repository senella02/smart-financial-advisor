import { NextResponse } from "next/server";
import { liveMarketData } from "@/server/stock-detail";
import type { ListingKey } from "@sfa/contracts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market");
  const symbol = searchParams.get("symbol");

  if (!market || !symbol || (market !== "TH" && market !== "US")) {
    return NextResponse.json({ status: "unavailable", reason: "INVALID_PARAMS" }, { status: 400 });
  }

  const listingKey: ListingKey = {
    market,
    symbol,
    exchangeId: market === "TH" ? "SET" : "US",
  };

  const result = await liveMarketData.quote(listingKey);
  if (result.status === "available") {
    return NextResponse.json({ status: "available", data: result.data });
  }

  const reason = result.status === "unavailable" ? result.reason : result.message;
  return NextResponse.json({ status: "unavailable", reason });
}
