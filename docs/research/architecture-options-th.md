# หลักฐานประกอบการออกแบบ Security, Worker/RAG และ User context

อัปเดต 21 พฤศจิกายน 2026 · Research — บันทึกหลักฐาน ทางเลือก และข้อจำกัด ไม่ใช่มติเลือกเครื่องมือหรือผลทดสอบระบบ

## คำถามและวิธีอ่าน

งานนี้ตอบสามคำถาม: จะป้องกันการใช้ AI และข้อมูลผิดสิทธิ์อย่างไร งานเบื้องหลังและ ingestion รันที่ไหน และเก็บ/ประกอบข้อมูลผู้ใช้อย่างไร เปรียบเทียบโดยดูความสอดคล้องกับ requirements, ความถูกต้องของหลักฐาน, การกู้คืนงาน, การแยกข้อมูลส่วนตัว และภาระดูแล/ค่าใช้จ่าย

อ่านไฟล์นี้เพื่อดูเหตุผลและแหล่งอ้างอิง แล้วอ่าน [RFC Security และ User context](../rfcs/architecture-security-and-context.md) เพื่อดูข้อเสนอที่นำไปคุยในทีม รายละเอียดบริการและ DAG เดิมอยู่ใน [service research](final-architecture-service-options.md) ส่วน [final design](../final/final-architecture.md) เป็นข้อเสนอระบบเต็ม

## 1. ฐานปัจจุบันที่ต้องแยกให้ชัด

| เรื่อง | Phase 1 | ระบบเต็ม |
| --- | --- | --- |
| Web/API และข้อมูลถาวร | Next.js บน Vercel; Supabase PostgreSQL ตาม ADR เดิม | คงฐานเดียวกัน |
| งานเบื้องหลัง | Vercel Schedules, Queues และ Functions ตาม ADR 0006 ที่ Accepted แล้ว | final design เสนอ Airflow สำหรับ ingestion, backfill และ publications; ยังเป็น Proposed |
| ค้นหลักฐาน | PostgreSQL full-text search พร้อมตัดคำไทยเป็น baseline | เสนอ Pinecone เก็บ public vectors; passages/citations อยู่ Supabase |
| ผู้ใช้ | Guest chat, history เฉพาะ browser session | บัญชีและข้อมูลส่วนตัวตาม FR-14/17/20; Supabase Auth เป็นตัวเลือกใน final design |
| Trigger.dev | ไม่ใช่บริการที่จำเป็นต้องเพิ่มใน Phase 1 | ADR 0007 เก็บเป็นทางเลือกสำรอง ไม่ได้ยกเลิกข้อเสนอ Airflow |

ตารางนี้อ้างจาก [ADR index](../adr/README.md), [Phase 1 architecture](../phase-1-planning/architecture.md), [final design](../final/final-architecture.md) และ [Q03/Q07/Q08](../requirements-questions.md) สถานะเอกสารไม่ใช่หลักฐานว่าระบบ deploy แล้ว งานนี้ไม่มีผล benchmark หรือ security test ใหม่

## 2. โปรเจกต์รุ่นพี่ใช้ DAG อย่างไร และนำมาใช้ได้แค่ไหน

ตรวจ code ที่ commit `a067931aa95f9c29f0f7a3bc51bea25f0b2fe4d2` ของ [LLMFA](https://github.com/llmfa-capstone/llmfa-capstone/tree/a067931aa95f9c29f0f7a3bc51bea25f0b2fe4d2) เป็นการอ่าน source ไม่ใช่ audit ระบบที่ deploy

| สิ่งที่พบ | ผลต่อการนำมาใช้ |
| --- | --- |
| [DAG](https://github.com/llmfa-capstone/llmfa-capstone/blob/a067931aa95f9c29f0f7a3bc51bea25f0b2fe4d2/llmfa_airflow/dags/llmfa_dag.py) รันรายเดือน `0 0 1 * *`, ปิด catchup และแยก pipeline ต่อ source | ใช้แนวคิด fetch → extract → chunk → embed ได้ แต่ตารางรายเดือนไม่ตรงข่าวและ filings ของเรา |
| DAG ล้าง `scraping_output` ก่อนรัน และส่ง local paths ระหว่างขั้น | ต้องเพิ่ม durable artifacts และ checkpoint ต่อ document version ก่อนย้ายหลาย worker หรือทำ resume |
| ตั้ง retries แต่หลายขั้น catch exception แล้วคืน error record | task อาจจบสำเร็จในมุม Airflow แม้งานย่อยพัง ต้องแยก partial/failed และส่ง transient failure ให้ runner retry |
| การประมวลผลไฟล์ใน source เรียก extraction/embedding ภายใน loop | อย่าคิดว่าทุกไฟล์เป็น Airflow task แยกที่ retry ได้เอง แม้คำอธิบายจะใช้คำว่า parallel |
| [Embedding helper](https://github.com/llmfa-capstone/llmfa-capstone/blob/a067931aa95f9c29f0f7a3bc51bea25f0b2fe4d2/llmfa_airflow/libs/embedding.py) แบ่งตาม Markdown headings, ใช้ Gemini embedding และส่ง Pinecone | เป็น candidate reuse แต่ต้องวัดกับตารางงบ ภาษาไทย/อังกฤษ และขนาด passage ของเรา |
| file ID มาจากชื่อไฟล์; page matching มี fallback เป็นหน้าแรก; `create_date` มาจาก PDF metadata | ชื่อไฟล์ไม่ใช่ version identity; หน้าไม่ทราบต้องระบุว่าไม่ทราบ; PDF creation time ใช้แทนวันเผยแพร่หรือ fiscal period ไม่ได้ |
| helper อาจคืน success หลัง upsert ได้เพียงบาง chunks | ต้องตรวจจำนวนและการค้นเจอก่อนเปิดใช้ version ใหม่ ไม่ตัดสิน completeness จาก status เดียว |

[Backend handlers](https://github.com/llmfa-capstone/llmfa-capstone/blob/a067931aa95f9c29f0f7a3bc51bea25f0b2fe4d2/llmfa_backend/main.py) ที่ตรวจมีการค้น conversation ด้วย ID และ endpoint รายการ chats โดยไม่เห็น owner check ใน handler นั้น จึงไม่ควรนำ pattern นี้มาเป็นสิทธิ์เข้าถึงของเรา ข้อนี้ไม่ได้ยืนยันว่า deployment ทั้งระบบไม่มีการป้องกันภายนอก และไม่ใช่ผลทดสอบเจาะระบบ

สรุปหลักฐาน: DAG ช่วยแสดง dependency, สถานะ และการ retry แต่ไม่ได้ทำให้ข้อมูลถูกต้องหรือปลอดภัยเอง Reuse ขั้นประมวลผลได้เมื่อแก้ identity/version, provenance, failure reporting และ ownership; ไม่จำเป็นต้องยกทั้ง backend และฐานข้อมูลเก่ามาใช้

## 3. ทางเลือกการรันงานและค่าใช้จ่าย

| ทางเลือก | ความสามารถที่เกี่ยวข้อง | ข้อแลกเปลี่ยนที่ต้องวัด |
| --- | --- | --- |
| Vercel Schedules + Queues + Functions | ฐาน Phase 1 ตาม ADR 0006; แยก queue ingestion/publication | runtime, scheduling window, quota และ contention; อย่าสับสน Schedules กับ legacy Cron Jobs |
| Trigger.dev Cloud | managed TypeScript tasks, schedules, retry และ concurrency | เพิ่ม deployment; Free schedule ใหม่มี cadence ไม่ถี่กว่ารายชั่วโมงและ window อย่างน้อย 60 นาที จึงไม่ตรงข่าวทุก 30 นาที |
| Cloud Scheduler + Cloud Run Jobs | scheduled/on-demand container jobs; รองรับ dependencies ที่ต้องการ container | ต้องดูแล image, IAM และการติดตามงาน/กู้คืนร่วมกับ DB |
| Airflow | DAG dependencies, pools, backfill และ Python batch; อยู่ในข้อเสนอ final design | ต้องดูแล scheduler/API/metadata DB/execution host; วัด OCR และ backfill แข่งกับ publication |
| Supabase Cron | สั่ง SQL หรือเรียก endpoint ตามเวลา | เป็นตัวตั้งเวลา ไม่ใช่ runtime สำหรับ OCR/embedding ทุกอย่าง ต้องเลือก worker และ recovery เพิ่ม |
| GitHub Actions / VM cron | ใช้ทดลอง batch หรือ operator jobs ได้ | วัด schedule delay, secrets, host availability และวิธีเรียก first-open; ไม่ใช่ตัวแทน queue ที่มี SLA โดยอัตโนมัติ |

รายละเอียด runtime และแหล่งอ้างอิงเปรียบเทียบใน [service research](final-architecture-service-options.md#background-execution-for-the-final-version), [Supabase Cron](https://supabase.com/docs/guides/cron) และ [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

### Trigger.dev จำเป็นต้องเสียเงินหรือไม่

ไม่จำเป็นต้องเสียเงินตั้งแต่เริ่ม: [หน้า pricing](https://trigger.dev/pricing) ที่ตรวจวันที่ 21 พฤศจิกายน 2026 ระบุ Free $0/เดือน มีเครดิต $5/เดือน, 20 concurrent runs, 10 schedules และเก็บ logs 1 วัน แต่เครดิตไม่ใช่ compute ไม่จำกัด และไม่รวมค่า Supabase, model, embeddings หรือ storage

[กติกา scheduled tasks](https://trigger.dev/docs/tasks/scheduled#free-plan-minimum-window) ระบุว่า schedule ที่สร้างขณะใช้ Free รันได้ไม่ถี่กว่าชั่วโมงละครั้ง และมี window อย่างน้อย 60 นาที ข้อจำกัดนี้แยกจากจำนวน schedules และจำนวน concurrent runs งานที่ต้องเริ่มตรงเวลา/ตรวจข่าวทุก 30 นาทีจึงต้องประเมินแผนอื่น อย่าสรุปว่า Free เหมาะกับระบบเราจากคำว่าใช้ฟรีเพียงอย่างเดียว

Self-hosting มี [วิธีติดตั้ง](https://trigger.dev/docs/self-hosting/overview) แต่ยังมีค่าเครื่อง ฐานข้อมูล และการดูแล งบจริงต้องวัดเวลารัน จำนวน retries ปริมาณ OCR/embedding และ logs ของ workload เดียวกัน ยังไม่มีตัวเลขค่าใช้จ่ายต่อเดือนของโปรเจกต์นี้

## 4. หลักฐานด้าน Security

[OWASP prompt injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) อธิบายความเสี่ยงจากคำสั่งที่ซ่อนใน input และเอกสาร การแยก instructions ช่วยได้ แต่ต้องมีสิทธิ์และเครื่องมือที่บังคับด้วย code จึงจะจำกัดผลเสียได้

[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) รองรับ ownership policies สำหรับตารางที่ expose แต่ service roles และ roles ที่ bypass RLS ยังเข้าถึงได้ การแยก DB roles/grants จึงสำคัญพอ ๆ กับ policy โดย direct DB connection ไม่ได้มีตัวตนผู้ใช้ปลายทางให้อัตโนมัติ

[Gemini terms](https://aistudio.google.com/docs/terms) ห้ามส่ง sensitive/confidential/personal information เข้า Unpaid Services การไม่บันทึก chat หรือการขอ consent ไม่ได้ทำให้ข้อจำกัดนี้หายไป Guest อาจพิมพ์ข้อมูลส่วนตัวเองได้ จึงต้องตรวจข้อความและ history ก่อนส่ง ไม่ใช่ตรวจเฉพาะ saved Profile

เกณฑ์ release ที่เจ้าของตกลงแล้วอยู่ใน [Phase 1 requirements](../phase-1-planning/functional-requirements.md#release-acceptance) รายละเอียด enforcement ที่เสนอแยกใน RFC; ยังไม่ได้ทดสอบว่าทุกชั้นป้องกันได้จริง

## 5. User context: ทางเลือกจัดเก็บ

| ที่เก็บ | เหมาะกับ | ข้อจำกัด |
| --- | --- | --- |
| PostgreSQL relational records | Profile, holdings, ownership, preferences และ versions; สอดคล้อง ADR 0005 | ต้องออกแบบ grants/ownership/retention และประกอบ context ฝั่ง server |
| Document database | ข้อมูลยืดหยุ่นและ nested documents | เพิ่มฐานข้อมูลและขอบเขตสิทธิ์/การลบอีกชุด; repo ปัจจุบันเลือก PostgreSQL แล้ว |
| Vector index | ค้น passages สาธารณะตามความหมาย | ไม่ใช่แหล่งหลักของ holdings หรือ Profile ล่าสุด และ shared index ต้องไม่มีข้อมูลส่วนตัว |
| Browser session | history ชั่วคราวของ Phase 1 | ไม่ใช่บัญชีหรือสิทธิ์อ่านข้อมูลฝั่ง server และไม่รองรับ cross-device persistence |

กติกาที่ตกลงแล้ว: Profile optional/off by default; Watchlist/Portfolio แนบแยกแต่ละคำถาม; replay history ต้องตรวจสิทธิ์ล่าสุด; saved chats opt-in หมดอายุ 90 วันหลังข้อความสุดท้าย; app backups ไม่เกิน 30 วันและต้องใช้ deletion/expiry ก่อนเปิด restore อ่าน [Q07](../requirements-questions.md#q07-personalization-and-personal-data-controls) สำหรับรายละเอียด การเลือก Auth, private model service และ cross-device behavior บางส่วนยังเปิดอยู่

## 6. สิ่งที่หลักฐานยังตอบไม่ได้

ยังต้องวัด ingestion ของ filing ไทย/US จริง, OCR และ table accuracy, Thai-to-English retrieval, failure recovery, เวลาตั้งแต่ schedule ถึงใช้งานได้ และค่าใช้จ่ายเมื่อมีงานพร้อมกัน รวมถึง source permissions ต่อแหล่ง รายการทดสอบและข้อเสนอระบบอยู่ใน [RFC](../rfcs/architecture-security-and-context.md) และ [final design acceptance](../final/final-architecture.md#evidence-needed-before-acceptance)
