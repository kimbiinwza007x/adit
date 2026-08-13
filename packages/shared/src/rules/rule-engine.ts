// import แบบ type เท่านั้น จึงไม่เกิดวงจรอ้างอิงตอน runtime แม้ index จะ export ไฟล์นี้ต่อ
import type { RewriteNote } from '../index';
import { THAI_RULES } from './thai-rules';
import type { TextRule } from './thai-rules';

/** จำนวนรายการแก้ไขสูงสุดที่ส่งกลับ ให้เท่ากับฝั่ง AI */
const MAX_NOTES = 8;

export interface RuleResult {
  result: string;
  notes: RewriteNote[];
  /** มีอะไรเปลี่ยนไปจากต้นฉบับหรือไม่ */
  changed: boolean;
}

/**
 * แก้ข้อความด้วยกฎล้วน ๆ ไม่เรียก AI
 *
 * เป็นฟังก์ชันบริสุทธิ์ไม่มี dependency จึงรันได้ทั้งบนเซิร์ฟเวอร์และในเบราว์เซอร์
 *
 * ใช้สามที่:
 * 1. หน้าเว็บเรียกตรง ๆ ขณะผู้ใช้พิมพ์ ได้ผลทันทีโดยไม่ต้องยิงเน็ตและไม่กินโควตา
 * 2. เป็นตาข่ายรับฝั่ง API เมื่อ AI ใช้ไม่ได้
 * 3. เป็นตัวกรองข้อความก่อนส่งให้ AI จะได้ไม่ต้องเสียแรงกับคำผิดที่กฎจัดการได้แล้ว
 */
export function applyRules(
  text: string,
  rules: TextRule[] = THAI_RULES,
): RuleResult {
  const collected: RewriteNote[] = [];
  let current = text;

  for (const rule of rules) {
    current = replaceWithRule(current, rule, collected);
  }

  // เก็บกวาดช่องว่างที่เหลือจากการตัดคำออก
  const result = current
    .split('\n')
    .map((line) => line.replace(/ {2,}/g, ' ').trimEnd())
    .join('\n')
    .trim();

  return {
    result,
    notes: dedupeNotes(collected).slice(0, MAX_NOTES),
    changed: result !== text.trim(),
  };
}

function replaceWithRule(
  text: string,
  rule: TextRule,
  collected: RewriteNote[],
): string {
  // สร้าง regex ใหม่ทุกครั้ง กัน lastIndex ค้างจากการใช้ซ้ำของ flag g
  const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);

  return text.replace(pattern, (...args) => {
    const matched = args[0];
    const replaced = expandReplacement(rule.replacement, args);

    if (matched !== replaced) {
      collected.push({
        before: matched.trim() || matched,
        after: replaced.trim(),
        reason: rule.reason,
      });
    }

    return replaced;
  });
}

/** แทนค่า $1 $2 ในสตริงแทนที่ ด้วยกลุ่มที่จับได้จาก regex */
function expandReplacement(replacement: string, args: unknown[]): string {
  return replacement.replace(/\$(\d)/g, (_, index: string) => {
    const group = args[Number(index)];
    return typeof group === 'string' ? group : '';
  });
}

/**
 * ตัดรายการที่ซ้ำกันออก เพราะกฎเดียวอาจ match หลายที่ในข้อความเดียว
 * และตัดรายการที่เป็นการจัดช่องว่างล้วน ๆ ออก เพราะแสดงให้ผู้ใช้เห็นแล้วเป็นบรรทัดว่าง
 */
function dedupeNotes(notes: RewriteNote[]): RewriteNote[] {
  const seen = new Set<string>();

  return notes.filter((note) => {
    if (!note.before.trim()) return false;

    const key = `${note.before}→${note.after}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
