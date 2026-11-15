"use client";

import { useEffect, useState } from "react";

type NewsItem = {
  newsId: string;
  headline: string;
  language: "th" | "en";
  publishedAt: string;
  source: { sourceId: string; url: string; sourceAsOf: string; fetchedAt: string };
};
type NewsResponse =
  | { status: "available"; data: NewsItem[] }
  | { status: "unavailable"; reason: string }
  | { status: "error"; code: string; message: string };

type Props = { market: "TH" | "US"; symbol: string };

function formatPublishedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ไม่ระบุเวลา";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

export function StockNews({ market, symbol }: Props) {
  const [response, setResponse] = useState<{ key: string; data: NewsResponse } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);
  const key = `${market}:${symbol}`;
  const current = response?.key === key ? response.data : null;

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ market, symbol });
        const res = await fetch(`/api/news?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const result = (await res.json()) as NewsResponse;
        if (controller.signal.aborted) return;
        if (result.status === "available") {
          setResponse({ key, data: result });
        } else {
          setError("ไม่สามารถดึงข่าวหุ้นจากผู้ให้บริการได้ในขณะนี้");
        }
      } catch {
        if (!controller.signal.aborted) setError("ไม่สามารถเชื่อมต่อบริการข่าวหุ้นได้");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [market, symbol, key, refreshCount]);

  const items = current?.status === "available" ? current.data : [];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          ข่าวที่เกี่ยวข้องจากผู้ให้บริการข้อมูลภายนอก
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => setRefreshCount((count) => count + 1)}
          className="inline-flex min-h-8 min-w-24 items-center justify-center rounded-md border border-input bg-white px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {loading ? "กำลังโหลด..." : "รีเฟรชข่าว"}
        </button>
      </div>

      {loading && items.length === 0 && (
        <p role="status" className="text-sm text-muted-foreground">กำลังโหลดข่าวที่เกี่ยวข้อง...</p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-muted-foreground">ยังไม่มีข่าวที่เกี่ยวข้องสำหรับหุ้นนี้</p>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-border" aria-label="รายการข่าวหุ้น">
          {items.map((item) => (
            <li key={item.newsId} className="py-4 first:pt-0 last:pb-0">
              <a
                href={item.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block space-y-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <p className="text-sm font-semibold leading-relaxed text-foreground group-hover:text-primary group-hover:underline">
                  {item.headline}
                  <span className="ml-1 inline-block text-primary" aria-hidden="true">↗</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{item.source.sourceId}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={item.publishedAt}>{formatPublishedAt(item.publishedAt)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{item.language === "th" ? "ภาษาไทย" : "English"}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
