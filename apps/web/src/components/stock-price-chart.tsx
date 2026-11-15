"use client";

import { useEffect, useId, useState } from "react";

type Range = "1D" | "1M" | "1Y" | "5Y";
type Point = {
  sourceAsOf: string;
  price: { status: "available" | "missing"; value: number | null; currency: string | null };
};
type History = {
  range: Range;
  points: Point[];
  provenance: { sourceId: string; url: string; fetchedAt: string };
};
type Response =
  | { status: "available"; data: History }
  | { status: "unavailable"; reason: string }
  | { status: "error"; code: string; message: string };

type Props = { market: "TH" | "US"; symbol: string };
const ranges: Range[] = ["1D", "1M", "1Y", "5Y"];
const width = 800;
const height = 240;
const inset = { top: 18, bottom: 24, left: 12, right: 12 };

export function StockPriceChart({ market, symbol }: Props) {
  const [range, setRange] = useState<Range>("1M");
  const [history, setHistory] = useState<{ key: string; data: History } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const gradientId = useId().replace(/:/g, "");
  const key = `${market}:${symbol}:${range}`;
  const visibleHistory = history?.key === key ? history.data : null;

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({ market, symbol, range });
        const response = await fetch(`/api/price-history?${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const result = (await response.json()) as Response;
        if (controller.signal.aborted) return;
        if (result.status === "available") {
          setHistory({ key, data: result.data });
        } else {
          setError("ไม่สามารถแสดงประวัติราคาสำหรับช่วงเวลานี้ได้");
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("ไม่สามารถเชื่อมต่อบริการข้อมูลราคาย้อนหลังได้");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [market, symbol, range, key]);

  const points = (visibleHistory?.points ?? []).filter(
    (point): point is Point & { price: Point["price"] & { value: number } } =>
      point.price.status === "available" &&
      typeof point.price.value === "number" &&
      Number.isFinite(point.price.value),
  );
  const prices = points.map((point) => point.price.value);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 1;
  const padding = Math.max((max - min) * 0.12, Math.abs(max) * 0.002, 0.01);
  const low = min - padding;
  const high = max + padding;
  const x = (i: number) => inset.left + (i / Math.max(points.length - 1, 1)) * (width - inset.left - inset.right);
  const y = (price: number) => inset.top + ((high - price) / (high - low)) * (height - inset.top - inset.bottom);
  const line = points.map((point, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(point.price.value).toFixed(2)}`).join(" ");
  const area = points.length > 1
    ? `${line} L${x(points.length - 1)},${height - inset.bottom} L${x(0)},${height - inset.bottom} Z`
    : "";
  const rising = points.length > 1 && prices[prices.length - 1] >= prices[0];
  const stroke = rising ? "#176343" : "#AE2638";
  const formatPrice = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  const dateLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      ...(range === "1D" ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short", year: "2-digit" }),
    }).format(date);
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">ราคาปิดย้อนหลังจาก Yahoo Finance</p>
        <div className="inline-flex gap-1 rounded-lg bg-secondary p-1" role="group" aria-label="เลือกช่วงเวลากราฟ">
          {ranges.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={range === item}
              onClick={() => setRange(item)}
              className={`min-w-10 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${range === item ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-[260px]" aria-busy={loading}>
        {loading && !visibleHistory ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground" role="status">กำลังโหลดกราฟราคา...</div>
        ) : error && !visibleHistory ? (
          <div className="flex h-[260px] items-center justify-center text-center text-sm text-destructive" role="alert">{error}</div>
        ) : points.length < 2 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">ข้อมูลราคาไม่เพียงพอสำหรับแสดงกราฟ</div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-auto w-full"
              role="img"
              aria-label={`กราฟราคาหุ้น ${symbol} ช่วง ${range} จาก ${formatPrice(prices[0])} ถึง ${formatPrice(prices[prices.length - 1])} ${points[0].price.currency ?? ""}`}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
                  <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((fraction) => (
                <line key={fraction} x1="0" x2={width} y1={inset.top + fraction * (height - inset.top - inset.bottom)} y2={inset.top + fraction * (height - inset.top - inset.bottom)} stroke="currentColor" strokeOpacity="0.10" strokeDasharray="4 5" />
              ))}
              <path d={area} fill={`url(#${gradientId})`} />
              <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={x(points.length - 1)} cy={y(prices[prices.length - 1])} r="4" fill={stroke} />
            </svg>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{dateLabel(points[0].sourceAsOf)}</span>
              <span>ต่ำสุด {formatPrice(min)} · สูงสุด {formatPrice(max)} {points[0].price.currency}</span>
              <span>{dateLabel(points[points.length - 1].sourceAsOf)}</span>
            </div>
          </>
        )}
      </div>
      {visibleHistory && (
        <p className="text-xs text-muted-foreground">
          แหล่งข้อมูล: <a className="text-primary underline underline-offset-2" href={visibleHistory.provenance.url} target="_blank" rel="noopener noreferrer">{visibleHistory.provenance.sourceId}</a>
          {loading ? " · กำลังอัปเดต..." : ""}
        </p>
      )}
    </div>
  );
}
