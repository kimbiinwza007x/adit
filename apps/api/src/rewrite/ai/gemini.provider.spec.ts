import { DEFAULT_MODELS, parseModels } from './gemini.provider';

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
