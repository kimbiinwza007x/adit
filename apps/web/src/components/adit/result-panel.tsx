"use client";

import { ArrowLeft, Check, Copy, TriangleAlert, Undo2 } from "lucide-react";
import type { RewriteSource } from "@adit/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface ResultPanelProps {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  /** เคยเรียก AI สำเร็จอย่างน้อยหนึ่งครั้งหรือยัง */
  hasResult: boolean;
  /** ผู้ใช้แก้ผลลัพธ์ของ AI เองไปแล้ว */
  edited: boolean;
  /** ผลลัพธ์มาจาก AI หรือจากกฎพื้นฐาน */
  source?: RewriteSource;
  model?: string;
  durationMs?: number;
  copied: boolean;
  onCopy: () => void;
  onRestore: () => void;
  onUseAsSource: () => void;
}

/** ฝั่ง After — ผลลัพธ์จาก AI ที่ยังแก้ไขต่อเองได้ */
export function ResultPanel({
  value,
  onChange,
  loading,
  hasResult,
  edited,
  source,
  model,
  durationMs,
  copied,
  onCopy,
  onRestore,
  onUseAsSource,
}: ResultPanelProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ข้อความที่ปรับแล้ว
          {edited && (
            <Badge variant="outline" className="font-normal">
              แก้ไขเอง
            </Badge>
          )}
        </CardTitle>
        <CardDescription>ตรวจทานและแก้ไขเพิ่มเติมได้ก่อนนำไปใช้</CardDescription>
        <CardAction>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRestore}
              disabled={!edited || loading}
              title="ย้อนกลับไปเป็นข้อความที่ AI ปรับให้"
            >
              <Undo2 aria-hidden />
              ย้อนกลับ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              disabled={value.length === 0 || loading}
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </Button>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2">
        {source === "rules" && !loading && (
          <Alert>
            <TriangleAlert aria-hidden />
            <AlertTitle>ยังไม่ได้ใช้ AI กับข้อความนี้</AlertTitle>
            <AlertDescription>
              ตอนนี้ AI ใช้งานไม่ได้ ระบบจึงแก้ให้เท่าที่กฎพื้นฐานทำได้
              เช่นคำผิดที่พบบ่อยและคำลงท้ายภาษาพูด สำนวนและโครงสร้างประโยคยังไม่ถูกเรียบเรียงใหม่
              กรุณาตรวจทานและแก้เพิ่มเติมก่อนนำไปใช้
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div
            className="flex min-h-56 flex-1 flex-col gap-3 rounded-lg border border-border p-3"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">กำลังปรับข้อความ</span>
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : hasResult ? (
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            className="min-h-56 flex-1 resize-y leading-relaxed"
            aria-label="ข้อความที่ปรับแล้ว"
          />
        ) : (
          <div className="flex min-h-56 flex-1 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            ผลลัพธ์จะแสดงที่นี่หลังกด &quot;ให้ AI ช่วยปรับ&quot;
            <br />
            หรือจะพิมพ์แก้เองทั้งหมดก็ได้เช่นกัน
          </div>
        )}
      </CardContent>

      {hasResult && !loading && (
        <CardFooter className="flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {source === "rules" ? "กฎพื้นฐาน · " : model ? `${model} · ` : ""}
            {durationMs !== undefined ? `${(durationMs / 1000).toFixed(1)} วินาที` : ""}
          </span>
          <Button variant="ghost" size="sm" onClick={onUseAsSource}>
            <ArrowLeft aria-hidden />
            ใช้เป็นต้นฉบับเพื่อปรับต่อ
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
