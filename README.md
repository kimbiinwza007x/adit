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
{ "text": "พรุ่งนี้ผมส่งไฟล์ให้นะครับ", "tone": "formal" }
```

`tone` เลือกได้ระหว่าง `polite` (สุภาพ), `formal` (ทางการ, ค่าเริ่มต้น), `official` (ราชการ)

ตอบกลับ

```json
{
  "original": "พรุ่งนี้ผมส่งไฟล์ให้นะครับ",
  "result": "ข้าพเจ้าจะจัดส่งไฟล์ให้ในวันพรุ่งนี้",
  "tone": "formal",
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

บอกว่า API ขึ้นแล้วหรือยัง และตั้งค่า AI provider ครบหรือไม่

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
| `WEB_ORIGIN` | URL ของ project ที่ 1 (ใช้ตรวจ CORS) |
| `AI_TIMEOUT_MS` | `25000` |

ไม่ต้องใส่ `API_PORT` เพราะ serverless ไม่ได้ listen พอร์ต

### ทำงานยังไง

`nest build` คอมไพล์ลง `dist/` ตามปกติ แล้ว [`apps/api/api/[[...path]].js`](apps/api/api/[[...path]].js)
ทำหน้าที่เป็นจุดเข้าของ Vercel โดยเรียก Express instance ของ Nest ที่ `dist/serverless.js` มาใช้ตรง ๆ

การตั้งค่า Nest ทั้งหมด (prefix, CORS, validation, exception filter) อยู่ใน `src/app.setup.ts`
ซึ่งใช้ร่วมกันทั้งตอนรันเป็นเซิร์ฟเวอร์ปกติและตอนรันบน Vercel จึงไม่มีทางหลุดจากกัน

## ข้อจำกัดของเวอร์ชันนี้

ยังไม่มี authentication, database, ประวัติการใช้งาน, การอัปโหลดไฟล์ และ dashboard ตามที่ระบุไว้ใน Out of Scope
