# Adit Web

Next.js (App Router) + Tailwind v4 + shadcn/ui

- `src/app/page.tsx` — หน้าเดียวของระบบ
- `src/components/adit/` — ส่วนประกอบของหน้าจอ Before / After
  - `adit-workspace.tsx` — จัดการสถานะทั้งหมด (client component)
- `src/components/ui/` — shadcn/ui primitives เพิ่มได้ด้วย `npx shadcn@latest add <ชื่อ>`
- `src/lib/api.ts` — ตัวเรียก Adit API

ตั้งค่า `NEXT_PUBLIC_API_BASE_URL` ใน `.env.local` (ดู `.env.local.example`)
แล้วรันจาก root ของ repo ด้วย `npm run dev:web`
