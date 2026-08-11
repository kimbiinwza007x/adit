"use client";

import { Eraser } from "lucide-react";
import { MAX_TEXT_LENGTH } from "@adit/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SourcePanelProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

/** ฝั่ง Before — ข้อความต้นฉบับที่ผู้ใช้พิมพ์หรือวางเข้ามา */
export function SourcePanel({
  value,
  onChange,
  onClear,
  disabled,
}: SourcePanelProps) {
  const overLimit = value.length > MAX_TEXT_LENGTH;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>ข้อความต้นฉบับ</CardTitle>
        <CardDescription>พิมพ์หรือวางข้อความภาษาไทยที่ต้องการปรับ</CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={disabled || value.length === 0}
          >
            <Eraser aria-hidden />
            ล้าง
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          spellCheck={false}
          placeholder="เช่น พรุ่งนี้ผมส่งไฟล์ให้นะครับ ตอนนี้ยังทำไม่เสร็จเลย ขอโทษด้วยจริงๆ"
          className="min-h-56 flex-1 resize-y leading-relaxed"
          aria-label="ข้อความต้นฉบับ"
        />
        <p
          className={cn(
            "self-end text-xs tabular-nums",
            overLimit ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {value.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
