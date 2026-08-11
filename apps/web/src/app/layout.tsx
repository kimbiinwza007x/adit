import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

// ฟอนต์ที่รองรับภาษาไทยเต็มรูปแบบ ผูกกับ --font-sans ที่ shadcn ใช้อยู่
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adit — ปรับข้อความไทยให้เป็นทางการ",
  description:
    "วางข้อความภาษาไทย แล้วให้ Adit ช่วยปรับให้สุภาพและเป็นทางการมากขึ้น พร้อมแก้ไขเองได้",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-muted/30">{children}</body>
    </html>
  );
}
