import { isOriginAllowed, parseOrigins } from './app.setup';

describe('parseOrigins', () => {
  it('ใช้ localhost เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้ง WEB_ORIGIN', () => {
    expect(parseOrigins(undefined)).toEqual(['http://localhost:3000']);
  });

  it('ใช้ค่าเริ่มต้นเมื่อตั้งเป็นค่าว่างหรือมีแต่ช่องว่าง', () => {
    expect(parseOrigins('')).toEqual(['http://localhost:3000']);
    expect(parseOrigins('   ')).toEqual(['http://localhost:3000']);
    expect(parseOrigins(',,')).toEqual(['http://localhost:3000']);
  });

  it('แยกค่าที่คั่นด้วย , และตัดช่องว่างทิ้ง', () => {
    expect(parseOrigins('https://a.com , https://b.com,')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('ตัดเครื่องหมายคำพูดที่ติดมาตอน paste ออก', () => {
    expect(parseOrigins('"https://a.com"')).toEqual(['https://a.com']);
    expect(parseOrigins("'https://a.com','https://b.com'")).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('เติม https:// ให้เมื่อวางมาแต่โดเมนเปล่า', () => {
    expect(parseOrigins('adit-web-delta.vercel.app')).toEqual([
      'https://adit-web-delta.vercel.app',
    ]);
    expect(parseOrigins('"adit-web-delta.vercel.app/"')).toEqual([
      'https://adit-web-delta.vercel.app',
    ]);
    expect(parseOrigins('*.vercel.app')).toEqual(['https://*.vercel.app']);
  });

  it('ใช้ http:// ให้ localhost ที่วางมาแบบไม่มี scheme', () => {
    expect(parseOrigins('localhost:3000')).toEqual(['http://localhost:3000']);
  });

  it('ไม่แตะค่าที่มี scheme มาอยู่แล้ว', () => {
    expect(parseOrigins('http://example.com')).toEqual(['http://example.com']);
  });

  it('ตัด / ปิดท้ายออก เพราะ origin ที่เบราว์เซอร์ส่งมาไม่มี /', () => {
    expect(parseOrigins('https://a.com/')).toEqual(['https://a.com']);
    expect(parseOrigins('"https://a.com/" , https://b.com//')).toEqual([
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
