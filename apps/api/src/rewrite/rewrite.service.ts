import { Inject, Injectable, Logger } from '@nestjs/common';
import { DEFAULT_TONE } from '@adit/shared';
import type { RewriteResponse } from '@adit/shared';
import { AI_PROVIDER } from './ai/ai-provider.interface';
import type { AiProvider } from './ai/ai-provider.interface';
import { RewriteRequestDto } from './dto/rewrite-request.dto';

@Injectable()
export class RewriteService {
  private readonly logger = new Logger(RewriteService.name);

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async rewrite(dto: RewriteRequestDto): Promise<RewriteResponse> {
    const text = dto.text;
    const tone = dto.tone ?? DEFAULT_TONE;
    const startedAt = Date.now();

    const output = await this.provider.rewrite({ text, tone });
    const durationMs = Date.now() - startedAt;

    this.logger.log(
      `rewrite สำเร็จ provider=${this.provider.name} tone=${tone} chars=${text.length} ms=${durationMs}`,
    );

    return {
      original: text,
      result: output.result,
      tone,
      model: output.model,
      notes: output.notes,
      durationMs,
    };
  }

  /** ใช้โดย health check เพื่อบอกว่าตั้งค่า AI ครบหรือยัง */
  status(): { provider: string; configured: boolean; models?: string[] } {
    return {
      provider: this.provider.name,
      configured: this.provider.isConfigured(),
      models: this.provider.modelChain?.(),
    };
  }
}
