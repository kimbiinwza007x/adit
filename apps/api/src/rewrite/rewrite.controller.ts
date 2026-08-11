import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RewriteResponse } from '@adit/shared';
import { RewriteRequestDto } from './dto/rewrite-request.dto';
import { RewriteService } from './rewrite.service';

@Controller('rewrite')
export class RewriteController {
  constructor(private readonly rewriteService: RewriteService) {}

  /** POST /api/rewrite — ปรับข้อความต้นฉบับให้เป็นภาษาทางการ */
  @Post()
  @HttpCode(HttpStatus.OK)
  rewrite(@Body() dto: RewriteRequestDto): Promise<RewriteResponse> {
    return this.rewriteService.rewrite(dto);
  }
}
