import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages } from "../messages/index";
import Link from "next/link";
import { liveMarketData } from "../server/research";
import { LiveIndicesStrip } from "@/components/live-indices-strip";

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

export default async function HomePage() {
  const { messages } = await getMessages();

  // Fetch real live indices from adapter
  const indicesResult = await liveMarketData.indices();
  const liveIndices = indicesResult.status === "available" ? indicesResult.data : null;

  const displayIndices: DisplayIndex[] = INDEX_CONFIG.map(({ key, name, market }) => {
    const item = liveIndices?.[key];
    const val = item?.status === "available" && item.data.value.value != null
      ? item.data.value.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "ไม่มีข้อมูล";

    const asOfTime = item?.status === "available" && item.data.provenance.sourceAsOf
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

  return (
    <div className="space-y-6">
      {/* 1. Five-Index Strip with Real Data & Auto 1-Min Polling */}
      <LiveIndicesStrip initialIndices={displayIndices} />

      {/* 2. Main Daily Brief & AI Follow-up Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Daily Brief (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <section aria-labelledby="brief-heading" className="space-y-4">
            <Card className="border-border shadow-xs">
              <CardHeader className="border-b border-border/80 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle id="brief-heading" className="text-xl font-bold">
                      {messages.dailyBrief}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ประจำวันที่ 14 พฤศจิกายน 2026 • เผยแพร่เมื่อ 14 พ.ย. 2026 08:30 น. ICT
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground mr-1">ภาษาเนื้อหา:</span>
                    <button className="px-2.5 py-1 rounded font-medium bg-primary text-white" aria-pressed="true">
                      ไทย
                    </button>
                    <button className="px-2.5 py-1 rounded font-medium bg-muted text-foreground hover:bg-muted/80">
                      EN
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-4 text-sm leading-relaxed text-foreground">
                <div className="rounded-md bg-muted/60 p-3.5 border-l-4 border-primary">
                  <p className="font-semibold text-foreground">ประเด็นหลักวันนี้:</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    ตลาดหุ้นไทยเคลื่อนไหวกรอบแคบ นำโดยกลุ่มพลังงานและค้าปลีก ขณะที่ตลาดสหรัฐฯ รอติดตามตัวเลขเงินเฟ้อและผลประกอบการกลุ่มเทคโนโลยี
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">1. ภาพรวมตลาดหุ้นไทย (SET)</h3>
                  <p>
                    ดัชนี SET ปิดบวกเล็กน้อยที่ 1,452.30 จุด โดยมีแรงซื้อเก็งกำไรในกลุ่มค้าปลีกและการท่องเที่ยวหลังเข้าสู่ช่วงไฮซีซั่นปลายปี นักลงทุนต่างชาติยังคงมีสถานะซื้อสุทธิชะลอตัวเพื่อประเมินทิศทางค่าเงินบาท
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">2. ภาพรวมตลาดหุ้นสหรัฐฯ (US Markets)</h3>
                  <p>
                    ดัชนี S&P 500 และ Nasdaq ขยับขึ้นต่อเนื่อง รับแรงหนุนจากหุ้นกลุ่มเซมิคอนดักเตอร์และ AI ที่ยังมีคำสั่งซื้อแข็งแกร่ง ขณะที่ Dow Jones ปรับฐานลงเล็กน้อยจากแรงขายทำกำไรในหุ้นกลุ่มอุตสาหกรรม
                  </p>
                </div>

                {/* Evidence Row */}
                <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">หลักฐานอ้างอิง:</span> ตลาดหลักทรัพย์แห่งประเทศไทย (SET), U.S. Bureau of Labor Statistics, ข่าวสำนักข่าวการเงิน
                  </div>
                  <div className="font-mono text-[11px]">
                    ข้อมูล ณ 14 พ.ย. 2026 • ตรวจสอบล่าสุด 22:00 น.
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Right Column: AI Follow-up & Quick Navigation (1 col) */}
        <div className="space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/80">
              <CardTitle className="text-base font-bold">
                ถาม AI ต่อจากประเด็นวันนี้
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                ตั้งคำถามวิจัยจากข้อมูลสรุปประจำวัน
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Link
                href="/chat?q=กลุ่มท่องเที่ยวไทยได้รับผลบวกอย่างไรในช่วงไฮซีซั่น"
                className="block p-3 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-accent/40 transition-all text-xs"
              >
                <p className="font-semibold text-foreground">กลุ่มท่องเที่ยวและค้าปลีกไทย</p>
                <p className="text-muted-foreground mt-1">หุ้นกลุ่มไหนได้รับผลบวกสูงสุดในช่วงไฮซีซั่นปลายปี?</p>
              </Link>

              <Link
                href="/chat?q=ทิศทางหุ้นเซมิคอนดักเตอร์สหรัฐและผลกระทบตลาดโลก"
                className="block p-3 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-accent/40 transition-all text-xs"
              >
                <p className="font-semibold text-foreground">แนวโน้มหุ้นเซมิคอนดักเตอร์สหรัฐฯ</p>
                <p className="text-muted-foreground mt-1">วิเคราะห์แนวรับ-แนวต้านและความเสี่ยงเรื่องห่วงโซ่อุปทาน</p>
              </Link>

              <div className="pt-2">
                <Link
                  href="/chat"
                  className="w-full inline-flex justify-center items-center py-2 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
                >
                  เปิดห้องสนทนาเต็มรูปแบบ →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/80">
              <CardTitle className="text-base font-bold">
                หุ้นยอดนิยมที่เปิดดูบ่อย
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                คลิกเพื่อดูรายละเอียดและวิเคราะห์ข้อมูลสด
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-xs">
              <Link
                href="/stocks/TH/PTT"
                className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors border border-border/40"
              >
                <div>
                  <span className="font-bold text-foreground">PTT</span>
                  <span className="ml-2 text-muted-foreground">ปตท. จำกัด (มหาชน)</span>
                </div>
                <span className="text-[11px] font-mono text-primary font-semibold">SET (TH) →</span>
              </Link>
              <Link
                href="/stocks/US/NVDA"
                className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors border border-border/40"
              >
                <div>
                  <span className="font-bold text-foreground">NVDA</span>
                  <span className="ml-2 text-muted-foreground">NVIDIA Corporation</span>
                </div>
                <span className="text-[11px] font-mono text-primary font-semibold">NASDAQ (US) →</span>
              </Link>
              <Link
                href="/stocks/US/AAPL"
                className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors border border-border/40"
              >
                <div>
                  <span className="font-bold text-foreground">AAPL</span>
                  <span className="ml-2 text-muted-foreground">Apple Inc.</span>
                </div>
                <span className="text-[11px] font-mono text-primary font-semibold">NASDAQ (US) →</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
