"use client";

import { REWRITE_TONES, TONE_LABELS, type RewriteTone } from "@adit/shared";
import { cn } from "@/lib/utils";

interface ToneSelectorProps {
  value: RewriteTone;
  onChange: (tone: RewriteTone) => void;
  disabled?: boolean;
}

/** ตัวเลือกระดับความเป็นทางการ แบบปุ่มเรียงต่อกัน */
export function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label="ระดับความเป็นทางการ"
        className="inline-flex w-full max-w-md rounded-lg border border-border bg-background p-1 sm:w-auto"
      >
        {REWRITE_TONES.map((tone) => {
          const selected = tone === value;
          return (
            <button
              key={tone}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(tone)}
              className={cn(
                "flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {TONE_LABELS[tone].label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{TONE_LABELS[value].hint}</p>
    </div>
  );
}
