"use client";

import { ArrowRight } from "lucide-react";
import type { RewriteNote } from "@adit/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChangeNotesProps {
  notes: RewriteNote[];
}

/** สรุปว่า AI แก้อะไรไปบ้าง เพื่อให้ผู้ใช้ตรวจทานได้เร็วขึ้น */
export function ChangeNotes({ notes }: ChangeNotesProps) {
  if (notes.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>สิ่งที่ปรับแก้</CardTitle>
        <CardDescription>
          รายการหลักที่เปลี่ยนไป ({notes.length} รายการ)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y divide-border">
          {notes.map((note, index) => (
            <li
              key={`${note.before}-${index}`}
              className="flex flex-wrap items-center gap-2 py-2 text-sm first:pt-0 last:pb-0"
            >
              <span className="text-muted-foreground line-through">
                {note.before}
              </span>
              <ArrowRight
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="font-medium">{note.after}</span>
              <Badge variant="secondary" className="ml-auto">
                {note.reason}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
