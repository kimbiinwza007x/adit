import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai/ai-provider.interface';
import { GeminiProvider } from './ai/gemini.provider';
import { RewriteController } from './rewrite.controller';
import { RewriteService } from './rewrite.service';

/**
 * จุดเดียวที่ผูกกับ AI Provider จริง
 * เปลี่ยนเจ้าอื่นได้โดยแก้ useClass บรรทัดเดียว
 */
@Module({
  controllers: [RewriteController],
  providers: [
    RewriteService,
    { provide: AI_PROVIDER, useClass: GeminiProvider },
  ],
  exports: [RewriteService],
})
export class RewriteModule {}
