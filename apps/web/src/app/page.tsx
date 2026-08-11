import { PenLine } from "lucide-react";
import { AditWorkspace } from "@/components/adit/adit-workspace";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PenLine className="size-5" aria-hidden />
          </span>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Adit
          </h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          ปรับข้อความภาษาไทยให้สุภาพและเป็นทางการมากขึ้น โดยยังคงความหมายเดิม
          จะแก้ไขเองทั้งหมด หรือให้ AI ช่วยปรับก่อนแล้วแก้ต่อก็ได้
        </p>
      </header>

      <Separator />

      <AditWorkspace />

      <footer className="mt-auto pt-6 text-xs text-muted-foreground">
        กด Ctrl + Enter เพื่อให้ AI ช่วยปรับข้อความ · ผลลัพธ์จาก AI
        ควรตรวจทานก่อนนำไปใช้งานจริงเสมอ
      </footer>
    </main>
  );
}
