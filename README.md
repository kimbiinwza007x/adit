# Adit

ระบบช่วยปรับข้อความภาษาไทยจากต้นฉบับ (Before) ให้สุภาพและเป็นทางการมากขึ้น (After)
โดยผู้ใช้แก้ไขเองได้ตลอดเวลา และจะให้ AI ช่วยปรับหรือไม่ก็ได้

รายละเอียดขอบเขตของระบบอยู่ใน [Adit.md](Adit.md)

## โครงสร้าง

```
adit/
├─ apps/web      Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Lucide
├─ apps/api      NestJS 11 + REST API + Gemini
└─ packages/shared  type ของ request/response ที่ทั้งสองฝั่งใช้ร่วมกัน
```

`packages/shared` เป็นแหล่งความจริงเดียวของสัญญา API — แก้ที่นี่แล้วทั้งสองฝั่งเห็นตรงกัน

## เริ่มใช้งาน

ต้องมี Node.js 20.9 ขึ้นไป

```bash
npm install
```

ตั้งค่า environment (ทำครั้งเดียว)

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

จากนั้นใส่ `GEMINI_API_KEY` ใน `apps/api/.env` — ขอ key ได้ที่ https://aistudio.google.com/apikey
(ถ้ายังไม่ใส่ ระบบยังเปิดใช้งานได้ตามปกติ แต่ปุ่ม "ให้ AI ช่วยปรับ" จะแจ้งว่ายังไม่ได้ตั้งค่า API Key)

รันทั้งระบบ

```bash
npm run dev
```

- หน้าเว็บ: http://localhost:3000
- API: http://localhost:3001/api
- ตรวจสถานะ: http://localhost:3001/api/health

รันแยกฝั่งได้ด้วย `npm run dev:web` หรือ `npm run dev:api`

## คำสั่งอื่น

| คำสั่ง | ความหมาย |
| --- | --- |
| `npm run build` | build ทั้ง shared, api และ web |
| `npm test` | รัน unit test ของ api |
| `npm run lint` | ตรวจ lint ทั้งสองแอป |

## API

### `POST /api/rewrite`

```json
{ "text": "พรุ่งนี้ผมส่งไฟล์ให้นะครับ" }
```

ระบบใช้ระดับภาษาเดียวคือ **ทางการแบบอีเมลทำงาน** ไม่ใช่หนังสือราชการ
จึงไม่มีพารามิเตอร์ให้เลือกระดับ

ตอบกลับ

```json
{
  "original": "พรุ่งนี้ผมส่งไฟล์ให้นะครับ",
  "result": "ผมจะจัดส่งไฟล์ให้ในวันพรุ่งนี้ครับ",
  "source": "ai",
  "model": "gemini-flash-latest",
  "notes": [{ "before": "ผม", "after": "ข้าพเจ้า", "reason": "ภาษาพูด" }],
  "durationMs": 1820
}
```

เมื่อเกิดข้อผิดพลาด จะตอบกลับรูปแบบเดียวกันเสมอ พร้อม `code` ที่ Frontend ใช้ตัดสินใจได้

```json
{ "statusCode": 503, "code": "PROVIDER_UNCONFIGURED", "message": "ยังไม่ได้ตั้งค่า API Key ของ AI ..." }
```

### `GET /api/health`

บอกว่า API ขึ้นแล้วหรือยัง ตั้งค่า AI provider ครบหรือไม่ และ CORS อนุญาต origin ไหนบ้าง

```json
{
  "status": "ok",
  "provider": "gemini",
  "configured": true,
  "webOrigins": ["https://adit-web-delta.vercel.app"],
  "timestamp": "2026-08-11T10:59:31.445Z"
}
```

เวลาหน้าเว็บฟ้อง "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" ให้เทียบ `webOrigins` กับโดเมนจริงของหน้าเว็บก่อน
ถ้าไม่ตรงกันแปลว่าเป็นปัญหา CORS ไม่ใช่ปัญหาเครือข่าย

## ชั้นกฎพื้นฐาน (ทำงานก่อน AI เสมอ)

`packages/shared/src/rules/` เป็นชั้นแก้ข้อความด้วยกฎล้วน ๆ ไม่เรียก AI ไม่มีโควตา

อยู่ใน `shared` เพราะเป็นฟังก์ชันบริสุทธิ์ไม่มี dependency จึงรันได้ทั้งสองฝั่ง
และถูกใช้สามที่

1. **หน้าเว็บเรียกตรง ๆ ขณะผู้ใช้พิมพ์** ได้ผลในหลักมิลลิวินาที ไม่ยิงเน็ตเลยสักครั้ง
2. **กรองข้อความก่อนส่งให้ AI** AI จะได้ไม่ต้องเสียแรงกับคำผิดที่กฎจัดการได้แล้ว
3. **ตาข่ายรับฝั่ง API** เมื่อ AI ใช้ไม่ได้

โฟลว์บนหน้าเว็บจึงเป็นสองจังหวะ — กฎจัดการงานระดับคำให้ทันทีและฟรี
ส่วน AI ไว้เรียบเรียงประโยคใหม่ซึ่งกฎทำแทนไม่ได้ ผู้ใช้กดเมื่อต้องการเท่านั้น
ตรงกับที่สเปกเขียนไว้ว่า AI เป็นฟีเจอร์เสริม ไม่ใช่ขั้นตอนบังคับ

กฎจะไม่เขียนทับช่อง After ที่ผู้ใช้พิมพ์แก้เอง จะทำงานอัตโนมัติเฉพาะตอนที่ผลลัพธ์ยังไม่ถูกแตะ

### เมื่อ AI ใช้ไม่ได้

API จะแก้ด้วยกฎแล้วตอบ `source: "rules"` หน้าเว็บแยกสองกรณีนี้ออกจากกัน
ถ้าผู้ใช้กดขอ AI แล้วได้กฎกลับมา จะขึ้นคำเตือนว่า AI ใช้ไม่ได้
ต่างจากกฎที่ทำงานตามปกติซึ่งเป็นเรื่องปกติของโฟลว์ ไม่ใช่ความผิดพลาด

ถ้ากฎแก้อะไรไม่ได้เลย จะส่ง error เดิมกลับไปแทน เพราะการคืนข้อความเดิมโดยบอกว่า
"ปรับให้แล้ว" ทำให้ผู้ใช้เข้าใจผิดยิ่งกว่าเห็น error ตรง ๆ

ข้อความที่ถูกระบบความปลอดภัยของ AI ปฏิเสธ (`BLOCKED_CONTENT`) จะไม่ถอยมาใช้กฎ
เพราะเป็นปัญหาที่ตัวข้อความ ผู้ใช้ควรรู้

### เพิ่มกฎใหม่

แก้ `packages/shared/src/rules/thai-rules.ts` ไฟล์เดียว แต่ละกฎมี `pattern`, `replacement`, `reason`
(เทสต์อยู่ที่ `apps/api/src/rewrite/rules.spec.ts` เพื่อใช้ jest ชุดเดียวกับที่มีอยู่แล้ว)

ข้อควรระวังที่สำคัญที่สุดคือ**ภาษาไทยไม่มีช่องว่างคั่นคำ** การแทนที่ตรง ๆ จะทำคำอื่นพัง
เช่น "ปะ" อยู่ใน "ประชุม" และ "เค้า" อยู่ใน "เค้าโครง"
ทุกกฎจึงต้องผูกกับท้ายข้อความหรือใช้ lookahead/lookbehind กันไว้
และ**ลำดับของกฎมีผล** เพราะกฎที่ดูบริบทข้างเคียงต้องรันหลังกฎที่แปลงคำนั้นแล้ว

ในเทสต์มีชุด "ต้องไม่ทำคำอื่นพัง" ไว้ดักเรื่องนี้โดยเฉพาะ เพิ่มกฎใหม่แล้วควรเพิ่มเคสด้วย

## ตัวอย่างสำนวนอ้างอิง

`apps/api/src/rewrite/ai/style-reference.ts` เก็บตัวอย่างสำนวนจริงไว้ให้โมเดลดูว่า
ระดับภาษาที่ต้องการหน้าตาเป็นอย่างไร — สุภาพ กระชับ ไม่ใช่หนังสือราชการ

ตัวอย่างเก็บเฉพาะโครงประโยคสั้น ๆ ที่สื่อระดับภาษา **ตัดเนื้อหาปฏิบัติการทิ้งทั้งหมด**
(ลิงก์ อีเมล ชื่อระบบ เลขขั้นตอน) เพราะถ้าใส่ไว้ โมเดลมีโอกาสหยิบไปใส่ในข้อความของผู้ใช้
ที่ไม่เกี่ยวข้องกันเลย มีเทสต์คุมไว้ว่าตัวอย่างต้องไม่มีอีเมลหรือลิงก์ติดมา

เพิ่มตัวอย่างได้ที่ `FORMAL_STYLE_SAMPLES` ในไฟล์เดียวกัน

## โควตาและการสลับโมเดล

โควตา free tier ของ Gemini **แยกตามโมเดล** และน้อยกว่าที่คิดมาก
ตอนพัฒนาเจอว่า `gemini-flash-latest` (ปัจจุบันชี้ไป `gemini-3.6-flash`) ให้เพียง **20 ครั้งต่อวัน**

ระบบจึงไล่ใช้โมเดลตามลำดับ `GEMINI_MODEL` แล้วต่อด้วย `GEMINI_FALLBACK_MODELS`
เมื่อตัวไหนตอบ 429 หรือใช้ไม่ได้ จะสลับไปตัวถัดไปให้อัตโนมัติ ผู้ใช้ไม่เห็น error
โควตารวมต่อวันจึงเป็นผลรวมของทุกโมเดลในลำดับ

จะสลับเฉพาะกรณีที่เป็นปัญหาของตัวโมเดล (`RATE_LIMITED`, `MODEL_UNAVAILABLE`)
ถ้าเป็นปัญหาของข้อความเอง เช่นถูกระบบความปลอดภัยปฏิเสธ จะไม่ไล่ลองโมเดลอื่นให้เสียโควตาฟรี

ถ้าต้องการปริมาณมากกว่านี้ ต้องเปิด billing ที่ Google AI Studio
ดูลำดับที่ใช้อยู่จริงได้จากฟิลด์ `models` ใน `GET /api/health`

## เปลี่ยน AI Provider

ทุกอย่างที่ผูกกับ Gemini อยู่ใน `apps/api/src/rewrite/ai/` เท่านั้น

1. เขียน class ใหม่ที่ `implements AiProvider` (ดู `gemini.provider.ts` เป็นตัวอย่าง)
2. แก้ `useClass` ใน `apps/api/src/rewrite/rewrite.module.ts` บรรทัดเดียว

Controller, สัญญา API และ Frontend ไม่ต้องแก้เลย

## Deploy บน Vercel

ใช้ 2 project จาก repo เดียวกัน

### Project ที่ 1 — เว็บ

| ตั้งค่า | ค่า |
| --- | --- |
| Root Directory | `apps/web` |
| Framework Preset | Next.js (ตรวจเจอเอง) |
| Build / Output | ปล่อย default |

Environment Variables

| Key | ค่า |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL ของ project ที่ 2 ต่อท้ายด้วย `/api` |

ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` ถูกฝังตอน build ถ้าแก้ค่าต้อง redeploy ใหม่

### Project ที่ 2 — API

| ตั้งค่า | ค่า |
| --- | --- |
| Root Directory | `apps/api` |
| Framework Preset | Other |
| Build Command | `npm run build` |
| Output Directory | ปล่อยว่าง |

Environment Variables

| Key | ค่า |
| --- | --- |
| `GEMINI_API_KEY` | key จาก Google AI Studio |
| `GEMINI_MODEL` | `gemini-flash-latest` |
| `GEMINI_FALLBACK_MODELS` | `gemini-3.1-flash-lite,gemini-2.5-flash-lite` |
| `WEB_ORIGIN` | URL ของ project ที่ 1 (ใช้ตรวจ CORS) |
| `AI_TIMEOUT_MS` | `25000` |

`WEB_ORIGIN` ใส่ได้หลายค่าโดยคั่นด้วย `,` และรองรับ wildcard หนึ่งชั้นโดเมน
เช่น `https://adit-web-delta.vercel.app,https://*.vercel.app`
เพื่อให้ preview deployment ที่ URL เปลี่ยนทุกครั้งเรียก API ได้โดยไม่ต้องแก้ env ใหม่ทุกรอบ

ไม่ต้องใส่ `API_PORT` เพราะ serverless ไม่ได้ listen พอร์ต

การเพิ่มหรือแก้ env var บน Vercel มีผลกับ deployment ใหม่เท่านั้น ต้องสั่ง Redeploy ทุกครั้ง

### ทำงานยังไง

`nest build` คอมไพล์ลง `dist/` ตามปกติ แล้ว [`apps/api/api/[[...path]].js`](apps/api/api/[[...path]].js)
ทำหน้าที่เป็นจุดเข้าของ Vercel โดยเรียก Express instance ของ Nest ที่ `dist/serverless.js` มาใช้ตรง ๆ

การตั้งค่า Nest ทั้งหมด (prefix, CORS, validation, exception filter) อยู่ใน `src/app.setup.ts`
ซึ่งใช้ร่วมกันทั้งตอนรันเป็นเซิร์ฟเวอร์ปกติและตอนรันบน Vercel จึงไม่มีทางหลุดจากกัน

## ข้อจำกัดของเวอร์ชันนี้

ยังไม่มี authentication, database, ประวัติการใช้งาน, การอัปโหลดไฟล์ และ dashboard ตามที่ระบุไว้ใน Out of Scope
