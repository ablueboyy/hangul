/**
 * 期中考複習的出題和對答案。
 *
 * 每一題都有一個 id（例如 `v:이유`、`blank:vowel:3`），答錯的 id 會進錯題本，
 * 之後可以只練錯題；答對就從錯題本拿掉。id 要能自己還原回題目（itemFromId），
 * 所以錯題本只存 id 就夠了。
 */
import { WORD_BY_KO, wordKind, wordsOfWeeks, type VocabWord, type WordKind } from '../data/vocab'
import {
  EXAM_LAST_WEEK,
  ORDER_ROW_BY_ID,
  sentenceById,
  sentenceDrill,
  type ExamSentence,
  type OrderRowId,
} from '../data/exam'
import { ALL_CHARS, SILENT_INITIAL } from '../data/groups'
import { generateSyllables } from './dictation'
import { shuffle, weightedPick } from './mastery'
import { SOUND_FINALS, decompose, romanize } from './syllable'

export type ExamSection = 'vocab' | 'listen' | 'sentence' | 'order'

export const SECTION_LABEL: Record<ExamSection, string> = {
  vocab: '單字',
  listen: '聽力',
  sentence: '造句',
  order: '字母順序',
}

/** 答完要把分數記到哪：單字分數、字母分數，或不記（只進錯題本） */
export type Scoring = { kind: 'vocab'; ko: string } | { kind: 'letters'; targets: string[] } | null

export interface ExamItem {
  id: string
  section: ExamSection
  /** 題目上方的小標，例如「漢字語・寫出韓文和中文意思」 */
  label: string
  /** 題目本體；聽力題沒有（要用聽的） */
  prompt?: string
  /** 有的話一出題就念，而且有「再聽一次」 */
  speak?: string
  /** 要寫出來的韓文，打字模式拿它自動對答案 */
  answer: string
  /** 也算對的其他寫法 */
  alts?: string[]
  /** 答案底下的小字（羅馬字、中文意思……） */
  detail?: string
  /** 漢字語還要寫中文意思：打字模式韓文對了之後，這個要自己確認 */
  alsoCheck?: string
  /** 整排默寫：打字模式逐格對 */
  row?: string[]
  /** 挖空：整排列出來，第 blank 格是要寫的 */
  sequence?: { chars: string[]; blank: number }
  scoring: Scoring
}

/** 一輪的題數上限 */
export const EXAM_SESSION_SIZE = 15

export const EXAM_WEEKS = Array.from({ length: EXAM_LAST_WEEK }, (_, i) => i + 1)

// ── 單字 ──────────────────────────────────────────────────────────

const KIND_PROMPT: Record<WordKind, string> = {
  hanja: '漢字語・寫出韓文和中文意思',
  loan: '外來語・寫出韓文',
  native: '固有語・寫出韓文',
}

function vocabItem(w: VocabWord): ExamItem {
  const kind = wordKind(w)
  return {
    id: 'v:' + w.ko,
    section: 'vocab',
    label: KIND_PROMPT[kind],
    prompt: kind === 'hanja' ? w.hanja : kind === 'loan' ? w.en : w.meaning,
    answer: w.ko,
    detail: kind === 'native' ? w.roman : `${w.roman}・${w.meaning}`,
    alsoCheck: kind === 'hanja' ? w.meaning : undefined,
    scoring: { kind: 'vocab', ko: w.ko },
  }
}

export const examWords = (weeks: number[], kinds: WordKind[]): VocabWord[] =>
  wordsOfWeeks(weeks.filter((w) => w <= EXAM_LAST_WEEK)).filter((w) => kinds.includes(wordKind(w)))

/** 抽單字：分數低的優先，一輪裡不重複 */
function pickDistinct(words: VocabWord[], scores: Record<string, number>, count: number): VocabWord[] {
  const pool = new Map(words.map((w) => [w.ko, w]))
  const out: VocabWord[] = []
  while (out.length < count && pool.size > 0) {
    const ko = weightedPick([...pool.keys()], scores)
    out.push(pool.get(ko)!)
    pool.delete(ko)
  }
  return out
}

export function vocabSession(words: VocabWord[], scores: Record<string, number>): ExamItem[] {
  return pickDistinct(words, scores, EXAM_SESSION_SIZE).map(vocabItem)
}

// ── 聽力 ──────────────────────────────────────────────────────────

export type ListenMode = 'word' | 'syllable' | 'mix'

export const LISTEN_LABEL: Record<ListenMode, string> = {
  word: '單字',
  syllable: '單一個字',
  mix: '混合',
}

function listenWordItem(w: VocabWord): ExamItem {
  return {
    id: 'l:' + w.ko,
    section: 'listen',
    label: '聽力・寫出聽到的單字',
    speak: w.ko,
    answer: w.ko,
    detail: `${w.roman}・${w.meaning}`,
    scoring: { kind: 'vocab', ko: w.ko },
  }
}

function listenSyllableItem(text: string, parts: string[], targets: string[], roman: string): ExamItem {
  return {
    id: 'ls:' + text,
    section: 'listen',
    label: '聽力・寫出聽到的字',
    speak: text,
    answer: text,
    detail: `${roman}・${parts.join(' + ')}`,
    scoring: { kind: 'letters', targets },
  }
}

export function listenSession(
  mode: ListenMode,
  weeks: number[],
  vocabScores: Record<string, number>,
  letterScores: Record<string, number>,
): ExamItem[] {
  const words = wordsOfWeeks(weeks.filter((w) => w <= EXAM_LAST_WEEK))
  const wordCount = mode === 'word' ? EXAM_SESSION_SIZE : mode === 'syllable' ? 0 : 9
  const items = pickDistinct(words, vocabScores, wordCount).map(listenWordItem)
  const syllables = generateSyllables(
    ALL_CHARS,
    [...SOUND_FINALS],
    letterScores,
    EXAM_SESSION_SIZE - items.length,
  ).map((s) => listenSyllableItem(s.text, s.parts, s.targets, s.roman))
  return shuffle([...items, ...syllables])
}

// ── 造句 ──────────────────────────────────────────────────────────

function sentenceItem(s: ExamSentence): ExamItem {
  return {
    id: s.id,
    section: 'sentence',
    label: `造句・${s.topic}`,
    prompt: s.zh,
    answer: s.ko,
    alts: s.alts?.length ? s.alts : undefined,
    scoring: null,
  }
}

export const sentenceSession = (): ExamItem[] => shuffle(sentenceDrill().map(sentenceItem))

// ── 字母順序 ──────────────────────────────────────────────────────

function rowItem(id: OrderRowId): ExamItem | null {
  const row = ORDER_ROW_BY_ID.get(id)
  if (!row) return null
  return {
    id: 'row:' + id,
    section: 'order',
    label: `照順序寫出 ${row.chars.length} 個${row.title}`,
    answer: row.chars.join(''),
    detail: row.roman.join(' '),
    row: row.chars,
    scoring: null,
  }
}

function blankItem(id: OrderRowId, index: number): ExamItem | null {
  const row = ORDER_ROW_BY_ID.get(id)
  if (!row || !row.chars[index]) return null
  return {
    id: `blank:${id}:${index}`,
    section: 'order',
    label: `${row.title}・？是哪一個`,
    sequence: { chars: row.chars, blank: index },
    answer: row.chars[index],
    detail: `${row.title}第 ${index + 1} 個・${row.roman[index]}`,
    scoring: null,
  }
}

export const rowSession = (rows: OrderRowId[]): ExamItem[] =>
  shuffle(rows).map((id) => rowItem(id)!)

/** 挖空題：錯題本裡的優先，其他隨機 */
export function blankSession(rows: OrderRowId[], wrong: Set<string>): ExamItem[] {
  const all = rows.flatMap((id) =>
    ORDER_ROW_BY_ID.get(id)!.chars.map((_, i) => blankItem(id, i)!),
  )
  const missed = shuffle(all.filter((it) => wrong.has(it.id)))
  const rest = shuffle(all.filter((it) => !wrong.has(it.id)))
  return shuffle([...missed, ...rest].slice(0, EXAM_SESSION_SIZE))
}

// ── 錯題本 ────────────────────────────────────────────────────────

/** 從 id 還原題目；單字被改掉或句子被刪掉的就還原不了，回傳 null */
export function itemFromId(id: string): ExamItem | null {
  const [type, ...rest] = id.split(':')
  const key = rest.join(':')
  switch (type) {
    case 'v': {
      const w = WORD_BY_KO.get(key)
      return w ? vocabItem(w) : null
    }
    case 'l': {
      const w = WORD_BY_KO.get(key)
      return w ? listenWordItem(w) : null
    }
    case 'ls': {
      const d = decomposeSyllable(key)
      return d ? listenSyllableItem(key, d.parts, d.targets, d.roman) : null
    }
    case 's': {
      const sentence = sentenceById(id)
      return sentence ? sentenceItem(sentence) : null
    }
    case 'row':
      return rowItem(key as OrderRowId)
    case 'blank': {
      const [row, index] = rest
      return blankItem(row as OrderRowId, Number(index))
    }
    default:
      return null
  }
}

/** 聽力的單音節題要從字本身拆回字母（錯題本只存了字） */
function decomposeSyllable(text: string): { parts: string[]; targets: string[]; roman: string } | null {
  const d = decompose(text)
  if (!d) return null
  const { initial, medial, final } = d
  return {
    parts: final ? [initial, medial, final] : [initial, medial],
    // 字首不發音的 ㅇ 不算，和 dictation.ts 一樣
    targets: [...new Set([...(initial === SILENT_INITIAL ? [] : [initial]), medial, ...(final ? [final] : [])])],
    roman: romanize(initial, medial, final),
  }
}

// ── 對答案 ────────────────────────────────────────────────────────

/**
 * iPhone 韓文鍵盤連打兩個子音會自己黏成一個（ㄹ + ㅁ → ㄻ），默寫字母時要拆回來，
 * 不然明明照順序打卻被判錯。母音的 ㅗ + ㅏ → ㅘ 是真的複合母音，不拆。
 */
const CLUSTERS: Record<string, string> = {
  ㄳ: 'ㄱㅅ',
  ㄵ: 'ㄴㅈ',
  ㄶ: 'ㄴㅎ',
  ㄺ: 'ㄹㄱ',
  ㄻ: 'ㄹㅁ',
  ㄼ: 'ㄹㅂ',
  ㄽ: 'ㄹㅅ',
  ㄾ: 'ㄹㅌ',
  ㄿ: 'ㄹㅍ',
  ㅀ: 'ㄹㅎ',
  ㅄ: 'ㅂㅅ',
}

const PUNCT = /[\s.,!?、，。！？~]/g

/** 打字模式的單字／句子：忽略空格和標點，只看字對不對 */
const sameText = (typed: string, answer: string): boolean =>
  typed.normalize('NFC').replace(PUNCT, '') === answer.normalize('NFC').replace(PUNCT, '')

/** 空格不一樣（考試會扣分的那種），對了也提醒一下 */
const sameSpacing = (typed: string, answer: string): boolean =>
  typed.trim().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/, '') ===
  answer.trim().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/, '')

export type TypedCheck = 'wrong' | 'right' | 'spacing'

/** 打字模式對答案：答案和其他寫法任一個對就算對；字對但空格不一樣回傳 'spacing' */
export function checkTyped(typed: string, item: ExamItem): TypedCheck {
  const hit = [item.answer, ...(item.alts ?? [])].find((a) => sameText(typed, a))
  if (!hit) return 'wrong'
  return item.section === 'sentence' && !sameSpacing(typed, hit) ? 'spacing' : 'right'
}

/** 整排默寫：拆成一個一個字母，逐格比對 */
export function splitLetters(typed: string): string[] {
  return Array.from(typed.normalize('NFC').replace(PUNCT, '')).flatMap((c) =>
    Array.from(CLUSTERS[c] ?? c),
  )
}
