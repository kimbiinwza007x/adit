import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ERROR_MESSAGES } from '@adit/shared';
import type { AditErrorCode } from '@adit/shared';
import { AditException } from './common/adit.exception';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

/** แปลงชื่อ constraint ของ class-validator เป็นรหัสข้อผิดพลาดของ Adit */
function toErrorCode(errors: ValidationError[]): AditErrorCode {
  const constraints = errors.flatMap((error) =>
    Object.keys(error.constraints ?? {}),
  );
  if (constraints.includes('isNotEmpty')) return 'EMPTY_TEXT';
  if (constraints.includes('maxLength')) return 'TEXT_TOO_LONG';
  return 'VALIDATION_ERROR';
}

/** แยกค่า WEB_ORIGIN ที่คั่นด้วย , ออกเป็นรายการ */
export function parseOrigins(value: string | undefined): string[] {
  return (value ?? 'http://localhost:3000')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * ตรวจว่า origin ที่เรียกเข้ามาได้รับอนุญาตหรือไม่
 *
 * รองรับ wildcard ที่ตัวแรกของโดเมน เช่น `https://*.vercel.app`
 * เพื่อให้ preview deployment ของ Vercel ที่เปลี่ยน URL ทุกครั้งใช้งานได้
 * โดยไม่ต้องมาแก้ env ใหม่ทุกรอบ
 */
export function isOriginAllowed(origin: string, allowed: string[]): boolean {
  return allowed.some((pattern) => {
    if (pattern === origin) return true;
    if (!pattern.includes('*')) return false;

    // แปลงเป็น regex โดย escape ทุกอย่างยกเว้น * ที่แทน "หนึ่งชั้นโดเมน"
    const source = pattern
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[^.]+');

    return new RegExp(`^${source}$`).test(origin);
  });
}

/**
 * ตั้งค่าทุกอย่างที่ไม่เกี่ยวกับการ listen พอร์ต
 *
 * ใช้ร่วมกันระหว่างการรันเป็นเซิร์ฟเวอร์ปกติ (main.ts)
 * กับการรันเป็น serverless function บน Vercel (serverless.ts)
 * เพื่อไม่ให้การตั้งค่าสองที่หลุดจากกัน
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');

  const allowed = parseOrigins(process.env.WEB_ORIGIN);

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // ไม่มี Origin = เรียกจากเซิร์ฟเวอร์หรือ curl ไม่ใช่เบราว์เซอร์ ปล่อยผ่าน
      if (!requestOrigin) return callback(null, true);
      callback(null, isOriginAllowed(requestOrigin, allowed));
    },
    methods: ['GET', 'POST'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const code = toErrorCode(errors);
        return new AditException(code, 400, ERROR_MESSAGES[code]);
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
}
