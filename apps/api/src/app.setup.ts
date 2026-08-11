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

/**
 * ตั้งค่าทุกอย่างที่ไม่เกี่ยวกับการ listen พอร์ต
 *
 * ใช้ร่วมกันระหว่างการรันเป็นเซิร์ฟเวอร์ปกติ (main.ts)
 * กับการรันเป็น serverless function บน Vercel (serverless.ts)
 * เพื่อไม่ให้การตั้งค่าสองที่หลุดจากกัน
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000')
      .split(',')
      .map((value) => value.trim()),
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
