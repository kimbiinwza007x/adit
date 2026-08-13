"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, Loader2, Sparkles } from "lucide-react";
import {
  applyRules,
  ERROR_MESSAGES,
  MAX_TEXT_LENGTH,
  type RewriteNote,
  type RewriteSource,
} from "@adit/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AditApiError, requestRewrite } from "@/lib/api";
import { ChangeNotes } from "./change-notes";
import { ResultPanel } from "./result-panel";
import { SourcePanel } from "./source-panel";

/** หน่วงก่อนให้กฎทำงาน จะได้ไม่คำนวณใหม่ทุกตัวอักษรที่พิมพ์ */
const RULE_DELAY_MS = 350;

interface ResultMeta {
  source: RewriteSource;
  /** ผู้ใช้ขอ AI แล้วแต่ระบบถอยมาใช้กฎแทน ต่างจากกฎที่ทำงานตามปกติ */
  fallback: boolean;
  model: string;
  durationMs: number;
}

/**
 * ตัวจัดการสถานะทั้งหมดของหน้าจอ Before / After
 *
 * ชั้นกฎทำงานเองทันทีที่ผู้ใช้หยุดพิมพ์ ไม่ยิงเน็ตและไม่กินโควตา
 * AI เป็นขั้นที่สอง ไว้เรียบเรียงประโยคใหม่ซึ่งกฎทำแทนไม่ได้
 * และผู้ใช้จะพิมพ์แก้ช่อง After เองทั้งหมดโดยไม่แตะ AI เลยก็ได้
 */
export function AditWorkspace() {
  const [source, setSource] = useState("");
  const [result, setResult] = useState("");
  /** ข้อความล่าสุดที่ระบบเป็นคนใส่ให้ ใช้เทียบว่าผู้ใช้แก้เองไปแล้วหรือยัง */
  const [generated, setGenerated] = useState<string | null>(null);
  const [notes, setNotes] = useState<RewriteNote[]>([]);
  const [meta, setMeta] = useState<ResultMeta | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // อ่านค่าล่าสุดจาก effect ของกฎโดยไม่ต้องใส่ใน dependency
  // ถ้าใส่ตรง ๆ effect จะวนไม่จบเพราะตัวมันเองเป็นคนแก้ค่าเหล่านี้
  const resultRef = useRef(result);
  const generatedRef = useRef(generated);

  useEffect(() => {
    resultRef.current = result;
    generatedRef.current = generated;
  });

  const hasResult = generated !== null;
  const edited = hasResult && result !== generated;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  /** ให้ระบบเข้าไปเขียนช่อง After ได้ก็ต่อเมื่อผู้ใช้ยังไม่ได้แก้เอง */
  const canOverwriteResult = () => resultRef.current === (generatedRef.current ?? "");

  // ชั้นกฎ — ทำงานในเบราว์เซอร์ ไม่ยิงเน็ต
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canOverwriteResult()) return;

      if (source.trim().length === 0) {
        setResult("");
        setGenerated(null);
        setNotes([]);
        setMeta(null);
        return;
      }

      const startedAt = performance.now();
      const outcome = applyRules(source);

      setResult(outcome.result);
      setGenerated(outcome.result);
      setNotes(outcome.notes);
      setMeta({
        source: "rules",
        fallback: false,
        model: "rule-engine",
        durationMs: performance.now() - startedAt,
      });
    }, RULE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [source]);

  const handleRewrite = useCallback(async () => {
    // ส่งข้อความที่กฎแก้แล้วให้ AI จะได้ไม่เสียแรงกับคำผิดที่จัดการไปแล้ว
    const text = applyRules(source).result;

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
      const response = await requestRewrite({ text }, controller.signal);
      setResult(response.result);
      setGenerated(response.result);
      setNotes(response.notes);
      setMeta({
        source: response.source,
        // ขอ AI ไปแล้วได้ผลจากกฎกลับมา แปลว่า AI ใช้ไม่ได้จริง ๆ
        fallback: response.source === "rules",
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
  }, [source]);

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
    setResult("");
    setGenerated(null);
    setNotes([]);
    setMeta(null);
    setError(null);
  }, []);

  const handleRestore = useCallback(() => {
    // ผลจากกฎคำนวณใหม่ได้ทันที จึงคืนค่าตามข้อความต้นฉบับ ณ ปัจจุบัน
    // ไม่ใช่ผลเก่าที่ค้างไว้ตั้งแต่ก่อนผู้ใช้แก้ช่อง Before
    if (meta?.source === "rules" && !meta.fallback) {
      const outcome = applyRules(source);
      setResult(outcome.result);
      setGenerated(outcome.result);
      setNotes(outcome.notes);
      return;
    }

    // ผลจาก AI เรียกใหม่เองไม่ได้ ต้องคืนของเดิมที่เก็บไว้
    if (generated !== null) setResult(generated);
  }, [generated, meta, source]);

  const handleUseAsSource = useCallback(() => {
    setSource(result);
    setResult("");
    setGenerated(null);
    setNotes([]);
    setMeta(null);
    setError(null);
  }, [result]);

  // Ctrl/Cmd + Enter = สั่งให้ AI เรียบเรียงต่อ
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          คำผิดและภาษาพูดถูกแก้ให้อัตโนมัติขณะพิมพ์
          กดปุ่มด้านขวาเมื่อต้องการให้ AI เรียบเรียงประโยคใหม่
        </p>

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
          fallback={meta?.fallback}
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
