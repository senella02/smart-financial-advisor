import { NextResponse } from "next/server";
import { liveMarketData } from "@/server/research";
import type { ListingKey } from "@sfa/contracts";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const market = params.get("market");
  const symbol = params.get("symbol")?.trim().toUpperCase();
  const frequency = params.get("frequency") ?? "annual";

  if (
    (market !== "TH" && market !== "US") ||
    !symbol || symbol.length > 30 ||
    !/^[A-Z0-9.^-]+$/.test(symbol) ||
    (frequency !== "annual" && frequency !== "quarterly")
  ) {
    return NextResponse.json(
      { status: "error", code: "INVALID_PARAMS", message: "Invalid financial query" },
      { status: 400 },
    );
  }

  const listing: ListingKey = {
    market,
    symbol,
    exchangeId: market === "TH" ? "SET" : "US",
  };

  try {
    const [metrics, statements] = await Promise.all([
      liveMarketData.metrics(listing),
      liveMarketData.statements(listing, frequency),
    ]);
    return NextResponse.json({ status: "available", data: { metrics, statements } });
  } catch {
    return NextResponse.json(
      { status: "error", code: "FINANCIAL_FETCH_FAILED", message: "Financial data unavailable" },
      { status: 502 },
    );
  }
}
