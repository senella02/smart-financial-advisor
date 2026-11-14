"use client";

import { useEffect, useState } from "react";

interface LiveStockHeaderProps {
  market: "TH" | "US";
  symbol: string;
  exchangeLabel: string;
  companyName: string;
  companyId: string;
  initialPrice: string;
  initialAsOf: string;
  currency: string;
}

export function LiveStockHeader({
  market,
  symbol,
  exchangeLabel,
  companyName,
  companyId,
  initialPrice,
  initialAsOf,
  currency,
}: LiveStockHeaderProps) {
  const [price, setPrice] = useState<string>(initialPrice);
  const [asOf, setAsOf] = useState<string>(initialAsOf);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  async function fetchLatestQuote() {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/quote?market=${market}&symbol=${encodeURIComponent(symbol)}`);
      const json = await res.json();
      if (json.status === "available" && json.data?.price?.value != null) {
        setPrice(Number(json.data.price.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        if (json.data.provenance?.sourceAsOf) {
          setAsOf(
            new Date(json.data.provenance.sourceAsOf).toLocaleString("th-TH", {
              timeZone: market === "TH" ? "Asia/Bangkok" : "America/New_York",
            })
          );
        }
      }
    } catch {
      // Retain last known values on failure
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    // Poll every 60 seconds (safe with backend cache)
    const interval = setInterval(fetchLatestQuote, 60_000);
    return () => clearInterval(interval);
  }, [market, symbol]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
              {market} : {symbol}
            </span>
            <span className="text-xs text-muted-foreground">{exchangeLabel}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {companyName}
          </h1>
          <p className="text-xs text-muted-foreground">
            รหัสบริษัท: {companyId}
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-extrabold text-foreground">
            {price} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
          </div>
          <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-semibold text-emerald-700">
            {isRefreshing && <span className="inline-block size-2 rounded-full bg-primary animate-ping" />}
            <span>●</span>
            <span>ราคาตลาดจริง (อัปเดตอัตโนมัติทุก 1 นาที)</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            ข้อมูล ณ {asOf} •{" "}
            <button
              type="button"
              onClick={fetchLatestQuote}
              disabled={isRefreshing}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {isRefreshing ? "กำลังอัปเดต..." : "↻ ตรวจสอบล่าสุด"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
