import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

/** ใช้ตอนรันเป็นเซิร์ฟเวอร์ปกติ (local dev หรือ container) */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  configureApp(app);

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);

  Logger.log(
    `Adit API พร้อมใช้งานที่ http://localhost:${port}/api`,
    'Bootstrap',
  );
}

void bootstrap();
