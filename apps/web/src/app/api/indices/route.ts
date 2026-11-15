import { NextResponse } from "next/server";
import { liveMarketData } from "@/server/research";

export async function GET() {
  const result = await liveMarketData.indices();
  if (result.status === "available") {
    return NextResponse.json({ status: "available", data: result.data });
  }
  return NextResponse.json({ status: "unavailable" });
}
