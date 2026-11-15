
"use client";

import { useCallback, useEffect, useState } from "react";

type Quote = {
  listing: {
    market: "TH" | "US";
    symbol: string;
    exchangeId: string;
  };
  price: {
    status: "available" | "unavailable";
    value?: number;
    currency?: string | null;
    reason?: string | null;
  };
  provenance: {
    sourceId: string;
    url: string;
    sourceAsOf: string;
    fetchedAt: string;
  };
};

type QuoteResponse =
  | { status: "available"; data: Quote }
  | { status: "unavailable"; reason: string }
  | { status: "error"; code: string; message: string };

type Props = {
  market: "TH" | "US";
  symbol: string;
};

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

export function StockQuote({ market, symbol }: Props) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Keep the quote associated with its stock identity.
  // Prevents an old stock's price appearing for a new stock.
  const quoteMatchesStock =
    quote?.listing.market === market &&
    quote?.listing.symbol.toUpperCase() === symbol.toUpperCase();

  const visibleQuote = quoteMatchesStock ? quote : null;

  const fetchQuote = useCallback(
    async (signal: AbortSignal) => {
      try {
        const params = new URLSearchParams({ market, symbol });

        const response = await fetch(
          `/api/quote?${params.toString()}`,
          {
            signal,
            cache: "no-store",
          },
        );

        const result = (await response.json()) as QuoteResponse;

        if (signal.aborted) return;

        if (result.status === "available") {
          if (result.data.price.status === "available") {
            setQuote(result.data);
          } else {
            setError("ไม่มีข้อมูลราคาสำหรับหุ้นนี้");
          }
        } else if (result.status === "unavailable") {
          setError(
            result.reason === "FIXTURE_ONLY"
              ? "หุ้นตัวอย่างไม่มีข้อมูลราคาตลาดจริง"
              : "ไม่สามารถแสดงราคาหุ้นนี้ได้ในขณะนี้",
          );
        } else {
          setError("เกิดข้อผิดพลาดในการดึงราคาหุ้น");
        }
      } catch {
        if (signal.aborted) return;
        setError("ไม่สามารถเชื่อมต่อบริการข้อมูลหุ้นได้");
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [market, symbol],
  );

  // Fetch on page open, stock change, or manual refresh.
  // No interval or automatic polling.
  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;

      setLoading(true);
      setError(null);

      // Do not clear the quote during refresh.
      // Existing price and metadata remain visible.
      return fetchQuote(controller.signal);
    });

    return () => controller.abort();
  }, [fetchQuote, refreshCount]);

  const price = visibleQuote?.price.value;
  const currency =
    visibleQuote?.price.currency ??
    (market === "TH" ? "THB" : "USD");
  
  // TODO(SFA-6): Replace with real price change data from Quote Contract.
  // Display-only mock data. Never use for calculations or financial advice.
  const mockPriceChange = {
    change: 1.25,
    changePercent: 0.85,
  };

  const isPriceUp = mockPriceChange.change > 0;
  const isPriceDown = mockPriceChange.change < 0;

  const changeColor = isPriceUp
    ? "text-[#176343]"
    : isPriceDown
      ? "text-[#AE2638]"
      : "text-muted-foreground";

  const changeSign = isPriceUp ? "+" : "";

  return (
    <div className="flex w-full flex-col gap-2 lg:items-end">
      {/* Current price */}
      <div className="min-h-15 lg:text-right">
        <p className="text-sm text-muted-foreground">
          ราคาล่าสุด
        </p>

        {visibleQuote && price != null ? (
          <p className="mt-1 text-4xl leading-tight font-bold tabular-nums text-foreground">
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            }).format(price)}

            <span className="ml-2 text-sm font-normal">
              {currency}
            </span>
          </p>
        ) : loading ? (
          <p
            role="status"
            className="mt-1 text-sm text-muted-foreground"
          >
            กำลังโหลดราคาหุ้น...
          </p>
        ) : (
          <p className="mt-1 text-2xl font-semibold">—</p>
        )}
      </div>

      {/* Mock price change — display only */}
      <div className="flex min-h-5 flex-wrap items-center gap-2 lg:justify-end">
        {visibleQuote && price != null && (
          <>
            <span
              className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${changeColor}`}
            >
              {isPriceUp ? (
                <span aria-hidden="true">▲</span>
              ) : isPriceDown ? (
                <span aria-hidden="true">▼</span>
              ) : (
                <span aria-hidden="true">—</span>
              )}

              {changeSign}
              {mockPriceChange.change.toFixed(2)}
              {" "}
              ({changeSign}
              {mockPriceChange.changePercent.toFixed(2)}%)
            </span>

            <span className="rounded bg-[#E9EDFB] px-2 py-0.5 text-[10px] font-semibold text-[#334DB3]">
              DEMO
            </span>
          </>
        )}
      </div>

      {/* Reserve space for an error message */}
      <div className="min-h-5 lg:text-right">
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Metadata and refresh button */}
      <div className="flex min-h-9 flex-wrap items-center gap-x-2 gap-y-2 text-xs text-muted-foreground lg:justify-end">
        {visibleQuote && (
          <>
            <span className="whitespace-nowrap">
              ข้อมูลเมื่อ{" "}
              <time dateTime={visibleQuote.provenance.fetchedAt}>
                {formatTime(visibleQuote.provenance.fetchedAt)}
              </time>
            </span>

            <span aria-hidden="true">·</span>

            <span className="whitespace-nowrap">
              แหล่งข้อมูล:{" "}
              <a
                href={visibleQuote.provenance.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                {visibleQuote.provenance.sourceId}
              </a>
            </span>
          </>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            setRefreshCount((count) => count + 1)
          }
          className="inline-flex ml-1 min-h-7 min-w-24 shrink-0 items-center justify-center gap-1 rounded-md border border-input bg-white px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M20 11a8 8 0 0 0-14.5-4.5L3 9" />
            <path d="M3 4v5h5" />
            <path d="M4 13a8 8 0 0 0 14.5 4.5L21 15" />
            <path d="M21 20v-5h-5" />
          </svg>

          {loading ? "กำลังโหลด..." : "รีเฟรชราคา"}
        </button>
      </div>
    </div>
  );
}
