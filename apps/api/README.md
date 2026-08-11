# Adit API

NestJS REST API สำหรับปรับข้อความภาษาไทยให้เป็นทางการ

- `src/rewrite/` — endpoint หลักและการเชื่อมต่อ AI
  - `ai/prompt.ts` — คำสั่งภาษาไทยที่ส่งให้โมเดล (แก้ไฟล์นี้เมื่อต้องการปรับคุณภาพผลลัพธ์)
  - `ai/ai-provider.interface.ts` — สัญญาที่ AI provider ทุกเจ้าต้องทำตาม
  - `ai/gemini.provider.ts` — implementation ปัจจุบัน
- `src/common/` — รูปแบบ error กลางของทั้งระบบ
- `src/health/` — health check

ตั้งค่าผ่าน `.env` (ดู `.env.example`) แล้วรันจาก root ของ repo ด้วย `npm run dev:api`

ทดสอบ: `npm test -w api`
