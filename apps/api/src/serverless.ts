import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

/**
 * เวอร์ชัน serverless สำหรับ Vercel — ไม่ listen พอร์ต
 *
 * Nest ใช้ Express อยู่แล้ว และตัว Express app เองก็คือ handler แบบ (req, res)
 * จึงส่งต่อให้ Vercel ได้ตรง ๆ โดยไม่ต้องพึ่ง library ห่ออีกชั้น
 */
let cached: express.Express | undefined;
let pending: Promise<express.Express> | undefined;

async function create(): Promise<express.Express> {
  const server = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    // บน Vercel log ผ่าน stdout อยู่แล้ว ไม่ต้อง buffer
    bufferLogs: false,
  });

  configureApp(app);
  await app.init();

  cached = server;
  return server;
}

/**
 * สร้าง Nest ครั้งเดียวต่อหนึ่ง instance แล้วใช้ซ้ำ
 * (Vercel ใช้ instance เดิมซ้ำระหว่าง request ที่มาติด ๆ กัน จึงไม่ควรสร้างใหม่ทุกครั้ง)
 */
export function getServer(): Promise<express.Express> {
  if (cached) return Promise.resolve(cached);
  // กันกรณีหลาย request เข้ามาพร้อมกันตอน cold start แล้วสร้าง Nest ซ้อนกัน
  pending ??= create();
  return pending;
}
