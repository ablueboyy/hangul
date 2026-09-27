/**
 * 韓文音節在 Unicode 裡是算出來的，不是查表來的：
 *   code = 0xAC00 + (初聲index * 21 + 中聲index) * 28 + 終聲index
 * 所以 19 個初聲 × 21 個中聲 × 28 個終聲 = 11172 個音節全部可以現場組出來。
 */

const SYLLABLE_BASE = 0xac00

/** 初聲順序（Unicode 規定的，不能改） */
export const INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const

/** 中聲順序（Unicode 規定的，不能改） */
export const MEDIALS = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
] as const

/** 初聲在音節開頭時的羅馬拼音（ㅇ 不發音） */
const INITIAL_ROMAN: Record<string, string> = {
  ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt', ㄹ: 'r', ㅁ: 'm',
  ㅂ: 'b', ㅃ: 'pp', ㅅ: 's', ㅆ: 'ss', ㅇ: '', ㅈ: 'j', ㅉ: 'jj',
  ㅊ: 'ch', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h',
}

const MEDIAL_ROMAN: Record<string, string> = {
  ㅏ: 'a', ㅐ: 'ae', ㅑ: 'ya', ㅒ: 'yae', ㅓ: 'eo', ㅔ: 'e', ㅕ: 'yeo',
  ㅖ: 'ye', ㅗ: 'o', ㅘ: 'wa', ㅙ: 'wae', ㅚ: 'oe', ㅛ: 'yo', ㅜ: 'u',
  ㅝ: 'wo', ㅞ: 'we', ㅟ: 'wi', ㅠ: 'yu', ㅡ: 'eu', ㅢ: 'ui', ㅣ: 'i',
}

/**
 * 收音（終聲）。寫法有 27 種，但念出來只剩 7 個代表音 ——
 * ㅅㅈㅊㅌㅎ 收在下面都念 ㄷ、ㅋㄲ 念 ㄱ、ㅍ 念 ㅂ。
 * 聽寫只能考這 7 個，其他的光聽根本分不出來（갓 갖 갗 같 念起來都是 갇）。
 */
export const SOUND_FINALS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅇ'] as const

/** 終聲在 Unicode 裡的位置（0 = 沒有收音） */
const FINAL_INDEX: Record<string, number> = {
  ㄱ: 1, ㄴ: 4, ㄷ: 7, ㄹ: 8, ㅁ: 16, ㅂ: 17, ㅇ: 21,
}

/** 收音的羅馬拼音：收在下面的音不送氣也不爆開，所以 ㄱ 寫 k、ㅂ 寫 p */
const FINAL_ROMAN: Record<string, string> = {
  ㄱ: 'k', ㄴ: 'n', ㄷ: 't', ㄹ: 'l', ㅁ: 'm', ㅂ: 'p', ㅇ: 'ng',
}

export function isInitial(char: string): boolean {
  return (INITIALS as readonly string[]).includes(char)
}

export function isMedial(char: string): boolean {
  return (MEDIALS as readonly string[]).includes(char)
}

/** 把初聲 + 中聲（+ 收音）拼成一個音節字，拼不起來就回傳 null */
export function compose(initial: string, medial: string, final?: string): string | null {
  const i = (INITIALS as readonly string[]).indexOf(initial)
  const m = (MEDIALS as readonly string[]).indexOf(medial)
  const f = final ? FINAL_INDEX[final] : 0
  if (i < 0 || m < 0 || f === undefined) return null
  return String.fromCharCode(SYLLABLE_BASE + (i * 21 + m) * 28 + f)
}

/** 音節的羅馬拼音，例如 가 → ga、강 → gang */
export function romanize(initial: string, medial: string, final?: string): string {
  const head = INITIAL_ROMAN[initial] ?? ''
  const body = MEDIAL_ROMAN[medial] ?? ''
  const tail = final ? (FINAL_ROMAN[final] ?? '') : ''
  return head + body + tail
}

export const initialRoman = (char: string) => INITIAL_ROMAN[char] ?? ''
export const medialRoman = (char: string) => MEDIAL_ROMAN[char] ?? ''
