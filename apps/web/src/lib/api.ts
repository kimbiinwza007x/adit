import {
  ERROR_MESSAGES,
  isAditErrorBody,
  type AditErrorCode,
  type RewriteRequest,
  type RewriteResponse,
} from "@adit/shared";

/** ที่อยู่ของ Backend — ตั้งค่าผ่าน .env.local ได้ */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

/** ข้อผิดพลาดที่พร้อมแสดงผลบนหน้าจอ (message เป็นภาษาไทยเสมอ) */
export class AditApiError extends Error {
  constructor(
    readonly code: AditErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AditApiError";
  }
}

export async function requestRewrite(
  payload: RewriteRequest,
  signal?: AbortSignal,
): Promise<RewriteResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    // ยกเลิกเอง (ผู้ใช้กดยกเลิก / เปลี่ยนหน้า) ให้ส่งต่อไปให้ผู้เรียกจัดการ
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AditApiError(
      "PROVIDER_ERROR",
      "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่",
    );
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    if (isAditErrorBody(body)) {
      throw new AditApiError(body.code, body.message);
    }
    throw new AditApiError("INTERNAL_ERROR", ERROR_MESSAGES.INTERNAL_ERROR);
  }

  return (await response.json()) as RewriteResponse;
}
