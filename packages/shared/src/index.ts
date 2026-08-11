/**
 * สัญญา (contract) ระหว่าง Frontend กับ Backend ของ Adit
 *
 * ไฟล์นี้เป็นแหล่งความจริงเดียวของรูปแบบ request/response
 * การเปลี่ยน AI Provider ต้องไม่ทำให้ type ในไฟล์นี้เปลี่ยน
 */

/** ระดับความเป็นทางการที่ผู้ใช้เลือกได้ */
export const REWRITE_TONES = ['polite', 'formal', 'official'] as const;

export type RewriteTone = (typeof REWRITE_TONES)[number];

export const DEFAULT_TONE: RewriteTone = 'formal';

/** ป้ายกำกับภาษาไทยของแต่ละ tone (ใช้แสดงบน UI) */
export const TONE_LABELS: Record<RewriteTone, { label: string; hint: string }> = {
  polite: {
    label: 'สุภาพ',
    hint: 'ยังคงความเป็นกันเอง แต่เรียบร้อยขึ้น เหมาะกับแชทงานหรืออีเมลภายใน',
  },
  formal: {
    label: 'ทางการ',
    hint: 'ภาษาเขียนที่เป็นทางการ เหมาะกับอีเมลลูกค้าหรือเอกสารทั่วไป',
  },
  official: {
    label: 'ราชการ',
    hint: 'สำนวนหนังสือราชการ เป็นทางการสูงสุด',
  },
};

/** ความยาวข้อความสูงสุดที่รับได้ต่อหนึ่ง request */
export const MAX_TEXT_LENGTH = 5000;

export interface RewriteRequest {
  /** ข้อความต้นฉบับ (Before) */
  text: string;
  /** ระดับความเป็นทางการ (ไม่ส่งมา = 'formal') */
  tone?: RewriteTone;
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

export interface RewriteResponse {
  /** ข้อความต้นฉบับที่ส่งเข้ามา (Before) */
  original: string;
  /** ข้อความที่ปรับแล้ว (After) */
  result: string;
  tone: RewriteTone;
  /** ชื่อโมเดลที่ใช้ เช่น "gemini-flash-latest" */
  model: string;
  /** สิ่งที่แก้ไข (อาจเป็น array ว่างถ้าโมเดลไม่ได้ระบุ) */
  notes: RewriteNote[];
  /** เวลาที่ใช้เรียก AI (มิลลิวินาที) */
  durationMs: number;
}

/** รหัสข้อผิดพลาดที่ Frontend ใช้ตัดสินใจว่าจะแสดงข้อความอะไร */
export type AditErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMPTY_TEXT'
  | 'TEXT_TOO_LONG'
  | 'RATE_LIMITED'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_UNCONFIGURED'
  | 'MODEL_UNAVAILABLE'
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
  EMPTY_TEXT: 'กรุณากรอกข้อความก่อนให้ AI ช่วยปรับ',
  TEXT_TOO_LONG: `ข้อความยาวเกิน ${MAX_TEXT_LENGTH.toLocaleString()} ตัวอักษร กรุณาแบ่งเป็นส่วนย่อย`,
  RATE_LIMITED: 'มีการเรียกใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่',
  PROVIDER_ERROR: 'ระบบ AI ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง',
  PROVIDER_TIMEOUT: 'ระบบ AI ใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง',
  PROVIDER_UNCONFIGURED: 'ยังไม่ได้ตั้งค่า API Key ของ AI กรุณาติดต่อผู้ดูแลระบบ',
  MODEL_UNAVAILABLE:
    'โมเดล AI ที่ตั้งค่าไว้ใช้งานไม่ได้ กรุณาแจ้งผู้ดูแลระบบให้ตรวจสอบค่า GEMINI_MODEL',
  BLOCKED_CONTENT: 'ข้อความนี้ถูกระบบความปลอดภัยของ AI ปฏิเสธ กรุณาแก้ไขข้อความแล้วลองใหม่',
  INTERNAL_ERROR: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง',
};

export function isAditErrorBody(value: unknown): value is AditErrorBody {
  if (typeof value !== 'object' || value === null) return false;
  const body = value as Record<string, unknown>;
  return typeof body.code === 'string' && typeof body.message === 'string';
}
