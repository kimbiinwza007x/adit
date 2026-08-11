import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { RewriteService } from '../rewrite/rewrite.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly rewriteService: RewriteService) {}

  /** GET /api/health — ใช้ตรวจว่า API ขึ้นแล้วและตั้งค่า AI ครบหรือยัง */
  @Get()
  check() {
    return {
      status: 'ok',
      ...this.rewriteService.status(),
      timestamp: new Date().toISOString(),
    };
  }
}
