/**
 * 出題引擎。只會用已解鎖的字母出題，而且每一題都有唯一正確答案。
 * 每題會標記它「考到哪幾個字母」（targets），答完就照這些字母加減熟練度。
 */
import { LETTER_BY_CHAR, quizRoman, type Letter } from '../data/hangul'
import { SILENT_INITIAL } from '../data/groups'
import { shuffle, weightedPick } from './mastery'
import { compose, isInitial, isMedial, romanize } from './syllable'

export type QuestionKind =
  | 'letterToRoman'
  | 'romanToLetter'
  | 'listen'
  | 'syllableToRoman'
  | 'romanToSyllable'
  | 'syllableParts'

export interface Option {
  key: string
  label: string
  /** 用韓文字體排版 */
  korean: boolean
}

export interface Question {
  kind: QuestionKind
  /** 題目指示，例如「這個字母怎麼念？」 */
  title: string
  /** 大字提示；listen 題沒有文字提示 */
  prompt: string
  promptKorean: boolean
  /** 有值就顯示喇叭鈕 */
  speakText?: string
  /** listen 題出現時自動播放 */
  autoSpeak: boolean
  options: Option[]
  answerKey: string
  /** 這題影響哪些字母的熟練度 */
  targets: string[]
  explanation: string
}

export interface QuizContext {
  /** 已解鎖的字母 */
  pool: string[]
  /** 這一輪主攻的字母（通常是目前這組還沒精通的） */
  focus: string[]
  scores: Record<string, number>
  canListen: boolean
}

const letterOf = (char: string): Letter => LETTER_BY_CHAR.get(char)!

/** 湊出 n 個選項：正解 + 不重複的干擾項 */
function buildOptions(
  answer: string,
  candidates: string[],
  korean: boolean,
  n = 4,
): { options: Option[]; answerKey: string } {
  const picked = [answer]
  for (const c of shuffle(candidates)) {
    if (picked.length >= n) break
    if (!picked.includes(c)) picked.push(c)
  }
  return {
    options: shuffle(picked).map((label) => ({ key: label, label, korean })),
    answerKey: answer,
  }
}

// ── 各種題型 ──────────────────────────────────────────────────

function letterToRoman(char: string, pool: string[]): Question {
  const letter = letterOf(char)
  const answer = quizRoman(char)
  const { options, answerKey } = buildOptions(
    answer,
    pool.filter((c) => c !== char).map(quizRoman),
    false,
  )
  return {
    kind: 'letterToRoman',
    title: '這個字母怎麼念？',
    prompt: char,
    promptKorean: true,
    speakText: letter.name,
    autoSpeak: false,
    options,
    answerKey,
    targets: [char],
    explanation: `${char}（${letter.name}）念 ${answer}。${letter.hint}`,
  }
}

function romanToLetter(char: string, pool: string[]): Question {
  const letter = letterOf(char)
  const asked = quizRoman(char)
  const { options, answerKey } = buildOptions(
    char,
    pool.filter((c) => c !== char),
    true,
  )
  return {
    kind: 'romanToLetter',
    title: `哪一個字母念「${asked}」？`,
    prompt: asked,
    promptKorean: false,
    autoSpeak: false,
    options,
    answerKey,
    targets: [char],
    explanation: `${asked} 是 ${char}（${letter.name}）。${letter.mnemonic}`,
  }
}

function listen(char: string, pool: string[]): Question {
  const letter = letterOf(char)
  const { options, answerKey } = buildOptions(
    char,
    pool.filter((c) => c !== char),
    true,
  )
  return {
    kind: 'listen',
    title: '聽聽看，是哪一個字母？',
    prompt: '🔊',
    promptKorean: false,
    speakText: letter.name,
    autoSpeak: true,
    options,
    answerKey,
    targets: [char],
    explanation: `是 ${char}（${letter.name}），念 ${quizRoman(char)}。`,
  }
}

/** 干擾用的音節：只換掉子音或只換掉母音，逼你真的分辨差在哪 */
function syllableVariants(
  initial: string,
  medial: string,
  initials: string[],
  medials: string[],
): { syllable: string; roman: string; initial: string; medial: string }[] {
  const out: { syllable: string; roman: string; initial: string; medial: string }[] = []
  for (const m of medials) {
    if (m === medial) continue
    const s = compose(initial, m)
    if (s) out.push({ syllable: s, roman: romanize(initial, m), initial, medial: m })
  }
  for (const i of initials) {
    if (i === initial) continue
    const s = compose(i, medial)
    if (s) out.push({ syllable: s, roman: romanize(i, medial), initial: i, medial })
  }
  return out
}

function syllableQuestion(
  kind: 'syllableToRoman' | 'romanToSyllable' | 'syllableParts',
  initial: string,
  medial: string,
  initials: string[],
  medials: string[],
  pool: string[],
): Question {
  const syllable = compose(initial, medial)!
  const roman = romanize(initial, medial)
  const variants = syllableVariants(initial, medial, initials, medials)
  // 字首的 ㅇ 不發音，念對音節不代表懂 ㅇ，所以只有「拆字」題才給它分數
  const targets = [initial, medial].filter(
    (c) => pool.includes(c) && (c !== SILENT_INITIAL || kind === 'syllableParts'),
  )

  const silentNote =
    initial === SILENT_INITIAL
      ? `字首的 ㅇ 不發音，只是讓母音有個字可以站，所以 ${syllable} 就念 ${roman}。`
      : `${initial} + ${medial} = ${syllable}，念 ${roman}。`

  if (kind === 'syllableToRoman') {
    const { options, answerKey } = buildOptions(
      roman,
      variants.map((v) => v.roman).filter((r) => r !== roman),
      false,
    )
    return {
      kind,
      title: '這個字怎麼念？',
      prompt: syllable,
      promptKorean: true,
      speakText: syllable,
      autoSpeak: false,
      options,
      answerKey,
      targets,
      explanation: silentNote,
    }
  }

  if (kind === 'romanToSyllable') {
    const { options, answerKey } = buildOptions(
      syllable,
      variants.filter((v) => v.roman !== roman).map((v) => v.syllable),
      true,
    )
    return {
      kind,
      title: `「${roman}」要寫成哪個字？`,
      prompt: roman,
      promptKorean: false,
      autoSpeak: false,
      options,
      answerKey,
      targets,
      explanation: silentNote,
    }
  }

  const label = (i: string, m: string) => `${i} + ${m}`
  const { options, answerKey } = buildOptions(
    label(initial, medial),
    variants.map((v) => label(v.initial, v.medial)),
    true,
  )
  return {
    kind,
    title: '這個字是由哪兩個字母組成的？',
    prompt: syllable,
    promptKorean: true,
    speakText: syllable,
    autoSpeak: false,
    options,
    answerKey,
    targets,
    explanation: silentNote,
  }
}

// ── 組題 ─────────────────────────────────────────────────────

function pickPartner(
  candidates: string[],
  focus: string[],
  scores: Record<string, number>,
): string {
  // 有需要加強的搭檔就優先湊在一起，一題賺兩個字母的分數
  const needy = candidates.filter((c) => focus.includes(c))
  return weightedPick(needy.length > 0 ? needy : candidates, scores)
}

function makeQuestion(ctx: QuizContext): Question {
  const { pool, focus, scores, canListen } = ctx
  const target = weightedPick(focus.length > 0 ? focus : pool, scores)

  const initials = [
    ...new Set([...pool.filter(isInitial), SILENT_INITIAL]),
  ]
  const medials = pool.filter(isMedial)

  const kinds: QuestionKind[] = ['letterToRoman', 'romanToLetter']
  if (canListen) kinds.push('listen')

  const canBuildSyllable =
    medials.length > 0 && (isMedial(target) ? initials.length > 0 : initials.includes(target))
  if (canBuildSyllable) {
    kinds.push('syllableParts')
    if (target !== SILENT_INITIAL) {
      // 拼字題比單字母題有用，多給幾次中獎機會
      kinds.push('syllableToRoman', 'romanToSyllable', 'syllableToRoman', 'romanToSyllable')
    }
  }

  const kind = kinds[Math.floor(Math.random() * kinds.length)]

  if (kind === 'letterToRoman') return letterToRoman(target, pool)
  if (kind === 'romanToLetter') return romanToLetter(target, pool)
  if (kind === 'listen') return listen(target, pool)

  const initial = isMedial(target) ? pickPartner(initials, focus, scores) : target
  const medial = isMedial(target) ? target : pickPartner(medials, focus, scores)
  return syllableQuestion(kind, initial, medial, initials, medials, pool)
}

export function generateSession(ctx: QuizContext, count: number): Question[] {
  const questions: Question[] = []
  let guard = 0
  while (questions.length < count && guard++ < count * 20) {
    const q = makeQuestion(ctx)
    // 至少要有兩個選項才算一題；也避免連續兩題一模一樣
    if (q.options.length < 2) continue
    const prev = questions[questions.length - 1]
    if (prev && prev.kind === q.kind && prev.prompt === q.prompt) continue
    questions.push(q)
  }
  return questions
}
