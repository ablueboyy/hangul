/**
 * 聽寫「字母模式」的出題：用你勾的字母現場拼出音節（可以帶收音），念給你聽再寫下來。
 *
 * 子音當初聲，母音當中聲；收音另外勾，只能從 7 個代表音 ㄱㄴㄷㄹㅁㅂㅇ 裡選。
 * 只勾母音的話，初聲就借不發音的 ㅇ（ㅏ → 아），和課程第一組同一套做法。
 */
import { SILENT_INITIAL } from '../data/groups'
import { weightedPick } from './mastery'
import { compose, isInitial, isMedial, romanize } from './syllable'

export interface DictationSyllable {
  /** 音節本身，也是要念的內容 */
  text: string
  roman: string
  /** 拆開來的樣子，例如 ㄱ + ㅏ + ㅇ */
  parts: string[]
  /** 這題考到哪幾個字母。字首不發音的 ㅇ 不算，因為聽不出來 */
  targets: string[]
}

export function generateSyllables(
  letters: string[],
  /** 要出的收音，空的就不帶收音 */
  finals: string[],
  scores: Record<string, number>,
  count: number,
): DictationSyllable[] {
  const medials = letters.filter(isMedial)
  if (medials.length === 0) return []
  const consonants = letters.filter(isInitial)
  const initials = consonants.length > 0 ? consonants : [SILENT_INITIAL]

  const out: DictationSyllable[] = []
  const used = new Set<string>()
  // 能拼出的組合不多時（例如只勾兩個母音）就允許重複，不然永遠湊不滿
  const combos = initials.length * medials.length * (finals.length + 1)
  let guard = 0
  while (out.length < count && guard++ < count * 50) {
    const initial = weightedPick(initials, scores)
    const medial = weightedPick(medials, scores)
    // 大約一半的題目帶收音，有收音和沒收音的都要會
    const final = finals.length > 0 && Math.random() < 0.5 ? weightedPick(finals, scores) : undefined
    const text = compose(initial, medial, final)
    if (!text) continue
    if (out[out.length - 1]?.text === text && combos > 1) continue
    if (used.has(text) && used.size < combos) continue
    used.add(text)

    const parts = final ? [initial, medial, final] : [initial, medial]
    const targets = [
      ...(initial === SILENT_INITIAL ? [] : [initial]),
      medial,
      ...(final ? [final] : []),
    ]
    out.push({ text, roman: romanize(initial, medial, final), parts, targets: [...new Set(targets)] })
  }
  return out
}
