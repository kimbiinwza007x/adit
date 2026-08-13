import { buildSystemInstruction } from './prompt';

describe('buildSystemInstruction', () => {
  const instruction = buildSystemInstruction();

  it('มีตัวอย่างระดับภาษาอยู่ในคำสั่ง', () => {
    expect(instruction).toContain('ตัวอย่างระดับภาษาที่ต้องการ');
  });

  it('กันการลอกเนื้อหาจากตัวอย่างไปใส่ในผลลัพธ์', () => {
    expect(instruction).toContain('ห้ามคัดลอกคำ วลี หรือโครงประโยคจากตัวอย่าง');
    expect(instruction).toContain(
      'หากต้นฉบับเป็นเรื่องส่วนตัวหรือเรื่องทั่วไป',
    );
  });

  it('ไม่ปล่อยให้ตัวอย่างไปทับกฎเรื่องคำลงท้าย', () => {
    expect(instruction).toContain('ต้องยึดตามกฎข้อ 5 เท่านั้น');
  });

  it('ตัวอย่างต้องไม่มีอีเมลหรือลิงก์ของหน่วยงานติดมา', () => {
    expect(instruction).not.toMatch(/@[\w.-]+\.\w+/);
    expect(instruction).not.toContain('http');
  });

  it('ห้ามใช้สำนวนราชการ เพราะระบบนี้เล็งระดับอีเมลทำงาน', () => {
    expect(instruction).toContain('ไม่ใช่หนังสือราชการ');
    expect(instruction).toContain('ห้ามใช้สำนวนราชการ');
  });
});
