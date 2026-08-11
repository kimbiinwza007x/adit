/**
 * กฎแก้ข้อความไทยแบบกำหนดตายตัว ไม่ต้องใช้ AI
 *
 * ข้อควรระวังหลัก: ภาษาไทยไม่มีช่องว่างคั่นคำ การแทนที่ตรง ๆ จะทำคำอื่นพังได้
 * เช่น "ปะ" อยู่ใน "ประชุม" และ "เค้า" อยู่ใน "เค้าโครง"
 * ทุกกฎจึงต้องผูกกับท้ายข้อความ ท้ายบรรทัด หรือใช้ lookahead/lookbehind กันไว้
 *
 * ตัวอักษรไทยใน regex ใช้ช่วง [ก-๙] เพราะ \b ของ JavaScript ใช้กับภาษาไทยไม่ได้
 */

export interface TextRule {
  /** ชื่อกฎ ใช้อ้างอิงตอนดีบักและในเทสต์ */
  id: string;
  pattern: RegExp;
  replacement: string;
  /** เหตุผลสั้น ๆ ที่จะแสดงให้ผู้ใช้เห็น */
  reason: string;
}

/** อักขระไทยหนึ่งตัว ใช้กันไม่ให้กฎไปโดนกลางคำ */
const TH = '\\u0E01-\\u0E5B';

/** ท้ายข้อความหรือท้ายบรรทัด โดยยอมให้มีช่องว่างหรือเครื่องหมายวรรคตอนคั่นได้ */
const END = '(?=[\\s.!?]*$)';

export const THAI_RULES: TextRule[] = [
  // ── คำแสดงอารมณ์และสัญลักษณ์ ──────────────────────────────
  {
    id: 'laugh',
    pattern: /5{3,}\+?/g,
    replacement: '',
    reason: 'คำแสดงอารมณ์',
  },
  {
    id: 'emoji',
    pattern: /\p{Extended_Pictographic}️?/gu,
    replacement: '',
    reason: 'อีโมจิ',
  },
  {
    id: 'exclamation',
    pattern: /!+/g,
    replacement: '',
    reason: 'เครื่องหมายเน้นอารมณ์',
  },
  {
    id: 'repeated-question-mark',
    pattern: /\?{2,}/g,
    replacement: '?',
    reason: 'เครื่องหมายซ้ำ',
  },
  {
    id: 'repeated-character',
    pattern: new RegExp(`([${TH}])\\1{2,}`, 'g'),
    replacement: '$1',
    reason: 'ตัวอักษรซ้ำ',
  },

  // ── คำสะกดผิดที่พบบ่อย ────────────────────────────────────
  {
    id: 'na-kha',
    pattern: /นะค่ะ/g,
    replacement: 'นะคะ',
    reason: 'สะกดผิด',
  },
  {
    id: 'ka-tone',
    pattern: /ค๊ะ/g,
    replacement: 'คะ',
    reason: 'สะกดผิด',
  },
  {
    id: 'khao',
    pattern: /เค้า(?!โครง|ลาง|เงื่อน|หน้า)/g,
    replacement: 'เขา',
    reason: 'สะกดผิด',
  },
  {
    id: 'university',
    pattern: /มหาลัย/g,
    replacement: 'มหาวิทยาลัย',
    reason: 'คำย่อไม่เป็นทางการ',
  },

  // ── ภาษาพูดเป็นภาษาเขียน ──────────────────────────────────
  // ต้องอยู่ก่อนกฎ คับ ด้านล่าง เพราะกฎนั้นดูคำที่อยู่ข้างหน้าเพื่อตัดสินใจ
  // ถ้ายังไม่ได้แปลง "มั้ย" เป็น "ไหม" ก่อน มันจะหาบริบทไม่เจอ
  {
    id: 'mai-question',
    pattern: /มั้ย/g,
    replacement: 'ไหม',
    reason: 'ภาษาพูด',
  },
  {
    id: 'pa-question',
    pattern: new RegExp(`ป่ะ${END}`, 'gm'),
    replacement: 'หรือไม่',
    reason: 'ภาษาพูด',
  },
  {
    id: 'yang-ngai',
    pattern: /ยังไง/g,
    replacement: 'อย่างไร',
    reason: 'ภาษาพูด',
  },
  {
    id: 'yoe-yae',
    pattern: /เยอะแยะ/g,
    replacement: 'มากมาย',
    reason: 'ภาษาพูด',
  },
  {
    id: 'yoe',
    pattern: /เยอะ/g,
    replacement: 'มาก',
    reason: 'ภาษาพูด',
  },
  {
    id: 'okay',
    pattern: /โอเค|(?<![A-Za-z])[Oo][Kk](?![A-Za-z])/g,
    replacement: 'ตกลง',
    reason: 'ภาษาพูด',
  },

  // ── คำลงท้าย ครับ ที่สะกดผิด (ต้องอยู่หลังกฎภาษาพูดข้างบน) ──
  {
    id: 'khrap-spelling-end',
    pattern: new RegExp(`(?:คับ|งับ|คร้าบ|คราบ|ครัช)${END}`, 'gm'),
    replacement: 'ครับ',
    reason: 'สะกดผิด',
  },
  {
    // กลางข้อความจะแก้ให้เฉพาะเมื่อตามหลังคำที่บอกชัดว่ากำลังจบประโยค
    // จึงไม่ไปโดน "เสื้อคับไปหน่อย" ที่ คับ เป็นคำคุณศัพท์จริง ๆ
    id: 'khrap-spelling-after-particle',
    pattern: /(?<=ไหม|หรือไม่|หรือ|นะ|แล้ว|ได้|ครับ|ค่ะ)(?:คับ|งับ)/g,
    replacement: 'ครับ',
    reason: 'สะกดผิด',
  },

  // ── คำลงท้ายภาษาพูดที่ควรตัดทิ้ง ─────────────────────────
  {
    id: 'casual-particle',
    pattern: new RegExp(`(?:จ้า|จ๊ะ|จ้ะ|ฮะ|อ่ะ|น้า|เนอะ|แหละ)${END}`, 'gm'),
    replacement: '',
    reason: 'คำลงท้ายภาษาพูด',
  },

  // ── ช่องว่าง ──────────────────────────────────────────────
  {
    id: 'multiple-space',
    pattern: / {2,}/g,
    replacement: ' ',
    reason: 'เว้นวรรคเกิน',
  },
  {
    id: 'space-before-punctuation',
    pattern: / +([,.?])/g,
    replacement: '$1',
    reason: 'เว้นวรรคผิดตำแหน่ง',
  },
];
