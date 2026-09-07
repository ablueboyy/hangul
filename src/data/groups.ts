/**
 * 課程分組：一次解鎖 5 個字母，整組都練到「精通」才會開下一組。
 * 順序是先把 10 個基本母音學完，再進子音 —
 * 母音要寫成字的時候前面要加一個不發音的 ㅇ（ㅏ → 아），
 * 所以第一組就已經可以出「這個字怎麼念」的題目了。
 */
export interface LetterGroup {
  /** 1 起算 */
  id: number
  title: string
  note: string
  chars: string[]
}

export const GROUPS: LetterGroup[] = [
  {
    id: 1,
    title: '母音起手式',
    note: '韓文母音的邏輯是「基本形 + 一畫 = 加上 y 的音」。這一組先抓 ㅏ/ㅑ 和 ㅓ/ㅕ 兩對。',
    chars: ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ'],
  },
  {
    id: 2,
    title: '基本母音收齊',
    note: '補完剩下 5 個，10 個基本母音就到齊了。注意 ㅜ 和 ㅡ 的嘴型差別。',
    chars: ['ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'],
  },
  {
    id: 3,
    title: '開始拼字',
    note: '第一批子音。從這裡開始，子音配母音就能拼出真正的字了：ㄱ + ㅏ = 가。',
    chars: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ'],
  },
  {
    id: 4,
    title: '子音第二批',
    note: '包含一直在幫你撐場面的 ㅇ — 它在字首不發音，只有放在字的下面才發 ng。',
    chars: ['ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ'],
  },
  {
    id: 5,
    title: '送氣音',
    note: 'ㅊㅋㅌㅍ 都是前面學過的子音「加一畫、加一口氣」。順便收一個複合母音 ㅐ。',
    chars: ['ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅐ'],
  },
  {
    id: 6,
    title: '複合母音 (一)',
    note: '兩個母音合體。ㅐ 和 ㅔ 現代已經幾乎同音，分辨寫法比分辨聲音重要。',
    chars: ['ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ'],
  },
  {
    id: 7,
    title: '複合母音 (二)',
    note: 'ㅙ / ㅚ / ㅞ 三兄弟現在念起來一樣，靠單字記寫法。',
    chars: ['ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'],
  },
  {
    id: 8,
    title: '雙子音（緊音）',
    note: '最後 5 個。重點是「喉嚨繃緊、完全不吐氣」，不是「更用力吐氣」。',
    chars: ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'],
  },
]

/** 母音單獨成字時借用的無聲子音 — 第 1 組就會用到，但它要到第 4 組才正式解鎖計分 */
export const SILENT_INITIAL = 'ㅇ'

export const GROUP_OF_CHAR = new Map<string, number>(
  GROUPS.flatMap((g) => g.chars.map((c) => [c, g.id] as const)),
)

/** 前 n 組的所有字母 */
export const charsUpTo = (unlockedCount: number): string[] =>
  GROUPS.slice(0, unlockedCount).flatMap((g) => g.chars)
