import { NextResponse } from "next/server";
import { getHomeBriefPayload } from "../../../server/home";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date") ?? undefined;
  if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { error: "INVALID_THAI_DATE", message: "Expected YYYY-MM-DD date" },
      { status: 400 },
    );
  }
  const payload = await getHomeBriefPayload(dateParam);
  return NextResponse.json(payload);
}
