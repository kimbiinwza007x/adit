import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ValidationError } from 'class-validator';
import { AditErrorCode, ERROR_MESSAGES } from '@adit/shared';
import { AppModule } from './app.module';
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

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

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);

  Logger.log(
    `Adit API พร้อมใช้งานที่ http://localhost:${port}/api`,
    'Bootstrap',
  );
}

void bootstrap();
