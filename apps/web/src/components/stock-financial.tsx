"use client";

import { useEffect, useState } from "react";

type NumericValue = {
  status: "available" | "missing";
  value: number | null;
  unit: string;
  currency: "THB" | "USD" | null;
};
type Provenance = { sourceId: string; url: string; sourceAsOf?: string; fetchedAt?: string };
type Metric = { value: NumericValue; basis: string; period: FinancialPeriod | null; provenance: Provenance };
type FinancialPeriod = { frequency: "annual" | "quarterly"; startsOn: string; endsOn: string };
type StatementKind = "income-statement" | "balance-sheet" | "cash-flow";
type Statement = {
  kind: StatementKind;
  period: FinancialPeriod;
  lines: Array<{ code: string; label: string; value: NumericValue }>;
  provenance: Provenance;
};
type Result<T> =
  | { status: "available"; data: T }
  | { status: "unavailable"; reason: string }
  | { status: "error"; code: string; message: string };
type FinancialResponse =
  | {
      status: "available";
      data: {
        metrics: Result<{ metrics: Record<string, Result<Metric>> }>;
        statements: Result<Statement[]>;
      };
    }
  | { status: "error"; code: string; message: string };

type Props = { market: "TH" | "US"; symbol: string };

const METRICS = [
  ["pe", "P/E"], ["pbv", "P/BV"], ["roe", "ROE"],
  ["debtToEquity", "D/E"], ["dividendYield", "Dividend Yield"],
  ["marketCap", "Market Cap"],
] as const;
const STATEMENT_KINDS: Array<{ value: StatementKind; label: string }> = [
  { value: "income-statement", label: "งบกำไรขาดทุน" },
  { value: "balance-sheet", label: "งบแสดงฐานะการเงิน" },
  { value: "cash-flow", label: "งบกระแสเงินสด" },
];

function formatValue(value: NumericValue) {
  if (value.status !== "available" || value.value == null) return "—";
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value.value);
  if (value.unit === "percent") return `${number}%`;
  if (value.currency && (value.unit === "currency" || value.unit === "price-per-share")) {
    return `${number} ${value.currency}`;
  }
  return number;
}

export function StockFinancial({ market, symbol }: Props) {
  const [frequency, setFrequency] = useState<"annual" | "quarterly">("annual");
  const [kind, setKind] = useState<StatementKind>("income-statement");
  const [response, setResponse] = useState<{ key: string; value: FinancialResponse } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);
  const key = `${market}:${symbol}:${frequency}`;
  const current = response?.key === key ? response.value : null;
  const data = current?.status === "available" ? current.data : null;
  const metrics = data?.metrics.status === "available" ? data.metrics.data.metrics : null;
  const statements = data?.statements.status === "available" ? data.statements.data : [];
  const visibleStatements = statements
    .filter((statement) => statement.kind === kind && statement.period.frequency === frequency)
    .sort((a, b) => b.period.endsOn.localeCompare(a.period.endsOn))
    .slice(0, frequency === "annual" ? 4 : 16);
  const metricsRestricted = data?.metrics.status === "unavailable" && data.metrics.reason === "PROVIDER_RESTRICTED";
  const statementsRestricted = data?.statements.status === "unavailable" && data.statements.reason === "PROVIDER_RESTRICTED";

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ market, symbol, frequency });
        const res = await fetch(`/api/financial?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const result = (await res.json()) as FinancialResponse;
        if (controller.signal.aborted) return;
        if (!res.ok || result.status !== "available") {
          setError("ไม่สามารถดึงข้อมูลทางการเงินได้ในขณะนี้");
        } else {
          setResponse({ key, value: result });
        }
      } catch {
        if (!controller.signal.aborted) setError("ไม่สามารถเชื่อมต่อบริการข้อมูลทางการเงินได้");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [market, symbol, frequency, key, refreshCount]);

  return (
    <div className="mt-4 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">อัตราส่วนทางการเงินและงบการเงินจากผู้ให้บริการข้อมูล</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="งวดงบการเงิน">
            {(["annual", "quarterly"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={frequency === value}
                onClick={() => setFrequency(value)}
                className={`rounded px-2 py-1 text-xs ${frequency === value ? "bg-[#E9EDFB] font-semibold text-[#334DB3]" : "text-muted-foreground"}`}>
                {value === "annual" ? "รายปี" : "รายไตรมาส"}
              </button>
            ))}
          </div>
          <button type="button" disabled={loading} onClick={() => setRefreshCount((count) => count + 1)}
            className="inline-flex min-h-8 min-w-24 items-center justify-center rounded-md border border-input bg-white px-3 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50">
            {loading ? "กำลังโหลด..." : "รีเฟรชข้อมูล"}
          </button>
        </div>
      </div>

      {loading && !current && <p role="status" className="text-sm text-muted-foreground">กำลังตรวจสอบข้อมูลทางการเงิน...</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {(metricsRestricted || statementsRestricted) && (
        <p role="status" className="text-sm text-muted-foreground">
          ผู้ให้บริการยังจำกัดการเข้าถึงข้อมูลทางการเงิน (PROVIDER_RESTRICTED) จึงไม่แสดงตัวเลขที่ไม่ได้รับการยืนยัน
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {METRICS.map(([field, label]) => {
          const metric = metrics?.[field];
          const available = metric?.status === "available";
          return (
            <div key={field} className="rounded-lg border border-border bg-[#F5F7FB] p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {available ? formatValue(metric.data.value) : "—"}
              </p>
              {available && <>
                <p className="mt-1 text-xs text-muted-foreground">{metric.data.period?.endsOn ?? metric.data.basis}</p>
                <a className="mt-1 block text-xs text-primary underline underline-offset-2"
                  href={metric.data.provenance.url} target="_blank" rel="noopener noreferrer">
                  {metric.data.provenance.sourceId}
                </a>
              </>}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold">งบการเงิน{frequency === "annual" ? "รายปี" : "รายไตรมาส"}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {frequency === "annual" ? "แสดงสูงสุด 4 ปีที่มีข้อมูล" : "แสดงสูงสุด 16 ไตรมาสที่มีข้อมูล (ประมาณ 4 ปี)"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="ประเภทงบการเงิน">
          {STATEMENT_KINDS.map((option) => (
            <button key={option.value} type="button" aria-pressed={kind === option.value}
              onClick={() => setKind(option.value)}
              className={`rounded-md border px-3 py-2 text-xs transition-colors ${kind === option.value ? "border-[#334DB3] bg-[#E9EDFB] font-semibold text-[#334DB3]" : "border-border bg-white text-muted-foreground hover:bg-accent"}`}>
              {option.label}
            </button>
          ))}
        </div>

        {visibleStatements.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {loading && !current ? "กำลังโหลดงบการเงิน..." : "ยังไม่มีข้อมูลสำหรับประเภทงบและช่วงเวลาที่เลือก"}
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {visibleStatements.map((statement) => (
              <div key={`${statement.kind}:${statement.period.startsOn}:${statement.period.endsOn}`} className="space-y-2">
                <p className="text-sm font-medium">งวด {statement.period.startsOn} – {statement.period.endsOn}</p>
                <div className="divide-y divide-border rounded-md border border-border">
                  {statement.lines.map((line) => (
                    <div key={line.code} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                      <span className="min-w-0">{line.label}</span>
                      <span className="shrink-0 text-right tabular-nums">{formatValue(line.value)}</span>
                    </div>
                  ))}
                </div>
                <a href={statement.provenance.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary underline underline-offset-2">
                  แหล่งข้อมูล: {statement.provenance.sourceId}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
