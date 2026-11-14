"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BriefNewsItem, IndexQuote, Result } from "@sfa/contracts";
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

function formatThaiDisplayTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatClockHhMm(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function renderDirectionBadge(
  quote: Result<IndexQuote>,
  messages: Messages,
): { text: string; className: string } {
  if (quote.status !== "available") {
    return { text: messages.indexUnavailable, className: "chg-badge flat" };
  }
  const change = quote.data.change?.status === "available" ? quote.data.change.value : null;
  const pct = quote.data.changePercent?.status === "available" ? quote.data.changePercent.value : null;
  const reference = pct ?? change ?? 0;

  if (reference > 0) {
    const pctText = pct !== null ? `${formatSignedNumber(pct)}%` : "";
    const chgText = change !== null ? ` (${formatSignedNumber(change)})` : "";
    return { text: `▲ ${messages.directionUp} ${pctText}${chgText}`.trim(), className: "chg-badge up" };
  }
  if (reference < 0) {
    const pctText = pct !== null ? `${formatSignedNumber(pct)}%` : "";
    const chgText = change !== null ? ` (${formatSignedNumber(change)})` : "";
    return { text: `▼ ${messages.directionDown} ${pctText}${chgText}`.trim(), className: "chg-badge down" };
  }
  return { text: `— ${messages.directionFlat} 0.00%`, className: "chg-badge flat" };
}

export function HomeClient({
  messages,
  initialMarketOverview,
  initialBriefPayload,
}: HomeClientProps) {
  const [marketOverview, setMarketOverview] = useState<HomeMarketOverviewResponse>(initialMarketOverview);
  const [briefPayload, setBriefPayload] = useState<HomeBriefPayload>(initialBriefPayload);
  const [selectedDate, setSelectedDate] = useState<string>(initialBriefPayload.requestedThaiDate);
  const [briefLanguage, setBriefLanguage] = useState<"th" | "en">("th");
  const [briefView, setBriefView] = useState<"short" | "full">("short");
  const [activeNewsIndex, setActiveNewsIndex] = useState<number | null>(null);
  const [loadingDate, setLoadingDate] = useState<boolean>(false);

  // FR-05: Poll Home market indices every 1 minute while preserving upstream sourceAsOf timestamps.
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/market-overview", { cache: "no-store" });
        if (!res.ok) return;
        const nextData = (await res.json()) as HomeMarketOverviewResponse;
        if (active) setMarketOverview(nextData);
      } catch {
        // Keep previous displayed overview on transient poll failure per FR-02.
      }
    }, 60_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Keyboard Escape handler for the news detail drawer.
  useEffect(() => {
    if (activeNewsIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveNewsIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeNewsIndex]);

  async function handleDateChange(nextDate: string) {
    if (!nextDate) return;
    setSelectedDate(nextDate);
    setActiveNewsIndex(null);
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

  const displayedBrief =
    briefPayload.displayBrief.status === "available" ? briefPayload.displayBrief.data : null;
  const activeVariant = displayedBrief ? displayedBrief.variants[briefLanguage] : null;
  const newsItems: BriefNewsItem[] = useMemo(
    () => activeVariant?.newsItems ?? [],
    [activeVariant],
  );
  const activeNewsItem =
    activeNewsIndex !== null && newsItems[activeNewsIndex] ? newsItems[activeNewsIndex] : null;

  const canUseFollowUpCards =
    !briefPayload.isArchive &&
    !briefPayload.isFallback &&
    briefPayload.lookup.todayContext.status === "available" &&
    briefPayload.followUps !== null;

  return (
    <>
      <h1>{messages.homeHeading}</h1>

      <div className="home-grid">
        {/* Left column: Daily Brief & Follow-up Cards */}
        <div className="home-col">
          <section aria-labelledby="brief-heading">
            <div className="card-head">
              <div>
                <h2 id="brief-heading">{messages.dailyBrief}</h2>
                <div className="sub">{messages.dailyBriefSubtitle}</div>
              </div>

              <div className="controls-row">
                <label className="sub" htmlFor="brief-date-input">
                  {messages.briefDateLabel}
                </label>
                <input
                  id="brief-date-input"
                  className="date-input"
                  type="date"
                  max={briefPayload.currentThaiDate}
                  value={selectedDate}
                  onChange={(e) => void handleDateChange(e.target.value)}
                  disabled={loadingDate}
                />
              </div>
            </div>

            {/* Brief status & bilingual / length controls */}
            <div className="card-head" style={{ marginBottom: ".5rem" }}>
              <div className="controls-row">
                {displayedBrief && (
                  <>
                    <span className="pill">
                      {!briefPayload.isArchive && !briefPayload.isFallback && (
                        <span className="dot" aria-hidden="true" />
                      )}
                      {messages.lastUpdatedLabel}: {formatThaiDisplayTime(displayedBrief.publishedAt)}
                    </span>
                    {!briefPayload.isArchive && briefPayload.lookup.nextScheduledAt && (
                      <span className="sub">
                        {messages.nextUpdateLabel}: {formatClockHhMm(briefPayload.lookup.nextScheduledAt)} น.
                      </span>
                    )}
                    {!briefPayload.isArchive && briefPayload.lookup.updateStatus === "delayed" && (
                      <span className="pill warn">{messages.updateDelayedBadge}</span>
                    )}
                  </>
                )}
              </div>

              {displayedBrief && (
                <div className="controls-row">
                  <div className="segmented" role="group" aria-label={messages.language}>
                    <button
                      type="button"
                      className={briefLanguage === "th" ? "active" : ""}
                      onClick={() => setBriefLanguage("th")}
                      aria-pressed={briefLanguage === "th"}
                    >
                      {messages.briefLanguageToggleTh}
                    </button>
                    <button
                      type="button"
                      className={briefLanguage === "en" ? "active" : ""}
                      onClick={() => setBriefLanguage("en")}
                      aria-pressed={briefLanguage === "en"}
                    >
                      {messages.briefLanguageToggleEn}
                    </button>
                  </div>

                  <div className="segmented" role="group" aria-label={messages.dailyBrief}>
                    <button
                      type="button"
                      className={briefView === "short" ? "active" : ""}
                      onClick={() => setBriefView("short")}
                      aria-pressed={briefView === "short"}
                    >
                      {messages.briefViewShort}
                    </button>
                    <button
                      type="button"
                      className={briefView === "full" ? "active" : ""}
                      onClick={() => setBriefView("full")}
                      aria-pressed={briefView === "full"}
                    >
                      {messages.briefViewFull}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {briefPayload.isArchive && (
              <div className="banner info" role="status">
                {messages.archiveReadOnlyBanner} ({briefPayload.requestedThaiDate})
              </div>
            )}

            {briefPayload.isFallback && displayedBrief && (
              <div className="banner warn" role="status">
                {messages.fallbackPreviousDayBanner} — {displayedBrief.publicationDate}
              </div>
            )}

            {displayedBrief && activeVariant ? (
              <>
                <div className="sub">
                  {messages.evidenceCutoffLabel}: {formatThaiDisplayTime(displayedBrief.evidence.evidenceCutoff)}
                  {typeof activeVariant.scannedCount === "number" && newsItems.length > 0 && (
                    <>
                      {" · "}
                      {messages.scannedNewsPrefix} {activeVariant.scannedCount} {messages.selectedNewsPrefix}{" "}
                      {newsItems.length} {messages.newsUnit}
                    </>
                  )}
                </div>

                <div className="summary-box">
                  {briefView === "short" ? activeVariant.shortText : activeVariant.fullText}
                </div>

                {newsItems.length > 0 && (
                  <ul className="news-list">
                    {newsItems.map((item, idx) => (
                      <li
                        key={item.newsId}
                        className="news-item"
                        tabIndex={0}
                        role="button"
                        onClick={() => setActiveNewsIndex(idx)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveNewsIndex(idx);
                          }
                        }}
                      >
                        <span className="news-time num">{item.publishedTime}</span>
                        <div>
                          <div>{item.headline}</div>
                          <div className="news-src">
                            {messages.newsDetailSourcePrefix}: {item.sourceName}
                          </div>
                          <div className="news-more">{messages.readFullNewsSummary}</div>
                        </div>
                        <span className={`score-badge ${item.importanceScore >= 9 ? "score-hi" : "score-md"}`}>
                          {messages.importanceScoreLabel} {item.importanceScore}/10
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="sub">{messages.notYetPublished}</p>
            )}
          </section>

          {/* Follow-up topic cards */}
          <section aria-labelledby="followup-heading">
            <div className="card-head">
              <div>
                <h2 id="followup-heading">{messages.followUpHeading}</h2>
                <div className="sub">{messages.followUpSubtitle}</div>
              </div>
            </div>

            {canUseFollowUpCards && briefPayload.followUps ? (
              <div className="steps-grid">
                {briefPayload.followUps.cards.map((card) => {
                  const v = card.variants[briefLanguage];
                  const href = `/chat?cardId=${encodeURIComponent(card.cardId)}&publicationId=${encodeURIComponent(
                    briefPayload.followUps!.publicationId,
                  )}&date=${encodeURIComponent(briefPayload.followUps!.publicationDate)}&topic=${encodeURIComponent(
                    v.question,
                  )}`;
                  return (
                    <article key={card.cardId} className="step-card">
                      {v.tag && <span className="step-tag">{v.tag}</span>}
                      <strong>{v.title}</strong>
                      {v.impact && <span className="step-impact">→ {v.impact}</span>}
                      <Link className="btn" href={href}>
                        {messages.followUpAskAiButton}
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="banner warn" role="status">
                {briefPayload.isArchive
                  ? messages.followUpUnavailableArchive
                  : messages.followUpUnavailableFallback}
              </div>
            )}
          </section>
        </div>

        {/* Right column: Market Overview (5 indices, 1-minute refresh) */}
        <div className="home-col">
          <section aria-labelledby="indices-heading">
            <div className="card-head">
              <div>
                <h2 id="indices-heading">{messages.indices}</h2>
                <div className="sub">
                  {messages.minuteRefreshNotice} · {messages.fetchedAtLabel}:{" "}
                  <span className="num">{formatClockHhMm(marketOverview.fetchedAt)} น.</span>
                </div>
              </div>
              <span className="pill">
                <span className="dot" aria-hidden="true" />
                1m
              </span>
            </div>

            <div className="sub" style={{ marginBottom: ".5rem" }}>
              {messages.delayedSourceNotice}
            </div>

            <ul className="mkt-list">
              {INDEX_META.map((meta) => {
                const slot = marketOverview.indices[meta.key];
                const badge = renderDirectionBadge(slot, messages);
                return (
                  <li key={meta.key} className="mkt-row">
                    <div>
                      <strong>{meta.label}</strong>
                      <div className="sub">{messages[meta.descKey]}</div>
                      {slot.status === "available" && (
                        <div className="sub">
                          {messages.sourceAsOfLabel}: {formatThaiDisplayTime(slot.data.provenance.sourceAsOf)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {slot.status === "available" && slot.data.value.status === "available" ? (
                        <div className="num" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                          {formatNumber(slot.data.value.value)}
                        </div>
                      ) : (
                        <div className="sub">{messages.indexUnavailable}</div>
                      )}
                      <span className={`${badge.className} num`}>{badge.text}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* News Detail Drawer */}
      {activeNewsItem && displayedBrief && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveNewsIndex(null);
          }}
        >
          <div className="modal-drawer">
            <div className="card-head">
              <span className="sub">
                {displayedBrief.publicationDate} · {activeNewsItem.publishedTime} น. · {activeNewsItem.sourceName}
              </span>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setActiveNewsIndex(null)}
              >
                {messages.closeModal}
              </button>
            </div>

            <h3 id="news-modal-title" style={{ marginTop: 0 }}>
              {activeNewsItem.headline}
            </h3>

            <span className={`score-badge ${activeNewsItem.importanceScore >= 9 ? "score-hi" : "score-md"}`}>
              {messages.importanceScoreLabel} {activeNewsItem.importanceScore}/10
            </span>

            <h4>{messages.newsDetailSummaryHeading}</h4>
            <p>{activeNewsItem.summary}</p>

            <h4>{messages.newsDetailKeyPoints}</h4>
            <ul>
              {activeNewsItem.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>

            {activeNewsItem.impacts.length > 0 && (
              <>
                <h4>{messages.newsDetailImpacts}</h4>
                <div className="impact-list">
                  {activeNewsItem.impacts.map((imp, i) => (
                    <div key={i} className="impact-row">
                      <span>{imp.area}</span>
                      <span
                        className={`chg-badge ${
                          imp.direction === "positive"
                            ? "up"
                            : imp.direction === "negative"
                              ? "down"
                              : "flat"
                        }`}
                      >
                        {imp.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeNewsItem.relatedSymbols.length > 0 && (
              <>
                <h4>{messages.newsDetailRelatedStocks}</h4>
                <div className="ticker-pills">
                  {activeNewsItem.relatedSymbols.map((symbol) => (
                    <span key={symbol} className="ticker-pill">
                      {symbol}
                    </span>
                  ))}
                </div>
              </>
            )}

            <div className="controls-row" style={{ marginTop: "1rem" }}>
              {activeNewsIndex !== null && activeNewsIndex < newsItems.length - 1 && (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setActiveNewsIndex(activeNewsIndex + 1)}
                >
                  {messages.nextNewsItem}
                </button>
              )}
            </div>

            <div className="disc">{messages.aiDisclaimer}</div>
          </div>
        </div>
      )}
    </>
  );
}
