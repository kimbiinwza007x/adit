import { Inject, Injectable, Logger } from '@nestjs/common';
import { DEFAULT_TONE } from '@adit/shared';
import type { AditErrorCode, RewriteResponse } from '@adit/shared';
import { AditException } from '../common/adit.exception';
import { AI_PROVIDER } from './ai/ai-provider.interface';
import type { AiProvider } from './ai/ai-provider.interface';
import { RewriteRequestDto } from './dto/rewrite-request.dto';
import { applyRules } from './rules/rule-engine';

/** ชื่อที่ใช้แทน "โมเดล" เมื่อผลลัพธ์มาจากกฎ */
const RULE_ENGINE_NAME = 'rule-engine';

/**
 * ความผิดพลาดที่ถือว่าเป็นปัญหาฝั่งผู้ให้บริการ ไม่ใช่ปัญหาของข้อความ
 * กรณีแบบนี้ยังพอถอยไปใช้กฎแทนได้
 *
 * BLOCKED_CONTENT ไม่อยู่ในรายการนี้โดยตั้งใจ เพราะเป็นปัญหาที่ตัวข้อความ
 * ผู้ใช้ควรรู้ว่าถูกปฏิเสธ ไม่ใช่ได้ผลลัพธ์ครึ่ง ๆ กลาง ๆ ไปโดยไม่รู้ตัว
 */
const FALLBACK_CODES = new Set<AditErrorCode>([
  'PROVIDER_ERROR',
  'PROVIDER_TIMEOUT',
  'PROVIDER_UNCONFIGURED',
  'MODEL_UNAVAILABLE',
  'RATE_LIMITED',
]);

@Injectable()
export class RewriteService {
  private readonly logger = new Logger(RewriteService.name);

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async rewrite(dto: RewriteRequestDto): Promise<RewriteResponse> {
    const text = dto.text;
    const tone = dto.tone ?? DEFAULT_TONE;
    const startedAt = Date.now();

    try {
      const output = await this.provider.rewrite({ text, tone });
      const durationMs = Date.now() - startedAt;

      this.logger.log(
        `rewrite สำเร็จ provider=${this.provider.name} model=${output.model} tone=${tone} chars=${text.length} ms=${durationMs}`,
      );

      return {
        original: text,
        result: output.result,
        tone,
        source: 'ai',
        model: output.model,
        notes: output.notes,
        durationMs,
      };
    } catch (error) {
      return this.fallbackToRules(error, text, tone, startedAt);
    }
  }

  /** ใช้โดย health check เพื่อบอกว่าตั้งค่า AI ครบหรือยัง */
  status(): { provider: string; configured: boolean; models?: string[] } {
    return {
      provider: this.provider.name,
      configured: this.provider.isConfigured(),
      models: this.provider.modelChain?.(),
    };
  }

  /**
   * AI ใช้ไม่ได้ ลองแก้ด้วยกฎแทน
   *
   * ถ้ากฎแก้อะไรไม่ได้เลย จะโยน error เดิมกลับไป เพราะการคืนข้อความเดิม
   * โดยบอกว่า "ปรับให้แล้ว" จะทำให้ผู้ใช้เข้าใจผิดยิ่งกว่าเห็น error
   */
  private fallbackToRules(
    error: unknown,
    text: string,
    tone: RewriteResponse['tone'],
    startedAt: number,
  ): RewriteResponse {
    const failure =
      error instanceof AditException
        ? error
        : new AditException('INTERNAL_ERROR', 500);

    if (!FALLBACK_CODES.has(failure.code)) throw failure;

    const ruled = applyRules(text);
    if (!ruled.changed) {
      this.logger.warn(
        `AI ล้มเหลว (${failure.code}) และกฎพื้นฐานแก้อะไรไม่ได้ จึงส่ง error กลับ`,
      );
      throw failure;
    }

    const durationMs = Date.now() - startedAt;
    this.logger.warn(
      `AI ล้มเหลว (${failure.code}) — ใช้ผลจากกฎพื้นฐานแทน chars=${text.length} ms=${durationMs}`,
    );

    return {
      original: text,
      result: ruled.result,
      tone,
      source: 'rules',
      model: RULE_ENGINE_NAME,
      notes: ruled.notes,
      durationMs,
    };
  }
}
