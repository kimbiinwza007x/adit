import { HttpException, HttpStatus } from '@nestjs/common';
import { AditErrorCode, ERROR_MESSAGES } from '@adit/shared';

/**
 * ข้อผิดพลาดของ Adit ที่มี "รหัส" ติดไปด้วยเสมอ
 * Frontend ใช้รหัสนี้ตัดสินใจว่าจะแสดงผลอย่างไร โดยไม่ต้องอ่าน message
 */
export class AditException extends HttpException {
  constructor(
    readonly code: AditErrorCode,
    status: HttpStatus,
    message?: string,
  ) {
    super(
      {
        statusCode: status,
        code,
        message: message ?? ERROR_MESSAGES[code],
      },
      status,
    );
  }
}
