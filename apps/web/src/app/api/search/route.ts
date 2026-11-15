
import { NextResponse } from "next/server";
import { liveMarketData } from "@/server/research";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  // Reject empty search queries
  if (!query) {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_QUERY",
        message: "Search query is required",
      },
      { status: 400 },
    );
  }

  // Avoid unnecessarily large provider requests
  if (query.length > 100) {
    return NextResponse.json(
      {
        status: "error",
        code: "QUERY_TOO_LONG",
        message: "Search query must not exceed 100 characters",
      },
      { status: 400 },
    );
  }

  const result = await liveMarketData.search(query);

  if (result.status === "available") {
    return NextResponse.json({
      status: "available",
      data: result.data,
    });
  }

  if (result.status === "unavailable") {
    return NextResponse.json(
      {
        status: "unavailable",
        reason: result.reason,
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      status: "error",
      code: result.code,
      message: "Stock search provider is temporarily unavailable",
    },
    { status: 502 },
  );
}
