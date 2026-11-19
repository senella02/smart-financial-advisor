import { NextResponse } from "next/server";
import { liveMarketData } from "@/server/research";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const result = await liveMarketData.search(q.trim());
  if (result.status === "available") {
    return NextResponse.json({ matches: result.data.matches });
  }

  return NextResponse.json({ matches: [] });
}
