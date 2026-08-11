"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, Loader2, Sparkles } from "lucide-react";
import {
  DEFAULT_TONE,
  ERROR_MESSAGES,
  MAX_TEXT_LENGTH,
  type RewriteNote,
  type RewriteSource,
  type RewriteTone,
} from "@adit/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AditApiError, requestRewrite } from "@/lib/api";
import { ChangeNotes } from "./change-notes";
import { ResultPanel } from "./result-panel";
import { SourcePanel } from "./source-panel";
import { ToneSelector } from "./tone-selector";

interface ResultMeta {
  source: RewriteSource;
  model: string;
  durationMs: number;
}

/**
 * ตัวจัดการสถานะทั้งหมดของหน้าจอ Before / After
 *
 * AI เป็นฟีเจอร์เสริม — ผู้ใช้พิมพ์แก้เองในช่อง After ได้ตลอดเวลา
 * โดยไม่ต้องเรียก AI เลยก็ได้
 */
export function AditWorkspace() {
  const [source, setSource] = useState("");
  const [tone, setTone] = useState<RewriteTone>(DEFAULT_TONE);

  const [result, setResult] = useState("");
  /** ผลลัพธ์ดิบจาก AI ครั้งล่าสุด ใช้เทียบว่าผู้ใช้แก้เองไปแล้วหรือยัง */
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [notes, setNotes] = useState<RewriteNote[]>([]);
  const [meta, setMeta] = useState<ResultMeta | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasResult = aiResult !== null;
  const edited = hasResult && result !== aiResult;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleRewrite = useCallback(async () => {
    const text = source.trim();

    if (text.length === 0) {
      setError(ERROR_MESSAGES.EMPTY_TEXT);
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      setError(ERROR_MESSAGES.TEXT_TOO_LONG);
      return;
    }

    // ยกเลิก request ก่อนหน้าที่ยังค้างอยู่ กันผลลัพธ์เก่ามาทับของใหม่
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await requestRewrite({ text, tone }, controller.signal);
      setResult(response.result);
      setAiResult(response.result);
      setNotes(response.notes);
      setMeta({
        source: response.source,
        model: response.model,
        durationMs: response.durationMs,
      });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(
        caught instanceof AditApiError
          ? caught.message
          : ERROR_MESSAGES.INTERNAL_ERROR,
      );
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }, [source, tone]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("คัดลอกไม่สำเร็จ กรุณาเลือกข้อความแล้วคัดลอกด้วยตนเอง");
    }
  }, [result]);

  const handleClearSource = useCallback(() => {
    setSource("");
    setError(null);
  }, []);

  const handleRestore = useCallback(() => {
    if (aiResult !== null) setResult(aiResult);
  }, [aiResult]);

  const handleUseAsSource = useCallback(() => {
    setSource(result);
    setResult("");
    setAiResult(null);
    setNotes([]);
    setMeta(null);
    setError(null);
  }, [result]);

  // Ctrl/Cmd + Enter = สั่งให้ AI ปรับข้อความ
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!loading) void handleRewrite();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRewrite, loading]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <ToneSelector value={tone} onChange={setTone} disabled={loading} />

        <Button
          size="lg"
          onClick={() => void handleRewrite()}
          disabled={loading || source.trim().length === 0}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Sparkles aria-hidden />
          )}
          {loading ? "กำลังปรับข้อความ..." : "ให้ AI ช่วยปรับ"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertTitle>ปรับข้อความไม่สำเร็จ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <SourcePanel
          value={source}
          onChange={setSource}
          onClear={handleClearSource}
          disabled={loading}
        />
        <ResultPanel
          value={result}
          onChange={setResult}
          loading={loading}
          hasResult={hasResult}
          edited={edited}
          source={meta?.source}
          model={meta?.model}
          durationMs={meta?.durationMs}
          copied={copied}
          onCopy={() => void handleCopy()}
          onRestore={handleRestore}
          onUseAsSource={handleUseAsSource}
        />
      </div>

      <ChangeNotes notes={notes} />
    </div>
  );
}
