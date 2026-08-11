import { Test } from '@nestjs/testing';
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

  it('รายงานสถานะของ provider ให้ health check', () => {
    expect(service.status()).toEqual({ provider: 'fake', configured: true });
  });
});
