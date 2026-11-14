import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages } from "../../messages/index";
import Link from "next/link";

export default async function ChatPage() {
  const { messages } = await getMessages();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* 1. Left Sidebar: Session History */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/80">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">
                {messages.history}
              </CardTitle>
              <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                Session
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              ประวัติการสนทนาอยู่เฉพาะเซสชันนี้
            </p>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs">
            <div className="rounded p-2 bg-accent/60 border border-primary/20 text-primary font-medium cursor-pointer">
              💬 สอบถามภาพรวมตลาดหุ้นไทยปลายปี
            </div>
            <div className="rounded p-2 hover:bg-muted text-muted-foreground cursor-pointer">
              💬 วิเคราะห์งบการเงิน PTT ย้อนหลัง
            </div>
            <div className="rounded p-2 hover:bg-muted text-muted-foreground cursor-pointer">
              💬 เปรียบเทียบ P/E หุ้นกลุ่มพลังงาน
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Main Chat Conversation Area */}
      <div className="lg:col-span-3 space-y-4">
        <Card className="border-border shadow-xs min-h-[550px] flex flex-col justify-between">
          <CardHeader className="border-b border-border/80 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">
                  {messages.mainChat}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  ระบบช่วยตอบคำถามวิจัยหุ้นไทยและสหรัฐฯ พร้อมระบุหลักฐานอ้างอิงจริง
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                ● AI พร้อมตอบ
              </span>
            </div>
          </CardHeader>

          {/* Conversation Stream */}
          <CardContent className="pt-5 space-y-5 flex-1">
            {/* Grounded Starting Prompts */}
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-xs space-y-3">
              <p className="font-semibold text-foreground">💡 หัวข้อแนะนำสำหรับการวิเคราะห์วันนี้:</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button className="text-left p-2.5 rounded bg-card border border-border hover:border-primary/50 text-foreground transition-all">
                  <strong>อธิบายตัวชี้วัด ROE & D/E</strong>
                  <p className="text-[11px] text-muted-foreground mt-0.5">วิธีดูความปลอดภัยของโครงสร้างหนี้และผลตอบแทนส่วนทุน</p>
                </button>
                <button className="text-left p-2.5 rounded bg-card border border-border hover:border-primary/50 text-foreground transition-all">
                  <strong>สรุปผลกระทบอัตราดอกเบี้ย</strong>
                  <p className="text-[11px] text-muted-foreground mt-0.5">ผลกระทบต่อนโยบายการเงินและการประเมินมูลค่าหุ้น</p>
                </button>
              </div>
            </div>

            {/* Simulated Q&A Turn */}
            <div className="space-y-4">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-primary px-4 py-2.5 text-xs text-white">
                  กลุ่มค้าปลีกไทยมีแนวโน้มการเติบโตอย่างไรในไตรมาสสุดท้าย?
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-lg border border-border bg-card p-4 text-xs text-foreground space-y-2.5">
                  <div className="font-bold text-primary flex items-center gap-1.5">
                    <span>ผู้ช่วยวิจัยหุ้น</span>
                    <span className="text-[10px] text-muted-foreground font-normal">• อ้างอิงข้อมูลทางการ</span>
                  </div>
                  <p className="leading-relaxed">
                    กลุ่มค้าปลีกไทยมีปัจจัยหนุนจากมาตรการกระตุ้นการใช้จ่ายภาครัฐและฤดูกาลท่องเที่ยวช่วงปลายปี (High Season) ทำให้ยอดขายสาขาเดิม (SSSG) ของบริษัทขนาดใหญ่มีแนวโน้มปรับตัวขึ้น
                  </p>
                  <div className="rounded bg-amber-50 p-2 text-amber-900 border-l-2 border-amber-400 text-[11px]">
                    <strong>ความเสี่ยงที่ต้องติดตาม:</strong> กำลังซื้อของกลุ่มฐานรากและต้นทุนการดำเนินงานที่อาจสูงขึ้นตามค่าพลังงาน
                  </div>
                  {/* Evidence Row */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>แหล่งข้อมูล: ข้อมูลบทวิเคราะห์ตลาด SET และรายงานภาวะเศรษฐกิจ</span>
                    <span>ข้อมูล ณ 14 พ.ย. 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Composer Box */}
          <div className="p-4 border-t border-border bg-background/50 rounded-b-xl space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="พิมพ์คำถามวิจัยหุ้นหรือเปรียบเทียบตลาด (เช่น ถามเกี่ยวกับ P/E, หุ้นเทคโนโลยี)..."
                className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                className="rounded-md bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                ส่งคำถาม →
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>กด Enter เพื่อขึ้นบรรทัดใหม่ • ข้อมูลนี้สำหรับการศึกษา ไม่ใช่คำแนะนำซื้อขาย</span>
              <span>ภาษาคำตอบ: ไทย / English</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
