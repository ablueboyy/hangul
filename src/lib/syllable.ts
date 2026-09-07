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

export function isInitial(char: string): boolean {
  return (INITIALS as readonly string[]).includes(char)
}

export function isMedial(char: string): boolean {
  return (MEDIALS as readonly string[]).includes(char)
}

/** 把初聲 + 中聲拼成一個音節字，拼不起來就回傳 null */
export function compose(initial: string, medial: string): string | null {
  const i = (INITIALS as readonly string[]).indexOf(initial)
  const m = (MEDIALS as readonly string[]).indexOf(medial)
  if (i < 0 || m < 0) return null
  return String.fromCharCode(SYLLABLE_BASE + (i * 21 + m) * 28)
}

/** 音節的羅馬拼音，例如 가 → ga */
export function romanize(initial: string, medial: string): string {
  const head = INITIAL_ROMAN[initial] ?? ''
  const body = MEDIAL_ROMAN[medial] ?? ''
  return head + body
}

export const initialRoman = (char: string) => INITIAL_ROMAN[char] ?? ''
export const medialRoman = (char: string) => MEDIAL_ROMAN[char] ?? ''
