# Security, Worker/RAG ingestion และ User context

Proposed · 21 November 2026

เอกสารนี้เสนอวิธีบังคับใช้ guardrails และประกอบข้อมูลผู้ใช้ร่วมกับ worker/RAG จาก [Research](../research/architecture-options-th.md) ไม่ได้เปลี่ยน requirements หรือรับรองว่า implementation ผ่านการทดสอบแล้ว

## 1. ภาพรวมสำหรับคุยกับทีม

เว็บตรวจคำขอและสิทธิ์ก่อนเรียก AI; worker เตรียมหลักฐานและสร้างสรุปอยู่เบื้องหลัง; Supabase เก็บข้อมูลจริงและสถานะงาน; ระบบค้นคืนเฉพาะหลักฐานสาธารณะที่ตรงบริษัท/ช่วงเวลา ข้อมูลส่วนตัวอ่านตามเจ้าของและการอนุญาตของคำถามนั้น แล้วประกอบ context ฝั่ง server

**Phase 1 ใช้ Vercel ตาม ADR 0006** และ full-text search ใน PostgreSQL; guest history อยู่เฉพาะ session **ระบบเต็มตาม final design ยังเป็น Proposed** ใช้ Airflow ดูแล ingestion/publication และ Pinecone ค้น public vectors ส่วน Trigger.dev เป็นทางเลือกสำรองใน ADR 0007 ไม่ใช่เงื่อนไขบังคับของงานนี้

อ่านรายละเอียด deployment ใน [Phase 1 architecture](../phase-1-planning/architecture.md) และ [final design](../final/final-architecture.md) เพื่อไม่ให้คำว่า worker ถูกตีความว่าเลือก runner เดียวกันทุก Phase

## 2. Security guardrails ที่เสนอ

### ก่อนเรียก model และเครื่องมือ

- API ตรวจ schema ด้วย Zod, ความยาวข้อความ, จำนวนรายการ, session/account และเพดาน rate/token/concurrency กำหนดค่าจริงตาม Q08; รับ history เป็นข้อมูลไม่เชื่อถือ และไม่ยอมรับ system instructions หรือ identity ที่ client อ้างเอง
- Phase 1 หากมี server session ต้องผูกกับ secret ที่ตรวจสอบได้และ TTL; conversation ID อย่างเดียวไม่ใช่สิทธิ์ ระบบเต็ม derive owner จาก authenticated session/JWT ที่ตรวจแล้ว ตรวจ owner ทุก read/write รวม messages, exports และ deletion
- อนุญาตเฉพาะ tools ที่กำหนด เช่น quote, financials, filing search และ news; server ตรวจ listing/issuer/period/cutoff/ownership ทุกครั้ง จำกัดจำนวนรอบและ timeout ไม่เปิด arbitrary SQL, shell, URL fetch หรือการแก้ holdings ให้ model
- ตรวจข้อจำกัด model provider ก่อนส่ง message, history, attachments และ logs ทั้งชุด Unpaid Gemini ต้องบล็อก restricted information ตาม Phase 1 gate; ถ้าตรวจไม่ได้อย่างมั่นใจให้หยุดคำขอนั้นและไม่ส่งข้อความดิบไปให้ model ตัวอื่นช่วยตรวจโดยไม่มีสิทธิ์ ไม่มี classifier ใดรับประกันตรวจข้อมูลส่วนตัวได้ครบ จึงต้องประเมิน false negatives และความเหมาะสมก่อนเปิดใช้งาน
- ข้อเสนอสำหรับ Phase 2 ให้ตรวจ intent หลังผ่านข้อจำกัดของ model provider แล้ว หากคำถามเจาะจงบริษัท ให้ระบุบริษัทให้ชัดเจนก่อนค้นหลักฐาน โหลด Daily Brief เฉพาะคำขอที่เข้าสู่ขั้นตอนค้นหลักฐาน แล้วตรวจข้อจำกัดของ provider อีกครั้งกับ context ที่ประกอบแล้ว [Chat workflow](ai-workflow-orchestration.md#three-workflow-shapes)

### เอกสารและ ingestion

รับ source IDs ที่ allowlist แล้ว แปลงเป็น URL ฝั่ง server ตรวจ protocol, domain และปลายทางหลัง redirect/DNS ป้องกันการเข้าถึง loopback, private network และ metadata endpoints จำกัดขนาดไฟล์ จำนวนหน้า เวลาประมวลผล และเส้นทางไฟล์ ไม่รันเนื้อหาที่ดาวน์โหลดเป็น code

ข้อความในเอกสารเป็นหลักฐาน ไม่ใช่ instructions แม้จะเขียนให้เปลี่ยนบริษัท เปิดเผย secret หรือเรียก tool การตรวจสิทธิ์/ขอบเขตยังอยู่ใน code และใช้เกณฑ์เดียวกับคำขอปกติ

### คำตอบและการแสดงผล

ตรวจ structured output และ citation IDs ว่าอยู่ใน evidence ของคำขอนี้ บริษัท/ช่วงเวลา/เวอร์ชันตรงกัน ตัวเลขและ Portfolio calculations ใช้ code ที่ตรวจสอบได้ จากนั้นตรวจว่าหลักฐานรองรับ material claims การตรวจเชิงความหมายยังผิดได้ จึงต้องมีชุดประเมินไทย/อังกฤษ

ถ้าตรวจไม่ผ่านให้ลองแก้หนึ่งครั้งภายในงบ แล้วตอบข้อจำกัดหรือ evidence gap ระหว่างทำงาน stream ได้เฉพาะ progress/status ส่วน claims/citations ส่งหลัง validation หรือเป็นส่วนย่อยที่ตรวจแล้ว ห้ามส่ง draft ที่ยังไม่ตรวจแล้วค่อยถอนทีหลัง

Render Markdown โดยปิด raw HTML และกรอง URL schemes; เก็บ secret ฝั่ง server แยก dev/prod จำกัดสิทธิ์ network/DB ใช้ origin/CSRF controls ให้ตรง session mechanism ไม่บันทึก raw guest prompts หรือ private context ใน telemetry ระบุความเสี่ยงและไม่รับประกันกำไร/สั่งซื้อขายเด็ดขาดตาม FR-19

## 3. งานเบื้องหลังและ RAG ทำงานอย่างไร

### Schedule และ first-open

คงตารางที่ตกลงแล้ว: งานเก็บข่าวสำหรับค้นหลักฐาน `:00/:30` กรุงเทพฯ; Daily Brief `:25` ทุกชั่วโมงรวมสุดสัปดาห์; US filings ทุกชั่วโมง 06:00–23:00 วันทำงานตาม New York; Thai filings 09:00/14:00/22:00 วันทำงานตามกรุงเทพฯ ตารางไม่เท่ากับเวลาเริ่มจริง ต้องวัด dispatch/queue delay ด้วย [FR-03/FR-12](../final/functional-requirements.md) เป็นแหล่งข้อกำหนดหลัก

Worker ดึงดัชนีโลกและข่าวจากฟีดที่อนุมัติผ่าน shared adapter ตอนรัน เรียก Gemini ครั้งเดียวต่อความพยายามสร้าง และใช้หลักฐานกับ cutoff เดียวกันทั้งสองภาษา [Daily Brief requirements](../final/functional-requirements.md#fr-03-daily-brief-content-and-publication)

เมื่อเปิด Stock Detail จริง browser จึงขอ summary; server resolve listing และบันทึก durable job ที่ unique ตาม listing + Thai date จากนั้นส่ง job ID ไป queue ของ Phase 1 หรือ authenticated Airflow API ตาม final design รอ acknowledgement ของการส่งงานภายใน timeout แต่ไม่รอ generation หากส่งไม่สำเร็จยังมี job ให้ recovery sweep เก็บต่อ ไม่พึ่ง promise ที่ปล่อยทิ้งหลัง response

แสดง preparing พร้อม summary เก่าที่ระบุวันที่จริง Browser poll ผ่านเว็บพร้อม backoff; ห้ามแสดง fallback เมื่อวานเป็น context ของ Daily Brief วันนี้ ไม่สร้าง stock summary ล่วงหน้าจาก prefetch/crawler

### Durable state และ retry

เสนอ job record มี `job_id`, kind, unique key, status, attempt, next retry, lease expiry และ attempt token Daily Brief key ต้องมี scheduled hourly slot ไม่ใช้ date อย่างเดียว; stock summary ใช้ listing + Thai date; document processing ใช้ source identity + content hash + processor version

Worker claim ด้วย conditional update และ heartbeat งานยาว Retry transient errors ด้วย backoff/attempt limit แยก invalid source/schema/permission เป็น permanent failure ตั้ง recovery sweep สำหรับ pending และ expired leases การส่งซ้ำเกิดได้ จึงต้องให้ write ซ้ำได้อย่างปลอดภัย ไม่อ้าง exactly-once execution

Generate นอก transaction แล้ว commit outputs, evidence และภาษาไทย/อังกฤษใน transaction สั้นพร้อมตรวจ attempt token/version งานเก่าที่ lease หมดหรือถูกแทนแล้วห้าม publish ทับใหม่ เก็บ last successful publication เมื่อรันล้มเหลว ตาม ADR 0004

### Ingestion และ retrieval

1. เริ่มจาก pilot AAPL, JPM, WMT, ADVANC, KBANK, PTT และประเภทเอกสารตาม Phase 1 requirements ตรวจสิทธิ์แต่ละ source ก่อนเปิดใช้ ดึงเฉพาะใหม่/แก้ไขตาม checkpoint ไม่ crawl ทั้งเว็บทุกชั่วโมง
2. เก็บ raw artifact แบบ durable เมื่อจำเป็น พร้อม source URL, content hash และ provenance; object storage เป็นตัวเลือกสำหรับไฟล์ ไม่ใช้ local path ข้าม task เป็นแหล่งหลัก เลือก native PDF text ก่อนและ OCR เมื่อจำเป็น ประเมิน Python helpers ของรุ่นพี่ภายใต้ runtime ที่เลือก ไม่เพิ่ม FastAPI เพียงเพื่อรัน batch
3. เก็บ figures, passages, issuer, fiscal period, reporting basis, currency/units และตำแหน่งหน้า/section/table ใน Supabase แยก source publication time, fetch time และ searchable time หน้าไม่ทราบให้ระบุไม่ทราบ ไม่ fallback เป็นหน้าแรก; PDF CreationDate ไม่ใช่วันเผยแพร่
4. Phase 1 สร้าง full-text index พร้อมตัดคำไทย ระบบเต็ม embed public passages ที่เปลี่ยน ส่ง vectors + passage IDs/metadata ไป Pinecone ตรวจ completeness และ query visibility ก่อน activate version เก็บเวอร์ชันก่อนที่สมบูรณ์ไว้ระหว่าง failure
5. ก่อน ranking ตรวจ issuer, market, period, reporting basis และ historical cutoff; หลัง vector search โหลด passage จริงจาก Supabase และตรวจว่า version ยัง eligible อยู่ เปรียบเทียบบริษัทแยก query ต่อ issuer; ambiguous identity ต้องถาม ไม่เลือกบริษัทใกล้ที่สุดหรือถอด filter เอง

ใช้ [retrieval RFC](financial-evidence-retrieval.md) เป็นหลักด้าน ranking/evaluation และ [workflow RFC](ai-workflow-orchestration.md) เป็นหลักด้าน orchestration Airflow metadata เก็บสถานะ DAG/task ส่วน Supabase เก็บ document/publication authority; สองอย่างนี้แทนกันไม่ได้

## 4. User context เก็บที่ไหน และดึงมาใช้อย่างไร

### แหล่งข้อมูลและสิทธิ์

Phase 1 ไม่มี saved Profile/Portfolio และไม่ restore chat ข้าม browser session สำหรับระบบเต็มเสนอ relational records ใน private schema ของ Supabase ตาม ADR 0005: `profiles`, `portfolio_positions`, `watchlist_items`, `context_preferences` และ conversations/messages เมื่อผู้ใช้ opt-in แต่ละ record มี owner และ version/update time ชื่อเหล่านี้เป็นแบบจำลองเสนอ ไม่ใช่ migration ที่สร้างแล้ว

Supabase Auth ยังเป็นตัวเลือกใน final design ไม่ใช่มติใหม่ใน RFC นี้ ตรวจ authenticated identity ที่ server และบังคับ ownership ทุก query ใช้ scoped roles/grants; shared ingestion/publication worker ไม่มี private-data grants ตารางที่ expose ผ่าน Data API ต้องมี RLS และห้ามถือว่า privileged/service role ถูกจำกัดโดย policy เดียวกัน Direct DB ต้องส่ง request identity ที่เชื่อถือได้ผ่านกลไกที่ออกแบบไว้ ไม่ได้มี `auth.uid()` ของผู้ใช้ให้อัตโนมัติ

### การประกอบ context ต่อคำถาม

Server ตรวจ identity → อ่าน preferences ล่าสุด → ตรวจ Profile enabled และ attachment ของคำถามนี้ → อ่านเฉพาะ records ของเจ้าของ → คำนวณ portfolio snapshot ด้วย code ตาม FR-22 → เลือก fields เท่าที่จำเป็น พร้อม timestamp/version → รวมกับ listing และ public evidence → ตรวจ provider restrictions → เรียก model → ตรวจผลลัพธ์

Profile ช่วยปรับรูปแบบ/ระดับรายละเอียด ไม่ใช่หลักฐานข้อเท็จจริงตลาด Portfolio คำนวณจาก holdings และ quote/FX snapshot ไม่ส่งทั้งบัญชีไป vector DB แยก cache ส่วนตัวตาม owner/context version หรือไม่ cache และห้ามใส่ private prompts/results ลง shared publications/index

### Consent, history และการลบ — คงกติกาที่ตกลงแล้ว

| กรณี | พฤติกรรมตาม FR-14/17/20 และ Q07 |
| --- | --- |
| Profile | optional และ off by default; ปิดแล้วตัด fields รวมถึงประวัติ/summary ที่เปิดเผยข้อมูลนั้นออกจาก model requests ถัดไป |
| Watchlist/Portfolio | ผู้ใช้แนบแยกแต่ละคำถาม; เคยแนบก่อนหน้าไม่ใช่การอนุญาตครั้งใหม่ รวม replay history |
| Saved chats | opt-in, หมดอายุ 90 วันหลังข้อความสุดท้าย; ไม่ opt-in อยู่เฉพาะ session; ลบรายแชตหรือทั้งหมดได้ |
| ลบ Profile | เก็บ transcripts ที่ยังอยู่ใน retention ให้ดูได้ แต่ไม่ส่งรายละเอียด Profile ต่อไป ลบ derived summaries และเสนอให้ลบ affected chats |
| Account deletion / restore | ลบ Profile และ saved chats; app-controlled backups ไม่เกิน 30 วัน; apply deletions และ expirations ก่อนเปิด restore |

เสนอเก็บ provenance ของ private context ต่อ message/summary เพื่อกรองประวัติได้ถูกต้อง; ถ้าพิสูจน์ไม่ได้ว่าข้อความเก่าปลอดจากข้อมูลที่ถอนสิทธิ์แล้ว ให้ไม่ replay ส่วนนั้นและเริ่มบริบทใหม่ ต้อง invalidate derived caches ตาม owner/version การปิดใช้งานกับการลบเป็นคนละการกระทำตาม requirement

Private model service และ retention ของ provider ยังต้องอนุมัติตาม Q07; consent ของผู้ใช้ไม่ลบข้อห้ามของ Unpaid Gemini และห้ามสรุปว่า paid API ไม่มี retention โดยอัตโนมัติ ดู [service research](../research/final-architecture-service-options.md#model-for-private-ai-context)

## 5. สิ่งที่ต้องพิสูจน์ก่อนยอมรับและนำไปใช้

| ชุดทดสอบที่เสนอ | ผลที่ต้องตรวจ |
| --- | --- |
| Session/account A ส่ง IDs ของ B; privileged DB connection | อ่าน/แก้/ลบของ B ไม่ได้; shared worker อ่าน private schema ไม่ได้ |
| Indirect prompt injection, URL redirect/internal IP, tool arguments | ไม่เปลี่ยน scope/สิทธิ์ ไม่ fetch ปลายทางต้องห้าม ไม่เปิดเผย secrets |
| Wrong issuer/period/version, invented citation, unsupported claim | ถามให้ชัดหรือแจ้ง gap; ไม่ส่ง material claim ก่อนตรวจ; รวมไทย/อังกฤษ |
| Duplicate dispatch, lease expiry, worker kill, runner outage | กู้ pending ได้; stale attempt publish ไม่ได้; last success คงอยู่ |
| Same filename/new hash, partial embedding/upsert, unknown page | version ไม่ปน ไม่ activate index บางส่วน และไม่สร้างเลขหน้าเท็จ |
| Disable/delete Profile, per-question attachments, history replay, restore | สิทธิ์ล่าสุดใช้กับทั้ง input ใหม่ ประวัติ summaries และ caches; expiry/deletion มีผลก่อนเปิด restore |
| Guest พิมพ์ข้อมูลส่วนตัวและ telemetry | restricted data ไม่ถึง unpaid model และไม่ปรากฏ raw prompts ใน logs |
| OCR/backfill + hourly brief + first opens พร้อมกัน | วัด wait/freshness/cost กับเป้าหมาย Q08 และข้อจำกัด runtime จริง |

รายการนี้เป็นแผนตรวจ ไม่ใช่ผลผ่าน ขนาด eval set, เพดาน usage, latency และงบยังต้องกำหนดใน Q08 โดยไม่เปลี่ยน release blockers ที่ตกลงแล้ว ADR 0007 คง Proposed; การเปลี่ยน runner ที่ Accepted ต้องทำตาม ADR criteria และไม่อนุมานว่ารับรองการออกแบบทั้งหมดจากการเลือกบริการเพียงอย่างเดียว
