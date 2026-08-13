import {
  DEFAULT_MODELS,
  parseModels,
  parseNumberSetting,
} from './gemini.provider';

describe('parseModels', () => {
  it('ใช้รายการเริ่มต้นเมื่อไม่ได้ตั้งค่าอะไรเลย', () => {
    expect(parseModels(undefined, undefined)).toEqual(DEFAULT_MODELS);
    expect(parseModels('', '')).toEqual(DEFAULT_MODELS);
  });

  it('เอาโมเดลหลักไว้หน้าสุด แล้วต่อด้วยโมเดลสำรองตามลำดับ', () => {
    expect(parseModels('gemini-flash-latest', 'lite-a,lite-b')).toEqual([
      'gemini-flash-latest',
      'lite-a',
      'lite-b',
    ]);
  });

  it('ตัดช่องว่างและรายการว่างทิ้ง', () => {
    expect(parseModels(' primary ', ' a , , b ,')).toEqual([
      'primary',
      'a',
      'b',
    ]);
  });

  it('ตัดโมเดลที่ซ้ำออก เหลือลำดับแรกที่เจอ', () => {
    expect(parseModels('a', 'b,a,c,b')).toEqual(['a', 'b', 'c']);
  });

  it('ตั้งเฉพาะโมเดลสำรองก็ใช้ได้', () => {
    expect(parseModels('', 'only-fallback')).toEqual(['only-fallback']);
  });

  it('ตั้งหลายตัวในช่อง GEMINI_MODEL ช่องเดียวก็ได้', () => {
    expect(parseModels('a,b', undefined)).toEqual(['a', 'b']);
  });
});

describe('parseNumberSetting', () => {
  it('ใช้ค่าที่ตั้งมาเมื่อเป็นตัวเลขที่ถูกต้อง', () => {
    expect(parseNumberSetting('15000', 30000, true)).toBe(15000);
    expect(parseNumberSetting('0.4', 0.2)).toBe(0.4);
    expect(parseNumberSetting('0', 0.2)).toBe(0);
  });

  it('ถอยไปใช้ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า', () => {
    expect(parseNumberSetting(undefined, 30000, true)).toBe(30000);
    expect(parseNumberSetting('', 30000, true)).toBe(30000);
  });

  it('ถอยไปใช้ค่าเริ่มต้นเมื่อค่าที่ตั้งมาไม่ใช่ตัวเลข', () => {
    // "30s" คือความผิดพลาดที่เกิดขึ้นได้จริง และเคยทำให้ AbortSignal.timeout โยน RangeError ทุก request
    expect(parseNumberSetting('30s', 30000, true)).toBe(30000);
    expect(parseNumberSetting('ไม่ใช่ตัวเลข', 30000, true)).toBe(30000);
    expect(parseNumberSetting('Infinity', 30000, true)).toBe(30000);
  });

  it('ถอยไปใช้ค่าเริ่มต้นเมื่อ timeout ไม่เป็นบวก', () => {
    expect(parseNumberSetting('0', 30000, true)).toBe(30000);
    expect(parseNumberSetting('-1', 30000, true)).toBe(30000);
  });

  it('ค่าที่ได้ต้องใช้กับ AbortSignal.timeout ได้เสมอ', () => {
    for (const raw of ['30s', '', undefined, '-5', 'NaN']) {
      const timeout = parseNumberSetting(raw, 30000, true);
      expect(() => AbortSignal.timeout(timeout)).not.toThrow();
    }
  });
});
