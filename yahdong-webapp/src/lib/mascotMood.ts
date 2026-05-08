/**
 * Mascot Mood Resolver — "Calm Mascot" mood mapping
 *
 * แมป mood ของดอง (mascot) จาก aggregate state ของ board
 * ไม่ใช่จาก user streak — เน้น "calm" ไม่กดดัน ไม่ shame user
 *
 * Phase 1 (current): Sidebar ใช้แค่ projectCount → 2 mood (empty / watching)
 * Phase 2 (future):  มี endpoint /projects/aggregate-stats → ใช้ resolver เต็ม
 *
 * Asset placeholders (until 07-09 designed):
 * - todo      → use 01 (placeholder, replace with dong-sticker-07 when ready)
 * - concerned → use 02 (placeholder, replace with dong-sticker-09 when ready)
 * - paused    → use 06 (placeholder, replace with dong-sticker-08 when ready)
 */

import dongSticker01 from '../assets/dong/dong-sticker-01-เห็นอยู่นะ.png'
import dongSticker02 from '../assets/dong/dong-sticker-02-เลยกำหนด.png'
import dongSticker05 from '../assets/dong/dong-sticker-05-ว่างอยู่.png'
import dongSticker06 from '../assets/dong/dong-sticker-06-กลับบ้าน.png'

export type MascotMood =
  | 'empty'      // 05 ว่างอยู่           — ไม่มี project
  | 'todo'       // 07 มองอยู่ (NEW)      — มี project แต่ยังไม่มี task
  | 'concerned'  // 09 เป็นห่วง (NEW)     — มี task เลยกำหนด (gentle, NOT shaming)
  | 'paused'     // 08 พักรอ (NEW)        — ไม่มี in-progress, ยังเหลืองาน
  | 'home'       // 06 กลับบ้าน           — เคลียร์หมดแล้ว
  | 'watching'   // 01 เห็นอยู่นะ          — default active

export interface MascotStats {
  projectCount: number
  totalTasks: number
  doneTasks: number
  overdueTasks: number
  inProgressTasks: number
}

/**
 * Resolve mood ตาม priority (early return)
 *
 * Priority order:
 * 1. empty       — ไม่มี project เลย
 * 2. todo        — มี project แต่ยังไม่มี task
 * 3. concerned   — มี task เลยกำหนด (สำคัญที่สุดถัดมา — แจ้งเตือนแบบนุ่ม ๆ)
 * 4. home        — เคลียร์หมดแล้ว (celebrate)
 * 5. paused      — ยังเหลืองานแต่ไม่มี in-progress
 * 6. watching    — default (กำลัง active ทำงาน)
 */
export function resolveMascotMood(stats: MascotStats): MascotMood {
  const { projectCount, totalTasks, doneTasks, overdueTasks, inProgressTasks } = stats

  if (projectCount === 0) return 'empty'
  if (totalTasks === 0) return 'todo'
  if (overdueTasks > 0) return 'concerned'
  if (doneTasks === totalTasks) return 'home'
  if (inProgressTasks === 0 && doneTasks < totalTasks) return 'paused'
  return 'watching'
}

/**
 * Caption ตาม mood — gentle tone, NEVER shaming
 */
export const MASCOT_CAPTION: Record<MascotMood, string> = {
  empty: 'ว่างอยู่เลย',
  todo: 'พร้อมเริ่มมั้ยบอส?',
  concerned: 'มีงานเลยกำหนดนะ',
  paused: 'พักไว้ไม่เป็นไร',
  home: 'เคลียร์หมดแล้ว 🎉',
  watching: 'ดองเห็นอยู่นะ',
}

/**
 * Asset map — sticker image per mood
 *
 * NOTE: 07/08/09 ยังไม่มีไฟล์ ใช้ placeholder ก่อน
 * - TODO: replace with dong-sticker-07 when ready (todo mood)
 * - TODO: replace with dong-sticker-08 when ready (paused mood)
 * - TODO: replace with dong-sticker-09 when ready (concerned mood)
 */
export const MASCOT_ASSET: Record<MascotMood, string> = {
  empty: dongSticker05,
  todo: dongSticker01,        // TODO: replace with dong-sticker-07 when ready
  concerned: dongSticker02,   // TODO: replace with dong-sticker-09 when ready
  paused: dongSticker06,      // TODO: replace with dong-sticker-08 when ready
  home: dongSticker06,
  watching: dongSticker01,
}
