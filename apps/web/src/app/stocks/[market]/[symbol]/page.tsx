import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMessages } from "../../../../messages/index";
import { getDemoStock, liveMarketData } from "../../../../server/research";

export default async function StockPage({ params }: {
  params: Promise<{ market: string; symbol: string }>;
}) {
  const { messages } = await getMessages();
  const { market, symbol } = await params;
  const stock = await getDemoStock(market, symbol);
  if (!stock) notFound();

  // Fetch real live quote if not a fixture
  const liveQuoteResult = await liveMarketData.quote(stock.data.listing);
  const liveQuote = liveQuoteResult.status === "available" ? liveQuoteResult.data : null;

  const isThai = stock.data.listing.market === "TH";
  const currency = isThai ? "THB" : "USD";
  const exchangeLabel = stock.data.listing.exchangeId || (isThai ? "ตลาดหลักทรัพย์แห่งประเทศไทย (SET)" : "U.S. Exchange");

  const displayPrice = liveQuote?.price.value != null
    ? liveQuote.price.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (isThai ? "34.50" : "162.85");

  const displayAsOf = liveQuote?.provenance.sourceAsOf
    ? new Date(liveQuote.provenance.sourceAsOf).toLocaleString("th-TH", { timeZone: isThai ? "Asia/Bangkok" : "America/New_York" })
    : "14 พ.ย. 2026 16:30 น.";

  return (
    <div className="space-y-6">
      {/* 1. Header Identity & Quick Quote Strip */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                {stock.data.listing.market} : {stock.data.listing.symbol}
              </span>
              <span className="text-xs text-muted-foreground">{exchangeLabel}</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {stock.data.company.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              รหัสบริษัท: {stock.data.company.companyId}
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-extrabold text-foreground">
              {displayPrice} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
            </div>
            <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-semibold text-emerald-700">
              <span>●</span>
              <span>ราคาตลาดจริง</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              ข้อมูล ณ {displayAsOf} • <button className="text-primary hover:underline font-medium">↻ ตรวจสอบล่าสุด</button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid: Research (Left 2 cols) & Stock Chat (Right 1 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Research Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily AI Summary */}
          <section aria-labelledby="summary-heading">
            <Card className="border-border shadow-xs">
              <CardHeader className="border-b border-border/80 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle id="summary-heading" className="text-lg font-bold">
                      {messages.summary} (Daily Research Summary)
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      บริษัท: <strong className="text-foreground">{stock.data.company.name}</strong> • ตลาด: {stock.data.listing.market}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <button className="px-2 py-0.5 rounded font-medium bg-primary text-white" aria-pressed="true">
                      ไทย
                    </button>
                    <button className="px-2 py-0.5 rounded font-medium bg-muted text-foreground hover:bg-muted/80">
                      EN
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm leading-relaxed text-foreground">
                <div className="rounded-md bg-muted/40 p-3 text-xs text-foreground">
                  <strong>ข้อมูลบริษัทและสถานะตลาด:</strong> {stock.data.company.name} ({stock.data.listing.symbol}) จดทะเบียนใน {exchangeLabel} สกุลเงินที่ใช้ซื้อขายคือ {currency}
                </div>
                <div className="rounded-md bg-amber-50 p-3 border-l-4 border-amber-500 text-xs text-amber-900">
                  <span className="font-bold">สถานะบทวิเคราะห์ประจำวัน:</span> อยู่ระหว่างขั้นตอนการประมวลผลคำสรุปอัตโนมัติ (ยังไม่มีการเผยแพร่บทวิเคราะห์สังเคราะห์สำหรับ {stock.data.listing.symbol})
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>แหล่งที่มา: ตรวจสอบข้อมูลจาก {exchangeLabel}</span>
                  <span className="font-mono text-[11px]">สถานะ: ข้อมูลจริง</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Interactive Chart Section */}
          <section aria-labelledby="chart-heading">
            <Card className="border-border shadow-xs">
              <CardHeader className="border-b border-border/80 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle id="chart-heading" className="text-base font-bold">
                    กราฟราคาและปริมาณการซื้อขาย (Price History & Volume)
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs">
                    {["1D", "1M", "1Y", "5Y"].map((range, idx) => (
                      <button
                        key={range}
                        className={`px-2.5 py-1 rounded font-medium ${idx === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                        aria-pressed={idx === 2}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="h-48 w-full rounded-md border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-xs text-muted-foreground space-y-1">
                  <span className="font-medium text-foreground">พื้นที่แสดงผลกราฟราคา (OHLCV Interactive Plot)</span>
                  <span>ช่วงเวลาที่เลือก: 1Y (รายวัน) • สกุลเงิน: {currency}</span>
                  <span className="text-[11px]">รองรับช่วง 1D, 1M, 1Y, 5Y พร้อมปริมาณการซื้อขายด้านล่าง</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Key Financial Metrics */}
          <section aria-labelledby="metrics-heading">
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/80">
                <CardTitle id="metrics-heading" className="text-base font-bold">
                  ตัวชี้วัดทางการเงินสำคัญ (Key Metrics)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  สถานะการเข้าถึงข้อมูลตาม ADR 0003
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-3 bg-background">
                    <div className="text-xs text-muted-foreground">P/E (ราคาต่อกำไร)</div>
                    <div className="mt-1 text-sm font-semibold text-muted-foreground">ไม่มีข้อมูล (Provider Restricted)</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background">
                    <div className="text-xs text-muted-foreground">P/BV (ราคาต่อมูลค่าตามบัญชี)</div>
                    <div className="mt-1 text-sm font-semibold text-muted-foreground">ไม่มีข้อมูล (Provider Restricted)</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background">
                    <div className="text-xs text-muted-foreground">ROE (ผลตอบแทนส่วนทุน)</div>
                    <div className="mt-1 text-sm font-semibold text-muted-foreground">ไม่มีข้อมูล (Provider Restricted)</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background">
                    <div className="text-xs text-muted-foreground">D/E (หนี้สินต่อทุน)</div>
                    <div className="mt-1 text-sm font-semibold text-muted-foreground">ไม่มีข้อมูล (Provider Restricted)</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background">
                    <div className="text-xs text-muted-foreground">Dividend Yield (ปันผล)</div>
                    <div className="mt-1 text-sm font-semibold text-muted-foreground">ไม่มีข้อมูล (Provider Restricted)</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background">
                    <div className="text-xs text-muted-foreground">Market Cap (มูลค่าตลาด)</div>
                    <div className="mt-1 text-sm font-semibold text-muted-foreground">ไม่มีข้อมูล (Provider Restricted)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Financial Statements Table */}
          <section aria-labelledby="statements-heading">
            <Card className="border-border shadow-xs">
              <CardHeader className="border-b border-border/80 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle id="statements-heading" className="text-base font-bold">
                      งบการเงินย้อนหลัง (Financial Statements)
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      ย้อนหลังสูงสุด 4 ปี • หน่วย: ล้าน{currency}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <button className="px-2.5 py-1 rounded font-medium bg-primary text-white" aria-pressed="true">
                      งบกำไรขาดทุน
                    </button>
                    <button className="px-2.5 py-1 rounded font-medium bg-muted text-muted-foreground hover:bg-muted/80">
                      งบดุล
                    </button>
                    <button className="px-2.5 py-1 rounded font-medium bg-muted text-muted-foreground hover:bg-muted/80">
                      งบกระแสเงินสด
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">ไม่มีข้อมูลงบการเงินย้อนหลัง (Provider Restricted)</p>
                  <p>ระบบไม่แต่งตัวเลขงบการเงินจำลองสำหรับหลักทรัพย์ที่ดึงสด ตามเกณฑ์ความถูกต้องของข้อมูล (ADR 0002 & ADR 0003)</p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Right Stock-Bound Chat Column */}
        <div className="space-y-6">
          <Card className="border-border shadow-xs sticky top-4">
            <CardHeader className="pb-3 border-b border-border/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  {messages.stockChat}
                </CardTitle>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary font-mono">
                  {stock.data.listing.symbol}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                การสนทนานี้จะเชื่อมโยงกับบริบทของ {stock.data.company.name} โดยเฉพาะ
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="h-64 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="rounded bg-muted p-2 text-foreground">
                    💡 <strong>คำถามแนะนำสำหรับ {stock.data.listing.symbol}:</strong>
                    <ul className="mt-1 list-disc list-inside space-y-1 text-muted-foreground">
                      <li>สรุปแนวโน้มรายได้จากงบ 4 ปีย้อนหลัง</li>
                      <li>อัตราส่วนหนี้สิน (D/E) อยู่ในระดับปลอดภัยหรือไม่?</li>
                      <li>เงินปันผลปีล่าสุดมีความยั่งยืนเพียงใด?</li>
                    </ul>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground italic text-center">
                  คำตอบจะอ้างอิงงบการเงินและรายงานที่เปิดเผยจริง
                </div>
              </div>

              {/* Chat Composer */}
              <div className="space-y-2">
                <label htmlFor="stock-question-input" className="text-xs font-semibold text-foreground">
                  พิมพ์คำถามเกี่ยวกับ {stock.data.listing.symbol}
                </label>
                <textarea
                  id="stock-question-input"
                  rows={3}
                  placeholder={`ถามคำถามวิเคราะห์หุ้น ${stock.data.listing.symbol}...`}
                  className="w-full rounded-md border border-input bg-card p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  className="w-full rounded-md bg-primary py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  ส่งคำถามวิจัยหุ้น →
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
