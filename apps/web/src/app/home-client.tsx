"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BriefNewsItem, IndexQuote, Result } from "@sfa/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type thMessages from "../messages/th.json";
import type {
  HomeBriefPayload,
  HomeMarketOverviewResponse,
  MarketIndexKey,
} from "../server/home-service";

type Messages = typeof thMessages;

interface HomeClientProps {
  messages: Messages;
  initialMarketOverview: HomeMarketOverviewResponse;
  initialBriefPayload: HomeBriefPayload;
}

const INDEX_META: Array<{ key: MarketIndexKey; label: string; descKey: keyof Messages }> = [
  { key: "SET", label: "SET", descKey: "indexSetDesc" },
  { key: "SET50", label: "SET50", descKey: "indexSet50Desc" },
  { key: "DOW_JONES", label: "Dow Jones", descKey: "indexDowDesc" },
  { key: "SP_500", label: "S&P 500", descKey: "indexSp500Desc" },
  { key: "NASDAQ", label: "Nasdaq", descKey: "indexNasdaqDesc" },
];

function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatSignedNumber(value: number, decimals = 2): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value, decimals)}`;
}

// Always format in explicit Gregorian calendar (ค.ศ.) + Asia/Bangkok time zone per ui-conventions.md.
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

function formatClockHhMm(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function IconTrendUp({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function IconTrendDown({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

function IconFlatLine({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCheck({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
    >
      {expanded ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

type DirectionTone = "up" | "down" | "flat";

function resolveDirectionMeta(
  quote: Result<IndexQuote>,
  messages: Messages,
): { tone: DirectionTone; word: string; metricsText: string } {
  if (quote.status !== "available") {
    return { tone: "flat", word: messages.missingValueLabel, metricsText: "" };
  }
  const change = quote.data.change?.status === "available" ? quote.data.change.value : null;
  const pct = quote.data.changePercent?.status === "available" ? quote.data.changePercent.value : null;
  const reference = pct ?? change ?? 0;
  const pctText = pct !== null ? `${formatSignedNumber(pct)}%` : "";
  const chgText = change !== null ? `(${formatSignedNumber(change)})` : "";
  const combined = [pctText, chgText].filter(Boolean).join(" ");

  if (reference > 0) {
    return { tone: "up", word: messages.directionUp, metricsText: combined };
  }
  if (reference < 0) {
    return { tone: "down", word: messages.directionDown, metricsText: combined };
  }
  return { tone: "flat", word: messages.directionFlat, metricsText: combined || "0.00%" };
}

function directionToneClasses(tone: DirectionTone): string {
  if (tone === "up") return "bg-[#EBF5F0] text-[#176343] border border-[#176343]/25";
  if (tone === "down") return "bg-[#FDF0F2] text-[#AE2638] border border-[#AE2638]/25";
  return "bg-[#F5F7FB] text-[#56647B] border border-[#D8DEEA]";
}

export function HomeClient({
  messages,
  initialMarketOverview,
  initialBriefPayload,
}: HomeClientProps) {
  const [marketOverview, setMarketOverview] = useState<HomeMarketOverviewResponse>(initialMarketOverview);
  const [marketRefreshFailed, setMarketRefreshFailed] = useState<boolean>(false);
  const [briefPayload, setBriefPayload] = useState<HomeBriefPayload>(initialBriefPayload);
  const [pendingBriefPayload, setPendingBriefPayload] = useState<HomeBriefPayload | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(initialBriefPayload.requestedThaiDate);
  const [briefLanguage, setBriefLanguage] = useState<"th" | "en">("th");
  const [briefView, setBriefView] = useState<"short" | "full">("short");
  const [expandedNewsIds, setExpandedNewsIds] = useState<Record<string, boolean>>({});
  const [loadingDate, setLoadingDate] = useState<boolean>(false);

  // FR-05: Poll Home market indices every 1 minute while preserving last good data and sourceAsOf timestamps.
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/market-overview", { cache: "no-store" });
        if (!res.ok) {
          if (active) setMarketRefreshFailed(true);
          return;
        }
        const nextData = (await res.json()) as HomeMarketOverviewResponse;
        if (active) {
          setMarketOverview(nextData);
          setMarketRefreshFailed(false);
        }
      } catch {
        if (active) setMarketRefreshFailed(true);
      }
    }, 60_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const displayedBrief =
    briefPayload.displayBrief.status === "available" ? briefPayload.displayBrief.data : null;

  // Poll today's brief quietly so a new publication prompts instead of interrupting active reading/disclosures.
  useEffect(() => {
    if (briefPayload.isArchive || selectedDate !== briefPayload.currentThaiDate) {
      return;
    }
    let active = true;
    const currentId = displayedBrief?.publicationId ?? null;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/daily-brief?date=${encodeURIComponent(selectedDate)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const nextPayload = (await res.json()) as HomeBriefPayload;
        const nextId =
          nextPayload.displayBrief.status === "available"
            ? nextPayload.displayBrief.data.publicationId
            : null;
        if (active && nextId && nextId !== currentId) {
          setPendingBriefPayload(nextPayload);
        }
      } catch {
        // Keep current brief untouched on transient background poll failure.
      }
    }, 60_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [briefPayload.isArchive, briefPayload.currentThaiDate, selectedDate, displayedBrief?.publicationId]);

  async function handleDateChange(nextDate: string) {
    if (!nextDate) return;
    setSelectedDate(nextDate);
    setPendingBriefPayload(null);
    setExpandedNewsIds({});
    setLoadingDate(true);
    try {
      const res = await fetch(`/api/daily-brief?date=${encodeURIComponent(nextDate)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const nextPayload = (await res.json()) as HomeBriefPayload;
      setBriefPayload(nextPayload);
    } finally {
      setLoadingDate(false);
    }
  }

  function handleApplyPendingBrief() {
    if (!pendingBriefPayload) return;
    setBriefPayload(pendingBriefPayload);
    setPendingBriefPayload(null);
  }

  function toggleNewsDisclosure(newsId: string) {
    setExpandedNewsIds((prev) => ({ ...prev, [newsId]: !prev[newsId] }));
  }

  const activeVariant = displayedBrief ? displayedBrief.variants[briefLanguage] : null;
  const newsItems: BriefNewsItem[] = useMemo(
    () => activeVariant?.newsItems ?? [],
    [activeVariant],
  );
  const sourcesById = useMemo(() => {
    const map = new Map<string, { url: string; sourceAsOf: string; fetchedAt: string }>();
    for (const src of displayedBrief?.evidence.sources ?? []) {
      map.set(src.sourceId, src);
    }
    return map;
  }, [displayedBrief]);

  const canUseFollowUpCards =
    !briefPayload.isArchive &&
    !briefPayload.isFallback &&
    briefPayload.lookup.todayContext.status === "available" &&
    briefPayload.followUps !== null;

  return (
    <div className="space-y-6">
      <h1 className="text-[#17243B]">{messages.homeHeading}</h1>

      {/* Compact 5-index market context strip across the top of Home */}
      <section aria-labelledby="indices-heading" className="open-section">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#D8DEEA] pb-3">
          <div>
            <h2 id="indices-heading" className="text-[#17243B]">
              {messages.indices}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[#56647B]">
              {messages.minuteRefreshNotice} · {messages.delayedSourceNotice}
            </p>
          </div>
          <div className="evidence-row text-left sm:text-right">
            <span className="font-semibold text-[#17243B]">{messages.clockLastChecked}:</span>{" "}
            <span className="num-tabular">{formatGregorianDateTime(marketOverview.fetchedAt)}</span>
          </div>
        </div>

        {marketRefreshFailed && (
          <div
            role="status"
            className="mt-3 rounded-[6px] border border-[#815600] bg-[#FFF6E0] px-3.5 py-2.5 text-sm font-medium text-[#513800]"
          >
            {messages.refreshFailedNotice}
          </div>
        )}

        <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-5">
          {INDEX_META.map((meta) => {
            const slot = marketOverview.indices[meta.key];
            const direction = resolveDirectionMeta(slot, messages);
            const numericAvailable =
              slot.status === "available" && slot.data.value.status === "available";
            return (
              <li
                key={meta.key}
                className="flex flex-col justify-between gap-2 rounded-[6px] border border-[#D8DEEA] bg-[#FFFFFF] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-base font-bold text-[#17243B]">{meta.label}</div>
                    <div className="text-xs leading-relaxed text-[#56647B]">
                      {messages[meta.descKey]}
                    </div>
                  </div>
                  <div className="text-right">
                    {numericAvailable ? (
                      <div className="num-tabular text-base font-bold text-[#17243B]">
                        {formatNumber(slot.data.value.value!)}{" "}
                        <span className="text-xs font-normal text-[#56647B]">
                          {messages.indexPointsUnit}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-[#56647B]">
                        {messages.missingValueLabel}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span
                    className={`num-tabular inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-xs font-semibold ${directionToneClasses(direction.tone)}`}
                  >
                    {direction.tone === "up" && <IconTrendUp className="size-3.5 shrink-0" />}
                    {direction.tone === "down" && <IconTrendDown className="size-3.5 shrink-0" />}
                    {direction.tone === "flat" && <IconFlatLine className="size-3.5 shrink-0" />}
                    <span>{direction.word}</span>
                    {direction.metricsText && <span>{direction.metricsText}</span>}
                  </span>
                </div>

                {slot.status === "available" && (
                  <div className="border-t border-[#D8DEEA] pt-1.5 text-xs leading-relaxed text-[#56647B]">
                    {messages.clockSourceAsOf}:{" "}
                    <span className="num-tabular">
                      {formatGregorianDateTime(slot.data.provenance.sourceAsOf)}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Main 2/3 reading section + 1/3 follow-up topic cards on wide screens; stacked on mobile */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        {/* Daily Brief reading flow (open flat section, 48rem comfortable prose column) */}
        <section aria-labelledby="brief-heading" className="open-section">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D8DEEA] pb-4">
            <div>
              <h2 id="brief-heading" className="text-[#17243B]">
                {messages.dailyBrief}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#56647B]">
                {messages.dailyBriefSubtitle}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="brief-date-input"
                className="text-sm font-semibold text-[#17243B]"
              >
                {messages.briefDateLabel}
              </label>
              <input
                id="brief-date-input"
                type="date"
                max={briefPayload.currentThaiDate}
                value={selectedDate}
                onChange={(e) => void handleDateChange(e.target.value)}
                disabled={loadingDate}
                className="field-input num-tabular"
              />
            </div>
          </div>

          {/* Non-disruptive new publication notice (never replaces open reading state automatically) */}
          {pendingBriefPayload && (
            <div
              role="status"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#334DB3] bg-[#E9EDFB] px-4 py-3 text-sm font-medium text-[#17243B]"
            >
              <span>{messages.newPublicationAvailableBanner}</span>
              <Button type="button" size="sm" onClick={handleApplyPendingBrief}>
                {messages.loadNewPublicationButton}
              </Button>
            </div>
          )}

          {/* Distinct clock labels & archive/fallback state banners */}
          {displayedBrief && (
            <div className="mt-4 space-y-2 border-b border-[#D8DEEA] pb-4">
              <div className="evidence-row flex flex-wrap gap-x-5 gap-y-1.5">
                <span>
                  <strong className="font-semibold text-[#17243B]">{messages.clockPublishedAt}:</strong>{" "}
                  <span className="num-tabular">{formatGregorianDateTime(displayedBrief.publishedAt)}</span>
                </span>
                <span>
                  <strong className="font-semibold text-[#17243B]">{messages.clockSourceAsOf}:</strong>{" "}
                  <span className="num-tabular">
                    {formatGregorianDateTime(displayedBrief.evidence.evidenceCutoff)}
                  </span>
                </span>
                <span>
                  <strong className="font-semibold text-[#17243B]">
                    {messages.evidenceSnapshotLabel}:
                  </strong>{" "}
                  <code className="text-xs text-[#17243B]">{displayedBrief.evidence.snapshotId}</code>
                </span>
                {!briefPayload.isArchive &&
                  briefPayload.lookup.nextScheduledAt &&
                  briefPayload.lookup.updateStatus !== "delayed" && (
                    <span>
                      <strong className="font-semibold text-[#17243B]">
                        {messages.clockNextUpdate}:
                      </strong>{" "}
                      <span className="num-tabular">
                        {formatClockHhMm(briefPayload.lookup.nextScheduledAt)} น. (Asia/Bangkok)
                      </span>
                    </span>
                  )}
              </div>

              {!briefPayload.isArchive && briefPayload.lookup.updateStatus === "delayed" && (
                <div
                  role="status"
                  className="rounded-[6px] border border-[#815600] bg-[#FFF6E0] px-3.5 py-2 text-sm font-medium text-[#513800]"
                >
                  {messages.updateDelayedBadge}
                </div>
              )}
            </div>
          )}

          {briefPayload.isArchive && (
            <div
              role="status"
              className="mt-4 rounded-[6px] border border-[#334DB3]/40 bg-[#E9EDFB] px-4 py-3 text-sm font-medium text-[#17243B]"
            >
              {messages.archiveReadOnlyBanner} ({formatGregorianDateOnly(briefPayload.requestedThaiDate)})
            </div>
          )}

          {briefPayload.isFallback && displayedBrief && (
            <div
              role="status"
              className="mt-4 rounded-[6px] border border-[#815600] bg-[#FFF6E0] px-4 py-3 text-sm font-medium text-[#513800]"
            >
              {messages.fallbackPreviousDayBanner} —{" "}
              {formatGregorianDateOnly(displayedBrief.publicationDate)}
            </div>
          )}

          {/* Content language + reading depth controls */}
          {displayedBrief && (
            <div className="mt-4 flex flex-wrap items-end gap-6">
              <div>
                <div className="mb-1.5 text-sm font-semibold text-[#17243B]">
                  {messages.contentLanguageLabel}
                </div>
                <div role="group" aria-label={messages.contentLanguageLabel} className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={briefLanguage === "th"}
                    onClick={() => setBriefLanguage("th")}
                    className="choice-btn"
                  >
                    {briefLanguage === "th" && <IconCheck />}
                    <span>{messages.briefLanguageToggleTh}</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={briefLanguage === "en"}
                    onClick={() => setBriefLanguage("en")}
                    className="choice-btn"
                  >
                    {briefLanguage === "en" && <IconCheck />}
                    <span>{messages.briefLanguageToggleEn}</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-sm font-semibold text-[#17243B]">
                  {messages.readingDepthLabel}
                </div>
                <div role="group" aria-label={messages.readingDepthLabel} className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={briefView === "short"}
                    onClick={() => setBriefView("short")}
                    className="choice-btn"
                  >
                    {briefView === "short" && <IconCheck />}
                    <span>{messages.briefViewShort}</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={briefView === "full"}
                    onClick={() => setBriefView("full")}
                    className="choice-btn"
                  >
                    {briefView === "full" && <IconCheck />}
                    <span>{messages.briefViewFull}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bilingual Brief Content Region with matching lang attribute */}
          {displayedBrief && activeVariant ? (
            <div lang={briefLanguage} className="mt-5 max-w-[48rem] space-y-5">
              {typeof activeVariant.scannedCount === "number" && newsItems.length > 0 && (
                <p className="evidence-row m-0">
                  {messages.scannedNewsPrefix} <span className="num-tabular">{activeVariant.scannedCount}</span>{" "}
                  {messages.selectedNewsPrefix} <span className="num-tabular">{newsItems.length}</span>{" "}
                  {messages.newsUnit}
                </p>
              )}

              <div className="border-l-4 border-[#334DB3] bg-[#F5F7FB] px-4 py-3.5 text-base leading-relaxed text-[#17243B]">
                {briefView === "short" ? activeVariant.shortText : activeVariant.fullText}
              </div>

              {newsItems.length > 0 && (
                <ul className="m-0 flex list-none flex-col divide-y divide-[#D8DEEA] border-t border-b border-[#D8DEEA] p-0">
                  {newsItems.map((item) => {
                    const isExpanded = Boolean(expandedNewsIds[item.newsId]);
                    const detailId = `story-detail-${item.newsId}`;
                    const matchedSource = sourcesById.get(item.sourceId);

                    return (
                      <li key={item.newsId} className="py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="evidence-row flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="num-tabular font-semibold text-[#17243B]">
                                {item.publishedTime} น.
                              </span>
                              <span>
                                {messages.newsDetailSourcePrefix}: {item.sourceName}
                              </span>
                              <span
                                className={`num-tabular inline-flex items-center rounded-[6px] px-2 py-0.5 text-xs font-semibold ${
                                  item.importanceScore >= 9
                                    ? "bg-[#E9EDFB] text-[#213273] border border-[#334DB3]/30"
                                    : "bg-[#F5F7FB] text-[#56647B] border border-[#D8DEEA]"
                                }`}
                              >
                                {messages.importanceScoreLabel} {item.importanceScore}/10
                              </span>
                            </div>

                            <h3 className="m-0 text-lg font-semibold leading-relaxed text-[#17243B]">
                              {item.headline}
                            </h3>

                            {/* Repeatable evidence row directly on each story */}
                            <div className="evidence-row flex flex-wrap items-center gap-x-4 gap-y-1">
                              {matchedSource ? (
                                <>
                                  <span>
                                    {messages.clockSourceAsOf}:{" "}
                                    <span className="num-tabular">
                                      {formatGregorianDateTime(matchedSource.sourceAsOf)}
                                    </span>
                                  </span>
                                  <a
                                    href={matchedSource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-medium text-[#334DB3] underline hover:text-[#293E91]"
                                  >
                                    <span>{messages.originalSourceLink}</span>
                                    <IconExternalLink />
                                  </a>
                                </>
                              ) : (
                                <span>
                                  {messages.evidenceSnapshotLabel}:{" "}
                                  <code>{displayedBrief.evidence.snapshotId}</code>
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-expanded={isExpanded}
                            aria-controls={detailId}
                            onClick={() => toggleNewsDisclosure(item.newsId)}
                          >
                            <span>
                              {isExpanded ? messages.collapseStoryDetail : messages.expandStoryDetail}
                            </span>
                            <IconChevron expanded={isExpanded} />
                          </Button>
                        </div>

                        {isExpanded && (
                          <div
                            id={detailId}
                            className="mt-4 space-y-3 border-l-2 border-[#75819B] bg-[#F5F7FB] p-4"
                          >
                            <div>
                              <h4 className="m-0 text-base font-semibold text-[#17243B]">
                                {messages.newsDetailSummaryHeading}
                              </h4>
                              <p className="mt-1 mb-0 text-base leading-relaxed text-[#17243B]">
                                {item.summary}
                              </p>
                            </div>

                            <div>
                              <h4 className="m-0 text-base font-semibold text-[#17243B]">
                                {messages.newsDetailKeyPoints}
                              </h4>
                              <ul className="mt-1 mb-0 list-disc space-y-1 pl-5 text-base leading-relaxed text-[#17243B]">
                                {item.keyPoints.map((pt, i) => (
                                  <li key={i}>{pt}</li>
                                ))}
                              </ul>
                            </div>

                            {item.impacts.length > 0 && (
                              <div>
                                <h4 className="m-0 text-base font-semibold text-[#17243B]">
                                  {messages.newsDetailImpacts}
                                </h4>
                                <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
                                  {item.impacts.map((imp, i) => (
                                    <li
                                      key={i}
                                      className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-[#D8DEEA] bg-[#FFFFFF] px-3 py-2 text-sm"
                                    >
                                      <span className="font-medium text-[#17243B]">{imp.area}</span>
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-xs font-semibold ${
                                          imp.direction === "positive"
                                            ? "bg-[#EBF5F0] text-[#176343]"
                                            : imp.direction === "negative"
                                              ? "bg-[#FDF0F2] text-[#AE2638]"
                                              : "bg-[#F5F7FB] text-[#56647B]"
                                        }`}
                                      >
                                        {imp.direction === "positive" && (
                                          <IconTrendUp className="size-3.5 shrink-0" />
                                        )}
                                        {imp.direction === "negative" && (
                                          <IconTrendDown className="size-3.5 shrink-0" />
                                        )}
                                        {imp.direction === "mixed" && (
                                          <IconFlatLine className="size-3.5 shrink-0" />
                                        )}
                                        <span>{imp.label}</span>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {item.relatedSymbols.length > 0 && (
                              <div>
                                <h4 className="m-0 text-base font-semibold text-[#17243B]">
                                  {messages.newsDetailRelatedStocks}
                                </h4>
                                <div className="mt-1.5 flex flex-wrap gap-2">
                                  {item.relatedSymbols.map((symbol) => (
                                    <span
                                      key={symbol}
                                      className="inline-flex items-center rounded-[6px] border border-[#D8DEEA] bg-[#FFFFFF] px-2.5 py-1 text-sm font-semibold text-[#334DB3]"
                                    >
                                      {symbol}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="evidence-row m-0 border-t border-[#D8DEEA] pt-3">
                {messages.aiDisclaimer}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-base text-[#56647B]">{messages.notYetPublished}</p>
          )}
        </section>

        {/* Right 1/3 rail: Today's Follow-up Questions (independent actionable Cards) */}
        <aside aria-labelledby="followup-heading" className="space-y-4">
          <div className="open-section">
            <h2 id="followup-heading" className="text-[#17243B]">
              {messages.followUpHeading}
            </h2>
            <p className="mt-1 mb-0 text-sm leading-relaxed text-[#56647B]">
              {messages.followUpSubtitle}
            </p>
          </div>

          {canUseFollowUpCards && briefPayload.followUps ? (
            <div className="flex flex-col gap-4">
              {briefPayload.followUps.cards.map((card) => {
                const v = card.variants[briefLanguage];
                const href = `/chat?cardId=${encodeURIComponent(card.cardId)}&publicationId=${encodeURIComponent(
                  briefPayload.followUps!.publicationId,
                )}&date=${encodeURIComponent(briefPayload.followUps!.publicationDate)}&topic=${encodeURIComponent(
                  v.question,
                )}`;
                return (
                  <Card key={card.cardId} lang={briefLanguage}>
                    <CardHeader>
                      {v.tag && (
                        <span className="inline-flex w-fit items-center rounded-[6px] bg-[#E9EDFB] px-2.5 py-0.5 text-xs font-semibold text-[#334DB3]">
                          {v.tag}
                        </span>
                      )}
                      <h3 className="m-0 text-lg font-semibold leading-relaxed text-[#17243B]">
                        {v.title}
                      </h3>
                    </CardHeader>
                    {v.impact && (
                      <CardContent className="text-sm leading-relaxed text-[#56647B]">
                        {v.impact}
                      </CardContent>
                    )}
                    <CardFooter>
                      <Button asChild className="w-full justify-center">
                        <Link href={href}>{messages.followUpAskAiButton}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div
              role="status"
              className="rounded-[6px] border border-[#815600] bg-[#FFF6E0] p-4 text-sm leading-relaxed font-medium text-[#513800]"
            >
              {briefPayload.isArchive
                ? messages.followUpUnavailableArchive
                : messages.followUpUnavailableFallback}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
