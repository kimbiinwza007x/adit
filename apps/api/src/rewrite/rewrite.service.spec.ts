import { Test } from '@nestjs/testing';
import { AditException } from '../common/adit.exception';
import { AI_PROVIDER } from './ai/ai-provider.interface';
import type { AiProvider } from './ai/ai-provider.interface';
import { RewriteRequestDto } from './dto/rewrite-request.dto';
import { RewriteService } from './rewrite.service';

/** Provider ปลอม ใช้ทดสอบโดยไม่ต้องเรียก Gemini จริง */
const fakeProvider: AiProvider = {
  name: 'fake',
  isConfigured: () => true,
  rewrite: ({ text, tone }) =>
    Promise.resolve({
      result: `[${tone}] ${text}`,
      notes: [{ before: 'ผม', after: 'ข้าพเจ้า', reason: 'ภาษาพูด' }],
      model: 'fake-model',
    }),
};

describe('RewriteService', () => {
  let service: RewriteService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RewriteService,
        { provide: AI_PROVIDER, useValue: fakeProvider },
      ],
    }).compile();

    service = moduleRef.get(RewriteService);
  });

  it('คืนข้อความต้นฉบับและผลลัพธ์คู่กัน', async () => {
    const dto: RewriteRequestDto = {
      text: 'ผมจะส่งงานพรุ่งนี้',
      tone: 'formal',
    };

    const response = await service.rewrite(dto);

    expect(response.original).toBe('ผมจะส่งงานพรุ่งนี้');
    expect(response.result).toBe('[formal] ผมจะส่งงานพรุ่งนี้');
    expect(response.tone).toBe('formal');
    expect(response.model).toBe('fake-model');
    expect(response.notes).toHaveLength(1);
    expect(response.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('ใช้ tone เริ่มต้นเมื่อไม่ได้ระบุมา', async () => {
    const dto = { text: 'ทดสอบ' } as RewriteRequestDto;

    const response = await service.rewrite(dto);

    expect(response.tone).toBe('formal');
  });

  it('บอกว่าผลลัพธ์มาจาก AI', async () => {
    const response = await service.rewrite({
      text: 'ทดสอบ',
      tone: 'formal',
    });

    expect(response.source).toBe('ai');
  });

  it('รายงานสถานะของ provider ให้ health check', () => {
    expect(service.status()).toEqual({
      provider: 'fake',
      configured: true,
      models: undefined,
    });
  });
});

describe('RewriteService — ตาข่ายรับเมื่อ AI ใช้ไม่ได้', () => {
  async function buildWith(failure: AditException): Promise<RewriteService> {
    const failingProvider: AiProvider = {
      name: 'failing',
      isConfigured: () => true,
      rewrite: () => Promise.reject(failure),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RewriteService,
        { provide: AI_PROVIDER, useValue: failingProvider },
      ],
    }).compile();

    return moduleRef.get(RewriteService);
  }

  it('ใช้กฎพื้นฐานแทนเมื่อโควตาหมด', async () => {
    const service = await buildWith(new AditException('RATE_LIMITED', 429));

    const response = await service.rewrite({
      text: 'ว่างมั้ยคับ 5555',
      tone: 'formal',
    });

    expect(response.source).toBe('rules');
    expect(response.model).toBe('rule-engine');
    expect(response.result).toBe('ว่างไหมครับ');
    expect(response.original).toBe('ว่างมั้ยคับ 5555');
  });

  it('ใช้กฎพื้นฐานแทนเมื่อยังไม่ได้ตั้งค่า API key', async () => {
    const service = await buildWith(
      new AditException('PROVIDER_UNCONFIGURED', 503),
    );

    const response = await service.rewrite({
      text: 'ทำยังไงดีจ้า',
      tone: 'formal',
    });

    expect(response.source).toBe('rules');
    expect(response.result).toBe('ทำอย่างไรดี');
  });

  it('ไม่กลบ error เมื่อข้อความถูกระบบความปลอดภัยปฏิเสธ', async () => {
    const service = await buildWith(new AditException('BLOCKED_CONTENT', 422));

    await expect(
      service.rewrite({
        text: 'ว่างมั้ย',
        tone: 'formal',
      }),
    ).rejects.toMatchObject({ response: { code: 'BLOCKED_CONTENT' } });
  });

  it('โยน error เดิมกลับไปเมื่อกฎแก้อะไรไม่ได้เลย', async () => {
    const service = await buildWith(new AditException('RATE_LIMITED', 429));

    await expect(
      service.rewrite({
        text: 'เรียนแจ้งเพื่อทราบ',
        tone: 'formal',
      }),
    ).rejects.toMatchObject({ response: { code: 'RATE_LIMITED' } });
  });
});
