# สรุปทางเลือก architecture สำหรับคุยในทีม

ตรวจเอกสารและ branch `setup-project-architecture` วันที่ 20 พฤศจิกายน 2026  
สถานะ: ข้อเสนอจากการอ่าน repo และเอกสารผู้ให้บริการ ยังไม่ได้ทดลอง deploy หรือ benchmark และยังไม่ใช่มติทีม

## ทางที่แนะนำ

คง **Next.js บน Vercel + Supabase PostgreSQL** ตาม ADR 0001/0005/0006 และเสนอใช้ **Trigger.dev Cloud รัน worker** แยกจากเว็บ การตอบแชตอยู่ที่ Next.js ส่วนงานสร้างสรุปและ ingestion อยู่ที่ worker ใช้โมดูล server ร่วมกันได้โดยไม่ผูกกับ Next.js request API

| เรื่อง | ฐานเดิมใน repo | ข้อเสนอเพิ่มเติม |
| --- | --- | --- |
| Web/API | Next.js, Vercel ตกลงแล้ว | คงเดิม |
| งานเบื้องหลัง | แยก worker แต่ scheduler ยังเปิด; `apps/worker` มีแค่ placeholder | Trigger.dev Cloud เป็นตัวเลือกแรกสำหรับทดลอง |
| ข้อมูลถาวร | Supabase PostgreSQL ตกลงแล้ว; migrations ยังมีแค่ placeholder | เก็บ publication/evidence/job state ที่นี่ |
| Security | มี trust boundaries ในเอกสารแล้ว | บังคับที่ API, สิทธิ์ DB, retrieval และ output validation |
| User context | Phase 1 ไม่มีบัญชี; chat history เฉพาะ session | Phase ถัดไปเก็บ Profile/Portfolio เป็น relational records แล้วประกอบ context ฝั่ง server |
| RAG | มีข้อกำหนด grounded answer แต่ยังไม่เท่ากับมี ingestion แล้ว | เริ่มจาก evidence ที่ตรวจสอบแหล่งได้; เพิ่ม pgvector เมื่อมี corpus ให้ค้นจริง |

## 1. งานเบื้องหลังรันที่ไหนและอย่างไร

| ทางเลือก | จุดเด่น | ข้อแลกเปลี่ยน / เหมาะเมื่อ |
| --- | --- | --- |
| **Trigger.dev Cloud — แนะนำให้ทดลองก่อน** | TypeScript, scheduled/event tasks, retry, concurrency และดูสถานะงานได้; code worker deploy ไป managed workers [1–3] | เพิ่มผู้ให้บริการและค่า compute/invocation; ต้องตรวจ runtime และ workspace packaging จริง |
| Vercel Schedules + Workflow/Queue | อยู่กับ hosting เดิม; Schedules รองรับ timezone, private targets และเรียก durable workflow ได้ [4] | Schedules ยังเป็น Beta ณ วันที่ตรวจ; ต้องประเมิน limits, ค่าใช้จ่าย และ runtime ของ target เพิ่มก่อนเลือก |
| Apache Airflow | ใช้ DAG ระบุ dependency และติดตาม workflow ได้ เหมาะกับ batch pipeline หลายแหล่ง/งาน backfill [5] | มี scheduler, DAG processor, API server และ metadata DB; ประเมินว่าภาระดูแลสูงกว่าที่ prototype ตอนนี้ต้องใช้ |
| Vercel Cron Jobs เดิม | trigger งานสั้นได้ตรงไปตรงมา | Hobby รันได้วันละครั้ง จึงไม่ตรง Daily Brief รายชั่วโมง; เป็น legacy คนละผลิตภัณฑ์กับ Schedules ใหม่ [6] |

**DAG ของรุ่นพี่เอามาใช้ได้ไหม:** ใช้แนวคิด dependency ได้ เช่น fetch → validate → normalize → generate สองภาษา → ตรวจหลักฐาน → publish แต่ยังไม่ได้เห็น DAG/code ของรุ่นพี่ จึงยืนยัน reuse implementation ไม่ได้ และการทำ pipeline เป็นขั้นตอนไม่ได้บังคับว่าต้องติดตั้ง Airflow

Daily Brief ใช้ scheduled task รายชั่วโมง ส่วน stock summary ให้เว็บ resolve listing/วันไทยและส่ง identifier เพื่อ trigger งานเมื่อเปิดครั้งแรกของวัน ไม่รัน ingestion ยาวค้างไว้ใน HTTP request งาน manual ใช้ logic เดียวกันกับงานตามเวลา

DB เป็นผู้ยืนยันผลสำเร็จ: ใช้ unique job key, claim ที่หมดอายุและกู้คืนได้, attempt/version ป้องกันงานเก่าทับใหม่ และ transaction เผยแพร่สองภาษาพร้อม evidence ตาม ADR 0004 ตัว runner มี idempotency ช่วยลดงานซ้ำ แต่มี TTL จึงไม่แทนข้อบังคับใน DB [2] เมื่อ runner ล่มเก็บ last successful publication ไว้และแสดงเวลาเดิม; การชดเชย missed run ต้องกำหนดใน worker ไม่สมมติว่า cron จะทำให้เอง

ค่าใช้จ่ายอ้างอิง [3]: Free มีเครดิต $5/เดือน, 10 schedules และ log retention 1 วัน คิด compute กับ invocation แยกกัน ต้องเก็บสถานะงานที่จำเป็นใน DB เอง ตัวอย่างสมมติ 720 runs/เดือน บน Small 1x เฉลี่ย 60 วินาที/run เท่ากับ 720 × (60 × $0.0000338 + $0.000025) ≈ **$1.48/เดือนเฉพาะ runner** ไม่รวม retries, ingestion, stock summaries, LLM, embeddings, DB และเว็บ จึงยังสรุปไม่ได้ว่าระบบจริงใช้ฟรีพอ

## 2. RAG / document ingestion

รัน pipeline ใน worker: รับ source ID จากรายการที่ทีมกำหนด → fetch โดยจำกัด domain/redirect/ขนาด/เวลา → parse → ตรวจและแยกเนื้อหา → deduplicate ด้วย content hash → chunk/embed เมื่อจำเป็น → บันทึก version → เปิดใช้ version ที่เสร็จครบ เก็บ source URL, document ID, reporting period, observed/fetched time และตำแหน่งข้อความสำหรับ citation

เก็บ metadata/chunks ใน PostgreSQL; ถ้าต้องใช้ semantic search ให้ใช้ pgvector ใน Supabase ก่อนเพิ่ม vector DB แยก [7] ไฟล์ต้นฉบับที่ต้องเก็บใช้ object storage หลังตรวจสิทธิ์การนำมาใช้/เก็บ ไม่ใช้ local disk ของเว็บเป็นที่เก็บถาวร การเลือก embedding model, มิติ vector, chunking และดัชนีต้องทดลองกับข้อมูลไทย/อังกฤษก่อน ไม่มีผลทดสอบในงานนี้

ราคา/งบการเงิน/Portfolio ใช้ structured query และสูตรคำนวณที่ตรวจได้ ไม่ดึงตัวเลขผ่าน vector search เป็นแหล่งหลัก RAG ใช้ค้นข้อความประกอบคำอธิบาย ไม่ได้หมายความว่าต้อง ingest เอกสารทุกชนิดตั้งแต่ Phase 1; file upload และ long-term memory ยังอยู่นอก baseline

## 3. Security guardrails

ใช้หลายชั้นตาม trust boundaries เดิม ไม่ถือว่า system prompt หรือ RAG ป้องกัน prompt injection ได้ทั้งหมด [8]

- **ก่อนเรียก AI:** validate schema/ขนาด, resolve listing และ evidence ฝั่ง server, จำกัดอัตราใช้งานและงบ token/concurrency สำหรับ guest chat; history จาก browser เป็นข้อมูลที่ไม่เชื่อถือและไม่ใช่หลักฐานอ้างอิง
- **สิทธิ์:** model เรียกได้เฉพาะเครื่องมือที่อนุญาตและตรวจ input แล้ว ไม่มี arbitrary SQL/shell/URL หรือสิทธิ์แก้ holdings; shared publication worker ไม่มีสิทธิ์อ่าน private tables
- **Retrieval:** เอกสารเป็นข้อมูล ไม่ใช่คำสั่ง; แยก instructions ออกจาก passages, จำกัดแหล่งและจำนวนรอบค้น, เก็บ provenance และตรวจสิทธิ์ก่อนค้นข้อมูลส่วนตัว
- **ผลลัพธ์:** ตรวจ schema, citation ต้องเป็น evidence ที่ดึงมาจริงและรองรับ claim; ตรวจตัวเลข/หน่วย/ช่วงเวลาด้วย code เมื่อทำได้ ถ้าหลักฐานไม่พอให้ตอบจำกัดหรือแจ้งว่าไม่พบข้อมูล การตรวจเชิงความหมายยังมีโอกาสผิด ต้องมีชุดประเมิน
- **Web/operations:** render Markdown โดยปิด raw HTML และกรอง URL scheme, เก็บ secrets ฝั่ง server, ตัดข้อมูลส่วนตัวออกจาก logs/traces, แยก dev/prod และบันทึก error โดยไม่แนบ prompt เต็ม

คงข้อกำหนด FR-19: ไม่มีคำสั่งซื้อขายเด็ดขาดหรือรับประกันกำไร พร้อมข้อความเตือนความเสี่ยง การทดสอบขั้นต่ำที่ควรทำก่อนส่งงานคือ indirect prompt injection ในเอกสาร, citation ไม่ตรง claim, session A อ่าน B, และ worker อ่าน private schema ไม่ได้ ทั้งหมดเป็นรายการที่เสนอให้ทดสอบ **ยังไม่ได้รันทดสอบ**

## 4. User context เก็บและดึงอย่างไร

**Phase 1:** เก็บ history เฉพาะ browser session เช่น sessionStorage เพื่อใช้ร่วมระหว่างหน้าโดยไม่ restore ข้าม session; ไม่เพิ่ม saved Profile/Portfolio หรือ user memory ถ้าฝั่ง server เก็บ session state ต้องผูกกับ session secret ที่ตรวจสอบได้และล้างตามอายุ ไม่ให้ client-supplied conversation ID เป็นสิทธิ์เข้าถึงเอง

**Phase ที่มีบัญชี:** เสนอเก็บ `profiles`, `portfolio_positions`, `watchlist_items` เป็นตาราง relational ใน private schema ผูก owner ID จาก authenticated session การเลือก Auth และนโยบาย consent/retention/deletion ยังอยู่ Q03/Q07 จึงยังไม่กำหนด default แทนทีม

เมื่อมีแชตใหม่: server ตรวจ session → อ่านเฉพาะ records ของเจ้าของที่อนุญาตให้ใช้ → คำนวณ portfolio snapshot ด้วย code → เลือกเฉพาะ field ที่จำเป็น → ประกอบกับ stock context และ evidence สาธารณะ → ส่งให้ model ไม่รับ user ID จากคำตอบ AI มาใช้เลือกเจ้าของข้อมูล และไม่ฝังทั้ง Portfolio ลง vector DB เพราะเป็นข้อมูลเปลี่ยนแปลงที่ต้องอ่านให้ตรงเวอร์ชัน

ใช้ scoped DB roles + ownership checks; ตารางที่ expose ผ่าน Data API ต้องมี RLS การใช้ privileged/service role อาจ bypass RLS จึงต้องไม่คิดว่าใส่ policy แล้วทุก connection จะปลอดภัย [9] shared role ไม่มี grant ถึง private schema; แชตที่มีข้อมูลส่วนตัวห้ามใช้ shared response cache

ถ้าปิดใช้ Profile ต้องกรองบริบทที่ส่งเข้าใหม่รวมถึง history/summary ที่อาจมีค่าเดิมตามนโยบายที่ทีมตกลง ไม่ใช่แค่หยุดอ่านตารางใหม่ ข้อสรุปเรื่องลบข้อมูลย้อนหลังยังรอ Q07

## เรื่องที่ต้องตกลงร่วมกัน

1. **เลือกเครื่องมือรันงานเบื้องหลัง**  
   จะใช้ Trigger.dev ตามข้อเสนอ หรือทดลอง Vercel Schedules/Workflow ก่อน โดยตรวจว่ารันโค้ดของเรา เชื่อมต่อ Supabase และมีค่าใช้จ่ายอยู่ในงบได้หรือไม่
2. **กำหนดเอกสารที่ AI จะใช้ค้นข้อมูล**  
   จะเริ่มจากข่าว รายงานบริษัท หรือเอกสารประเภทไหน มีสิทธิ์นำมาเก็บและใช้งานหรือไม่ และจำเป็นต้องค้นตามความหมายด้วย vector search หรือใช้วิธีค้นทั่วไปก่อนก็พอ
3. **กำหนดการจัดการข้อมูลส่วนตัว**  
   สำหรับ Phase ที่เพิ่มบัญชีผู้ใช้ ต้องตกลงวิธีเข้าสู่ระบบ การอนุญาตให้ AI ใช้ Profile/Portfolio ระยะเวลาเก็บข้อมูล และวิธีลบข้อมูล โดยคำถามเหล่านี้อยู่ใน Q03 และ Q07

### สถานะของข้อเสนอ

ข้อเสนอให้ใช้ Trigger.dev บันทึกไว้ใน [ADR 0007](../adr/0007-managed-worker-execution.md) สถานะ **Proposed — เสนอให้พิจารณา** เมื่อทีมตกลงเลือกแล้วจึงเปลี่ยนเป็น **Accepted — ตกลงใช้แล้ว**

ข้อ 1 เกี่ยวกับการยอมรับ ADR 0007 โดยตรง ส่วนข้อ 2–3 เป็นเรื่องที่ต้องตกลงสำหรับการออกแบบ RAG และข้อมูลผู้ใช้ ไม่จำเป็นต้องตอบครบทั้งสามข้อจึงจะเลือกเครื่องมือรันงานเบื้องหลังได้

ส่วนการใช้ Supabase PostgreSQL และหลักการแยกข้อมูลสาธารณะกับข้อมูลส่วนตัว มีบันทึกไว้ใน ADR เดิมแล้ว เอกสารนี้เน้นสรุปทางเลือกเพื่อคุยกันในทีม

## References

เอกสารผู้ให้บริการตรวจเมื่อ 20 พฤศจิกายน 2026; ราคา/สถานะอาจเปลี่ยนได้ ข้อเสนอความเหมาะสมเป็นการประเมินของงานนี้ ไม่ใช่ผล benchmark

1. [Trigger.dev scheduled tasks](https://trigger.dev/docs/tasks/scheduled)
2. [Trigger.dev idempotency และ TTL](https://trigger.dev/docs/idempotency)
3. [Trigger.dev Cloud pricing](https://trigger.dev/pricing)
4. [Vercel Schedules — Beta, targets และ Workflow](https://vercel.com/docs/schedules)
5. [Apache Airflow architecture/components](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html)
6. [Vercel legacy Cron Jobs limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)
7. [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
8. [OWASP prompt injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
9. [Supabase RLS และ bypass roles](https://supabase.com/docs/guides/database/postgres/row-level-security)
