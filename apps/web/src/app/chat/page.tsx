import { getMessages } from "../../messages/index";
import { resolveChatHandoff } from "../../server/home";

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatGregorianDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  const formatted = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatted} น. (Asia/Bangkok)`;
}

function formatGregorianDateOnly(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return `ค.ศ. ${isoDate}`;
  const formatted = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
  return `ค.ศ. ${formatted} (${isoDate})`;
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
    <div className="space-y-6">
      <h1 className="text-[#17243B]">{messages.mainChat}</h1>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[18rem_minmax(0,48rem)]">
        {/* Mobile history disclosure (< lg); desktop keeps an open 18rem session sidebar */}
        <aside aria-labelledby="history-heading" className="open-section">
          <div className="lg:hidden">
            <details>
              <summary className="control-target flex cursor-pointer items-center justify-between text-base font-semibold text-[#17243B]">
                <span>{messages.history}</span>
                <span className="text-xs font-normal text-[#56647B]">
                  {messages.chatSessionHistoryNotice}
                </span>
              </summary>
              <div className="mt-3 space-y-2 border-t border-[#D8DEEA] pt-3">
                <p className="m-0 text-sm text-[#56647B]">{messages.chatSessionHistoryNotice}</p>
                <p className="m-0 text-sm text-[#56647B]">{messages.historyPlaceholder}</p>
              </div>
            </details>
          </div>

          <div className="hidden space-y-3 lg:block">
            <h2 id="history-heading" className="text-[#17243B]">
              {messages.history}
            </h2>
            <p className="m-0 rounded-[6px] border border-[#D8DEEA] bg-[#F5F7FB] px-3 py-2 text-sm font-medium text-[#17243B]">
              {messages.chatSessionHistoryNotice}
            </p>
            <p className="m-0 text-sm leading-relaxed text-[#56647B]">
              {messages.historyPlaceholder}
            </p>
          </div>
        </aside>

        {/* Primary centered 48rem conversation flow */}
        <section aria-labelledby="conversation-heading" className="open-section space-y-5">
          <div className="border-b border-[#D8DEEA] pb-3">
            <h2 id="conversation-heading" className="text-[#17243B]">
              {handoff ? messages.chatFollowUpTopicHeading : messages.mainChat}
            </h2>
          </div>

          {handoff?.status === "accepted" && (
            <div className="space-y-3 rounded-[6px] border border-[#176343]/35 bg-[#EBF5F0] p-4">
              <p className="m-0 text-base font-semibold text-[#17243B]">{handoff.topic}</p>
              <div role="status" className="text-sm font-medium text-[#176343]">
                {messages.chatTodayBriefContextAttached} (
                {formatGregorianDateOnly(handoff.publicationDate)})
              </div>
              <div className="evidence-row flex flex-wrap gap-x-4 gap-y-1 border-t border-[#176343]/20 pt-2">
                <span>
                  <strong className="font-semibold text-[#17243B]">
                    {messages.clockPublishedAt}:
                  </strong>{" "}
                  <span className="num-tabular">
                    {formatGregorianDateTime(handoff.todayContext.publishedAt)}
                  </span>
                </span>
                <span>
                  <strong className="font-semibold text-[#17243B]">
                    {messages.clockSourceAsOf}:
                  </strong>{" "}
                  <span className="num-tabular">
                    {formatGregorianDateTime(handoff.todayContext.evidence.evidenceCutoff)}
                  </span>
                </span>
                <span>
                  <strong className="font-semibold text-[#17243B]">
                    {messages.evidenceSnapshotLabel}:
                  </strong>{" "}
                  <code className="text-xs text-[#17243B]">
                    {handoff.todayContext.evidence.snapshotId}
                  </code>
                </span>
              </div>
            </div>
          )}

          {handoff?.status === "rejected" && (
            <div
              role="alert"
              className="rounded-[6px] border border-[#815600] bg-[#FFF6E0] p-4 text-sm font-medium text-[#513800]"
            >
              {handoff.reason === "TODAY_NOT_PUBLISHED"
                ? messages.chatTodayBriefUnavailable
                : messages.chatArchivedBriefRejected}
            </div>
          )}

          <p className="m-0 max-w-[48rem] text-base leading-relaxed text-[#17243B]">
            {messages.mainChatPlaceholder}
          </p>

          <p className="evidence-row m-0 border-t border-[#D8DEEA] pt-3">
            {messages.aiDisclaimer}
          </p>
        </section>
      </div>
    </div>
  );
}
