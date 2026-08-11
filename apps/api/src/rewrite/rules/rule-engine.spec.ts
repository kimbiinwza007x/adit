import { applyRules } from './rule-engine';

describe('applyRules — คำแสดงอารมณ์และสัญลักษณ์', () => {
  it('ตัดเสียงหัวเราะออก', () => {
    expect(applyRules('ส่งงานแล้วนะ 5555').result).toBe('ส่งงานแล้วนะ');
  });

  it('ตัดอีโมจิออก', () => {
    expect(applyRules('ขอบคุณมาก 🙏😊').result).toBe('ขอบคุณมาก');
  });

  it('ตัดเครื่องหมายอัศเจรีย์ และยุบเครื่องหมายคำถามที่ซ้ำ', () => {
    expect(applyRules('รีบมาก!!!').result).toBe('รีบมาก');
    expect(applyRules('จริงหรือ???').result).toBe('จริงหรือ?');
  });

  it('ยุบตัวอักษรไทยที่ซ้ำเกินสองตัว', () => {
    expect(applyRules('ดีมากกกกก').result).toBe('ดีมาก');
  });
});

describe('applyRules — คำสะกดผิด', () => {
  it('แก้ นะค่ะ เป็น นะคะ', () => {
    expect(applyRules('รบกวนด้วยนะค่ะ').result).toBe('รบกวนด้วยนะคะ');
  });

  it('แก้คำลงท้ายที่สะกดผิดเป็น ครับ', () => {
    expect(applyRules('ส่งให้แล้วคับ').result).toBe('ส่งให้แล้วครับ');
    expect(applyRules('รับทราบงับ').result).toBe('รับทราบครับ');
  });

  it('แก้ คับ กลางข้อความเมื่อตามหลังคำที่บอกว่าจบประโยคแล้ว', () => {
    expect(applyRules('ว่างไหมคับ ทำยังไงดี').result).toBe(
      'ว่างไหมครับ ทำอย่างไรดี',
    );
    expect(applyRules('ส่งแล้วคับ เดี๋ยวตามให้').result).toBe(
      'ส่งแล้วครับ เดี๋ยวตามให้',
    );
  });

  it('แก้ คับ ได้แม้คำข้างหน้าเพิ่งถูกกฎอื่นแปลงมาก่อน', () => {
    // "มั้ย" ต้องกลายเป็น "ไหม" ก่อน กฎ คับ ถึงจะเห็นบริบทว่าจบประโยคแล้ว
    expect(applyRules('ว่างมั้ยคับ 5555 ทำยังไงดีจ้า').result).toBe(
      'ว่างไหมครับ ทำอย่างไรดี',
    );
  });

  it('แก้ เค้า เป็น เขา', () => {
    expect(applyRules('เค้าบอกว่าพรุ่งนี้').result).toBe('เขาบอกว่าพรุ่งนี้');
  });

  it('แก้ มหาลัย เป็น มหาวิทยาลัย', () => {
    expect(applyRules('ไปมหาลัย').result).toBe('ไปมหาวิทยาลัย');
  });
});

describe('applyRules — ภาษาพูดเป็นภาษาเขียน', () => {
  it('แก้ มั้ย เป็น ไหม', () => {
    expect(applyRules('ว่างมั้ย').result).toBe('ว่างไหม');
  });

  it('แก้ ป่ะ ท้ายประโยคเป็น หรือไม่', () => {
    expect(applyRules('ไปด้วยกันป่ะ').result).toBe('ไปด้วยกันหรือไม่');
  });

  it('แก้ ยังไง เป็น อย่างไร', () => {
    expect(applyRules('ทำยังไงดี').result).toBe('ทำอย่างไรดี');
  });

  it('แก้ เยอะแยะ ก่อน เยอะ เพื่อไม่ให้ได้คำประหลาด', () => {
    expect(applyRules('งานเยอะแยะ').result).toBe('งานมากมาย');
    expect(applyRules('งานเยอะ').result).toBe('งานมาก');
  });

  it('แก้ โอเค และ OK เป็น ตกลง', () => {
    expect(applyRules('โอเคครับ').result).toBe('ตกลงครับ');
    expect(applyRules('OK ครับ').result).toBe('ตกลง ครับ');
  });

  it('ตัดคำลงท้ายภาษาพูดท้ายข้อความ', () => {
    expect(applyRules('ได้เลยจ้า').result).toBe('ได้เลย');
    expect(applyRules('รับทราบเนอะ').result).toBe('รับทราบ');
  });
});

describe('applyRules — ต้องไม่ทำคำอื่นพัง', () => {
  it('ไม่แตะ ประชุม แม้จะมี ปะ อยู่ข้างใน', () => {
    expect(applyRules('ขอเลื่อนประชุม').result).toBe('ขอเลื่อนประชุม');
  });

  it('ไม่แตะ เค้าโครง เค้าลาง เค้าหน้า', () => {
    expect(applyRules('เค้าโครงเรื่อง').result).toBe('เค้าโครงเรื่อง');
    expect(applyRules('ดูเค้าหน้าแล้ว').result).toBe('ดูเค้าหน้าแล้ว');
  });

  it('ไม่แตะ คับ ที่เป็นคำคุณศัพท์จริง ๆ กลางข้อความ', () => {
    expect(applyRules('เสื้อคับไปหน่อย ขอเปลี่ยนไซซ์').result).toBe(
      'เสื้อคับไปหน่อย ขอเปลี่ยนไซซ์',
    );
    expect(applyRules('กางเกงคับมาก').result).toBe('กางเกงคับมาก');
  });

  it('ไม่แตะเลข 5 ที่เป็นจำนวนจริง', () => {
    expect(applyRules('ขอ 5 ชุด และอีก 55 กล่อง').result).toBe(
      'ขอ 5 ชุด และอีก 55 กล่อง',
    );
  });

  it('ไม่แตะคำอังกฤษที่มี ok อยู่ข้างใน', () => {
    expect(applyRules('ส่งไฟล์ token ให้แล้ว').result).toBe(
      'ส่งไฟล์ token ให้แล้ว',
    );
    expect(applyRules('ใช้ Notebook เครื่องนี้').result).toBe(
      'ใช้ Notebook เครื่องนี้',
    );
  });
});

describe('applyRules — ช่องว่างและผลลัพธ์รวม', () => {
  it('ยุบช่องว่างซ้ำและตัดช่องว่างหัวท้าย', () => {
    expect(applyRules('  ส่งงาน   แล้ว  ').result).toBe('ส่งงาน แล้ว');
  });

  it('รักษาการขึ้นบรรทัดใหม่ไว้', () => {
    expect(applyRules('บรรทัดหนึ่ง\nบรรทัดสอง').result).toBe(
      'บรรทัดหนึ่ง\nบรรทัดสอง',
    );
  });

  it('บอกว่าไม่มีอะไรเปลี่ยนเมื่อข้อความเรียบร้อยอยู่แล้ว', () => {
    const outcome = applyRules('เรียนแจ้งเพื่อทราบ');
    expect(outcome.changed).toBe(false);
    expect(outcome.notes).toHaveLength(0);
  });

  it('รายงานสิ่งที่แก้ไขพร้อมเหตุผล', () => {
    const outcome = applyRules('ว่างมั้ยคับ 5555');

    expect(outcome.result).toBe('ว่างไหมครับ');
    expect(outcome.changed).toBe(true);
    expect(outcome.notes).toContainEqual({
      before: 'มั้ย',
      after: 'ไหม',
      reason: 'ภาษาพูด',
    });
  });

  it('ไม่รายงานรายการซ้ำเมื่อกฎเดียวโดนหลายที่', () => {
    const outcome = applyRules('ว่างมั้ย ไปมั้ย เอามั้ย');
    const maiNotes = outcome.notes.filter((note) => note.before === 'มั้ย');

    expect(outcome.result).toBe('ว่างไหม ไปไหม เอาไหม');
    expect(maiNotes).toHaveLength(1);
  });

  it('ไม่รายงานรายการที่เป็นการจัดช่องว่างล้วน ๆ', () => {
    const outcome = applyRules('ว่างมั้ย   ตอบด้วย');

    expect(outcome.result).toBe('ว่างไหม ตอบด้วย');
    expect(outcome.notes.every((note) => note.before.trim() !== '')).toBe(true);
  });

  it('ส่งรายการแก้ไขไม่เกิน 8 รายการ', () => {
    const outcome = applyRules(
      'เค้าบอกว่างานเยอะมั้ย ทำยังไง โอเคป่ะ 5555 !!! ดีมากกก 🙏 นะค่ะ',
    );

    expect(outcome.notes.length).toBeLessThanOrEqual(8);
  });
});
