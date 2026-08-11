import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import type { GenerateContentResponse, Schema } from '@google/genai';
import type { RewriteNote } from '@adit/shared';
import { AditException } from '../../common/adit.exception';
import type {
  AiProvider,
  AiRewriteInput,
  AiRewriteOutput,
} from './ai-provider.interface';
import { buildSystemInstruction, buildUserPrompt } from './prompt';

/** จำนวนรายการแก้ไขสูงสุดที่ยอมให้ส่งกลับไปหน้าเว็บ */
const MAX_NOTES = 8;

/** โครงสร้าง JSON ที่บังคับให้โมเดลตอบกลับ */
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    result: {
      type: Type.STRING,
      description: 'ข้อความภาษาไทยที่ปรับเป็นทางการแล้ว',
    },
    notes: {
      type: Type.ARRAY,
      description: 'รายการสิ่งที่แก้ไข',
      items: {
        type: Type.OBJECT,
        properties: {
          before: { type: Type.STRING, description: 'คำหรือวลีเดิม' },
          after: { type: Type.STRING, description: 'คำหรือวลีที่แก้เป็น' },
          reason: { type: Type.STRING, description: 'เหตุผลสั้น ๆ' },
        },
        required: ['before', 'after', 'reason'],
      },
    },
  },
  required: ['result', 'notes'],
};

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';

  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly temperature: number;
  private client?: GoogleGenAI;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GEMINI_API_KEY', '').trim();
    this.model = config.get<string>('GEMINI_MODEL', 'gemini-flash-latest');
    this.timeoutMs = Number(config.get<string>('AI_TIMEOUT_MS', '30000'));
    this.temperature = Number(config.get<string>('AI_TEMPERATURE', '0.2'));
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async rewrite(input: AiRewriteInput): Promise<AiRewriteOutput> {
    const client = this.getClient();

    let response: GenerateContentResponse;
    try {
      response = await client.models.generateContent({
        model: this.model,
        contents: buildUserPrompt(input.text),
        config: {
          systemInstruction: buildSystemInstruction(input.tone),
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: this.temperature,
          abortSignal: AbortSignal.timeout(this.timeoutMs),
        },
      });
    } catch (error) {
      throw this.toAditException(error);
    }

    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
      this.logger.warn(`Gemini ปฏิเสธข้อความ: ${blockReason}`);
      throw new AditException(
        'BLOCKED_CONTENT',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const raw = response.text;
    if (!raw) {
      this.logger.error(
        `Gemini ตอบกลับว่างเปล่า finishReason=${response.candidates?.[0]?.finishReason ?? 'unknown'}`,
      );
      throw new AditException('PROVIDER_ERROR', HttpStatus.BAD_GATEWAY);
    }

    return { ...this.parse(raw), model: this.model };
  }

  private getClient(): GoogleGenAI {
    if (!this.isConfigured()) {
      throw new AditException(
        'PROVIDER_UNCONFIGURED',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    // สร้าง client ครั้งเดียวแล้วใช้ซ้ำ (ปลอดภัยต่อการเรียกพร้อมกัน)
    this.client ??= new GoogleGenAI({ apiKey: this.apiKey });
    return this.client;
  }

  /** แปลง JSON ที่โมเดลตอบกลับให้เป็นผลลัพธ์ที่ Frontend ใช้ได้ */
  private parse(raw: string): { result: string; notes: RewriteNote[] } {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.error(`Gemini ตอบกลับไม่ใช่ JSON: ${raw.slice(0, 200)}`);
      throw new AditException('PROVIDER_ERROR', HttpStatus.BAD_GATEWAY);
    }

    const payload = parsed as { result?: unknown; notes?: unknown };
    const result =
      typeof payload.result === 'string' ? payload.result.trim() : '';

    if (!result) {
      this.logger.error('Gemini ตอบกลับโดยไม่มีฟิลด์ result');
      throw new AditException('PROVIDER_ERROR', HttpStatus.BAD_GATEWAY);
    }

    return { result, notes: this.parseNotes(payload.notes) };
  }

  private parseNotes(value: unknown): RewriteNote[] {
    if (!Array.isArray(value)) return [];

    return value
      .filter(
        (note): note is RewriteNote =>
          typeof note === 'object' &&
          note !== null &&
          typeof (note as RewriteNote).before === 'string' &&
          typeof (note as RewriteNote).after === 'string' &&
          typeof (note as RewriteNote).reason === 'string',
      )
      .filter((note) => note.before.trim() !== note.after.trim())
      .slice(0, MAX_NOTES);
  }

  private toAditException(error: unknown): AditException {
    if (error instanceof AditException) return error;

    const name = error instanceof Error ? error.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      this.logger.error(`Gemini ใช้เวลาเกิน ${this.timeoutMs} ms`);
      return new AditException('PROVIDER_TIMEOUT', HttpStatus.GATEWAY_TIMEOUT);
    }

    const status = (error as { status?: number }).status;
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`Gemini ผิดพลาด (status=${status ?? 'n/a'}): ${message}`);

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return new AditException('RATE_LIMITED', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      return new AditException(
        'PROVIDER_UNCONFIGURED',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    // 400 พร้อม API_KEY_INVALID = key ผิด ไม่ใช่ปัญหาชั่วคราว
    if (status === HttpStatus.BAD_REQUEST && message.includes('API_KEY')) {
      return new AditException(
        'PROVIDER_UNCONFIGURED',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    // 404 = ชื่อโมเดลใน GEMINI_MODEL ใช้ไม่ได้ (เลิกให้บริการ หรือ key ไม่มีสิทธิ์)
    if (status === HttpStatus.NOT_FOUND) {
      return new AditException(
        'MODEL_UNAVAILABLE',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return new AditException('PROVIDER_ERROR', HttpStatus.BAD_GATEWAY);
  }
}
