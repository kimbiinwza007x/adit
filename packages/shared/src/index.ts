/**
 * สัญญา (contract) ระหว่าง Frontend กับ Backend ของ Adit
 *
 * ไฟล์นี้เป็นแหล่งความจริงเดียวของรูปแบบ request/response
 * การเปลี่ยน AI Provider ต้องไม่ทำให้ type ในไฟล์นี้เปลี่ยน
 */

// ชั้นกฎอยู่ที่นี่เพราะทั้งเบราว์เซอร์และเซิร์ฟเวอร์ต้องใช้ตัวเดียวกัน
export { applyRules } from './rules/rule-engine';
export type { RuleResult } from './rules/rule-engine';
export { THAI_RULES } from './rules/thai-rules';
export type { TextRule } from './rules/thai-rules';

/** ความยาวข้อความสูงสุดที่รับได้ต่อหนึ่ง request */
export const MAX_TEXT_LENGTH = 5000;

export interface RewriteRequest {
  /** ข้อความต้นฉบับ (Before) */
  text: string;
}

/** รายการสิ่งที่ AI แก้ไข ใช้อธิบายให้ผู้ใช้เห็นว่าเปลี่ยนอะไรไปบ้าง */
export interface RewriteNote {
  /** คำหรือวลีเดิม */
  before: string;
  /** คำหรือวลีที่แก้เป็น */
  after: string;
  /** เหตุผลสั้น ๆ เช่น "คำผิด", "ภาษาพูด" */
  reason: string;
}

/**
 * ผลลัพธ์มาจากไหน
 * - `ai` = โมเดลภาษาเป็นคนปรับให้
 * - `rules` = AI ใช้ไม่ได้ ระบบจึงแก้ให้เท่าที่กฎพื้นฐานทำได้ ผู้ใช้ควรตรวจทานเพิ่ม
 */
export type RewriteSource = 'ai' | 'rules';

export interface RewriteResponse {
  /** ข้อความต้นฉบับที่ส่งเข้ามา (Before) */
  original: string;
  /** ข้อความที่ปรับแล้ว (After) */
  result: string;
  source: RewriteSource;
  /** ชื่อโมเดลที่ใช้ เช่น "gemini-flash-latest" หรือ "rule-engine" เมื่อ source เป็น rules */
  model: string;
  /** สิ่งที่แก้ไข (อาจเป็น array ว่างถ้าโมเดลไม่ได้ระบุ) */
  notes: RewriteNote[];
  /** เวลาที่ใช้เรียก AI (มิลลิวินาที) */
  durationMs: number;
}

/** รหัสข้อผิดพลาดที่ Frontend ใช้ตัดสินใจว่าจะแสดงข้อความอะไร */
export type AditErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'EMPTY_TEXT'
  | 'TEXT_TOO_LONG'
  | 'RATE_LIMITED'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_UNCONFIGURED'
  | 'MODEL_UNAVAILABLE'
  | 'MODEL_OVERLOADED'
  | 'BLOCKED_CONTENT'
  | 'INTERNAL_ERROR';

export interface AditErrorBody {
  statusCode: number;
  code: AditErrorCode;
  /** ข้อความภาษาไทยที่แสดงให้ผู้ใช้เห็นได้ทันที */
  message: string;
}

/** ข้อความ error ภาษาไทยสำหรับแต่ละรหัส ใช้เป็น fallback ฝั่ง Frontend */
export const ERROR_MESSAGES: Record<AditErrorCode, string> = {
  VALIDATION_ERROR: 'ข้อมูลที่ส่งไปไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  NOT_FOUND: 'ไม่พบเส้นทางที่เรียก กรุณาตรวจสอบ URL และ HTTP method',
  EMPTY_TEXT: 'กรุณากรอกข้อความก่อนให้ AI ช่วยปรับ',
  TEXT_TOO_LONG: `ข้อความยาวเกิน ${MAX_TEXT_LENGTH.toLocaleString()} ตัวอักษร กรุณาแบ่งเป็นส่วนย่อย`,
  RATE_LIMITED: 'มีการเรียกใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่',
  PROVIDER_ERROR: 'ระบบ AI ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง',
  PROVIDER_TIMEOUT: 'ระบบ AI ใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง',
  PROVIDER_UNCONFIGURED: 'ยังไม่ได้ตั้งค่า API Key ของ AI กรุณาติดต่อผู้ดูแลระบบ',
  MODEL_UNAVAILABLE:
    'โมเดล AI ที่ตั้งค่าไว้ใช้งานไม่ได้ กรุณาแจ้งผู้ดูแลระบบให้ตรวจสอบค่า GEMINI_MODEL',
  MODEL_OVERLOADED:
    'ขณะนี้มีผู้ใช้งาน AI หนาแน่น กรุณาลองใหม่อีกครั้งในอีกสักครู่',
  BLOCKED_CONTENT: 'ข้อความนี้ถูกระบบความปลอดภัยของ AI ปฏิเสธ กรุณาแก้ไขข้อความแล้วลองใหม่',
  INTERNAL_ERROR: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง',
};

export function isAditErrorBody(value: unknown): value is AditErrorBody {
  if (typeof value !== 'object' || value === null) return false;
  const body = value as Record<string, unknown>;
  return typeof body.code === 'string' && typeof body.message === 'string';
}
