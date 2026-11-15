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

  // Runs when the stock changes or the user manually refreshes.
  // No interval or automatic polling.
  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(() => {
        if (controller.signal.aborted) return;

        setLoading(true);
        setError(null);
        setQuote(null);

        return fetchQuote(controller.signal);
    });

    return () => controller.abort();
  }, [fetchQuote, refreshCount]);

  const price = quote?.price.value;
  const currency = quote?.price.currency ?? (market === "TH" ? "THB" : "USD");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            ราคาล่าสุด
          </p>

          {loading ? (
            <p role="status" className="mt-2 text-muted-foreground">
              กำลังโหลดราคาหุ้น...
            </p>
          ) : quote && price != null ? (
            <div className="mt-2">
              <p className="text-3xl font-bold tabular-nums">
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                }).format(price)}
                <span className="ml-2 text-base font-normal">
                  {currency}
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-2 text-muted-foreground">
              —
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => setRefreshCount((count) => count + 1)}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          {loading ? "กำลังโหลด..." : "รีเฟรชราคา"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {quote && (
        <div className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
          <p>
            ตลาด: {quote.listing.market} · {quote.listing.exchangeId}
          </p>

          <p>
            เวลาข้อมูลตลาด:{" "}
            <time dateTime={quote.provenance.sourceAsOf}>
              {formatTime(quote.provenance.sourceAsOf)}
            </time>
          </p>

          <p>
            ตรวจสอบข้อมูลล่าสุด:{" "}
            <time dateTime={quote.provenance.fetchedAt}>
              {formatTime(quote.provenance.fetchedAt)}
            </time>
          </p>

          <p>
            แหล่งข้อมูล:{" "}
            <a
              href={quote.provenance.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {quote.provenance.sourceId}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
