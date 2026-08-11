import type { RewriteNote, RewriteTone } from '@adit/shared';

export interface AiRewriteInput {
  text: string;
  tone: RewriteTone;
}

export interface AiRewriteOutput {
  result: string;
  notes: RewriteNote[];
  /** ชื่อโมเดลที่ใช้จริง */
  model: string;
}

/**
 * สัญญาที่ AI Provider ทุกเจ้าต้องทำตาม
 *
 * การเปลี่ยนจาก Gemini ไปเป็นเจ้าอื่นคือการเขียน class ใหม่ที่ implement interface นี้
 * แล้วสลับ provider ใน RewriteModule เท่านั้น — Controller และ Frontend ไม่ต้องแก้
 */
export interface AiProvider {
  /** ชื่อ provider สำหรับ log เช่น "gemini" */
  readonly name: string;

  /** ตั้งค่า API key ครบหรือยัง ถ้าไม่ครบ service จะตอบ PROVIDER_UNCONFIGURED */
  isConfigured(): boolean;

  rewrite(input: AiRewriteInput): Promise<AiRewriteOutput>;
}

/** Injection token — ใช้ symbol เพื่อไม่ผูกกับ class ใด class หนึ่ง */
export const AI_PROVIDER = Symbol('AI_PROVIDER');
