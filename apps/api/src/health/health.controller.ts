import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { parseOrigins } from '../app.setup';
import { RewriteService } from '../rewrite/rewrite.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly rewriteService: RewriteService) {}

  /**
   * GET /api/health — ตรวจว่า API ขึ้นแล้ว ตั้งค่า AI ครบหรือยัง
   * และ CORS อนุญาต origin ไหนบ้าง (ไว้ไล่ปัญหาเวลา deploy แล้วเว็บเรียกไม่ได้)
   */
  @Get()
  check() {
    return {
      status: 'ok',
      ...this.rewriteService.status(),
      webOrigins: parseOrigins(process.env.WEB_ORIGIN),
      timestamp: new Date().toISOString(),
    };
  }
}
