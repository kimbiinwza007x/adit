import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAX_TEXT_LENGTH, REWRITE_TONES } from '@adit/shared';
import type { RewriteRequest, RewriteTone } from '@adit/shared';

export class RewriteRequestDto implements RewriteRequest {
  @IsString({ message: 'text ต้องเป็นข้อความ' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'กรุณากรอกข้อความก่อนให้ AI ช่วยปรับ' })
  @MaxLength(MAX_TEXT_LENGTH, {
    message: `ข้อความยาวเกิน ${MAX_TEXT_LENGTH} ตัวอักษร`,
  })
  text!: string;

  @IsIn(REWRITE_TONES, { message: 'tone ไม่ถูกต้อง' })
  tone: RewriteTone = 'formal';
}
