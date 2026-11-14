import { parseChatBody, respond } from "../../../server/chat";

export async function POST(request: Request) {
  const parsed = parseChatBody(await request.json().catch(() => null));
  if (!parsed) return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
  return Response.json(await respond(parsed.request, parsed.history));
}
