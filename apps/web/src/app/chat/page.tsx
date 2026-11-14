import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages } from "../../messages/index";
import { resolveChatHandoff } from "../../server/home";

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ messages }, rawParams] = await Promise.all([getMessages(), searchParams]);
  const handoff = await resolveChatHandoff({
    cardId: firstString(rawParams.cardId),
    publicationId: firstString(rawParams.publicationId),
    date: firstString(rawParams.date),
    topic: firstString(rawParams.topic),
  });

  return (
    <>
      <h1>{messages.mainChat}</h1>

      {handoff?.status === "accepted" && (
        <section aria-labelledby="handoff-heading" style={{ marginBottom: "1rem" }}>
          <h2 id="handoff-heading">{messages.chatFollowUpTopicHeading}</h2>
          <p>
            <strong>{handoff.topic}</strong>
          </p>
          <div className="banner info" role="status">
            {messages.chatTodayBriefContextAttached} ({handoff.publicationDate} · {handoff.publicationId})
          </div>
        </section>
      )}

      {handoff?.status === "rejected" && (
        <section aria-labelledby="handoff-error-heading" style={{ marginBottom: "1rem" }}>
          <h2 id="handoff-error-heading">{messages.chatFollowUpTopicHeading}</h2>
          <div className="banner warn" role="alert">
            {handoff.reason === "TODAY_NOT_PUBLISHED"
              ? messages.chatTodayBriefUnavailable
              : messages.chatArchivedBriefRejected}
          </div>
        </section>
      )}

      <p>{messages.mainChatPlaceholder}</p>
      <section aria-labelledby="history-heading">
        <Card>
          <CardHeader>
            <CardTitle id="history-heading">{messages.history}</CardTitle>
          </CardHeader>
          <CardContent><p>{messages.historyPlaceholder}</p></CardContent>
        </Card>
      </section>
    </>
  );
}
