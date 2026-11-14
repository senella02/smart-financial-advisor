"use client";

import { useEffect, useState } from "react";

interface DisplayIndex {
  symbol: string;
  name: string;
  market: "TH" | "US";
  value: string;
  asOf: string;
}

const INDEX_CONFIG: { key: "SET" | "SET50" | "DOW_JONES" | "SP_500" | "NASDAQ"; name: string; market: "TH" | "US" }[] = [
  { key: "SET", name: "SET Index", market: "TH" },
  { key: "SET50", name: "SET50 Index", market: "TH" },
  { key: "DOW_JONES", name: "Dow Jones", market: "US" },
  { key: "SP_500", name: "S&P 500", market: "US" },
  { key: "NASDAQ", name: "Nasdaq", market: "US" },
];

export function LiveIndicesStrip({ initialIndices }: { initialIndices: DisplayIndex[] }) {
  const [indices, setIndices] = useState<DisplayIndex[]>(initialIndices);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    // Set initial real clock time on client mount
    setLastUpdated(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

    // Poll every 60 seconds (safe with backend cache)
    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true);
        const res = await fetch("/api/indices");
        const json = await res.json();
        if (json.status === "available" && json.data) {
          const updated: DisplayIndex[] = INDEX_CONFIG.map(({ key, name, market }) => {
            const item = json.data[key];
            const val = item?.status === "available" && item.data?.value?.value != null
              ? Number(item.data.value.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "ไม่มีข้อมูล";

            const asOfTime = item?.status === "available" && item.data?.provenance?.sourceAsOf
              ? new Date(item.data.provenance.sourceAsOf).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
              : "ปิดตลาด";

            return {
              symbol: key,
              name,
              market,
              value: val,
              asOf: asOfTime,
            };
          });
          setIndices(updated);
          setLastUpdated(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
      } catch {
        // Retain last known values on error
      } finally {
        setIsRefreshing(false);
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section aria-labelledby="indices-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="indices-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          ดัชนีตลาด (อัปเดตอัตโนมัติทุก 1 นาที)
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isRefreshing && <span className="inline-block size-2 rounded-full bg-primary animate-ping" />}
          <span>{lastUpdated ? `ตรวจสอบล่าสุด: ${lastUpdated} น.` : "กำลังเชื่อมต่อ..."}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {indices.map((idx) => (
          <div
            key={idx.symbol}
            className="rounded-lg border border-border bg-card p-3 shadow-xs hover:border-primary/40 transition-colors"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-foreground text-sm">{idx.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {idx.market}
              </span>
            </div>
            <div className="mt-1 text-lg font-bold text-foreground">
              {idx.value}
            </div>
            <div className="mt-0.5 text-xs text-emerald-700 font-medium">
              ● จุดดัชนีจริง
            </div>
            <div className="mt-2 border-t border-border/60 pt-1 text-[11px] text-muted-foreground">
              ข้อมูล ณ {idx.asOf} น.
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
