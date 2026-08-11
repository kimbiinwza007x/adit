import { isOriginAllowed, parseOrigins } from './app.setup';

describe('parseOrigins', () => {
  it('ใช้ localhost เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้ง WEB_ORIGIN', () => {
    expect(parseOrigins(undefined)).toEqual(['http://localhost:3000']);
  });

  it('แยกค่าที่คั่นด้วย , และตัดช่องว่างทิ้ง', () => {
    expect(parseOrigins('https://a.com , https://b.com,')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });
});

describe('isOriginAllowed', () => {
  const allowed = ['https://adit-web-delta.vercel.app', 'https://*.vercel.app'];

  it('ผ่านเมื่อตรงกันทุกตัวอักษร', () => {
    expect(isOriginAllowed('https://adit-web-delta.vercel.app', allowed)).toBe(
      true,
    );
  });

  it('ผ่าน preview URL ของ Vercel ผ่าน wildcard', () => {
    expect(
      isOriginAllowed('https://adit-web-git-dev-k1m.vercel.app', allowed),
    ).toBe(true);
  });

  it('ไม่ผ่านเมื่อเป็นคนละโดเมน', () => {
    expect(isOriginAllowed('https://evil.com', allowed)).toBe(false);
  });

  it('wildcard แทนได้แค่ชั้นเดียว ไม่ทะลุไปโดเมนอื่น', () => {
    expect(isOriginAllowed('https://evil.com/x.vercel.app', allowed)).toBe(
      false,
    );
    expect(isOriginAllowed('https://a.b.vercel.app', allowed)).toBe(false);
  });

  it('ไม่ผ่านเมื่อ scheme ไม่ตรง', () => {
    expect(isOriginAllowed('http://adit-web-delta.vercel.app', allowed)).toBe(
      false,
    );
  });

  it('ไม่ผ่านเมื่อไม่ได้ตั้ง wildcard ไว้', () => {
    expect(
      isOriginAllowed('https://อื่น.vercel.app', [
        'https://adit-web-delta.vercel.app',
      ]),
    ).toBe(false);
  });
});
