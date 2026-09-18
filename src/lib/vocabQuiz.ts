/**
 * 單字測驗的出題引擎。
 *
 * 和字母那套（quiz.ts）刻意分開：字母有解鎖闖關、要考拼音和拆字；
 * 單字只考「看得懂」「說得出」「聽得出」三件事，而且範圍是你自己勾的那幾週。
 *
 * 干擾項一律從同一批被勾選的單字裡抽，所以你分辨的是真正會考的那些字，
 * 不是拿沒學過的字來墊檔。
 */
import type { VocabWord } from '../data/vocab'
import { weightedPick } from './mastery'
import { buildOptions, type Question } from './question'

export interface VocabQuizContext {
  /** 這次測驗範圍內的所有單字 */
  words: VocabWord[]
  /** 單字 → 熟練度，越低越容易被抽到 */
  scores: Record<string, number>
}

type Kind = 'koToMeaning' | 'meaningToKo' | 'listenToKo' | 'listenToMeaning'

const byKo = (words: VocabWord[]) => new Map(words.map((w) => [w.ko, w]))

function makeQuestion(word: VocabWord, words: VocabWord[], kind: Kind): Question {
  const others = words.filter((w) => w.ko !== word.ko)
  const meanings = others.map((w) => w.meaning)
  const koreans = others.map((w) => w.ko)
  const targets = [word.ko]
  const note = `${word.ko}（${word.roman}）= ${word.meaning}`

  if (kind === 'koToMeaning') {
    const { options, answerKey } = buildOptions(word.meaning, meanings, false)
    return {
      kind,
      title: '這個字是什麼意思？',
      prompt: word.ko,
      promptKorean: true,
      speakText: word.ko,
      autoSpeak: false,
      options,
      answerKey,
      targets,
      explanation: note,
    }
  }

  if (kind === 'meaningToKo') {
    const { options, answerKey } = buildOptions(word.ko, koreans, true)
    return {
      kind,
      title: '「' + word.meaning + '」的韓文是哪一個？',
      prompt: word.meaning,
      promptKorean: false,
      autoSpeak: false,
      options,
      answerKey,
      targets,
      explanation: note,
    }
  }

  if (kind === 'listenToKo') {
    const { options, answerKey } = buildOptions(word.ko, koreans, true)
    return {
      kind,
      title: '聽聽看，是哪一個字？',
      prompt: '🔊',
      promptKorean: false,
      speakText: word.ko,
      autoSpeak: true,
      options,
      answerKey,
      targets,
      explanation: note,
    }
  }

  const { options, answerKey } = buildOptions(word.meaning, meanings, false)
  return {
    kind,
    title: '聽聽看，這個字是什麼意思？',
    prompt: '🔊',
    promptKorean: false,
    speakText: word.ko,
    autoSpeak: true,
    options,
    answerKey,
    targets,
    explanation: note,
  }
}

const KINDS: Kind[] = ['koToMeaning', 'meaningToKo', 'listenToKo', 'listenToMeaning']

export function generateVocabSession(ctx: VocabQuizContext, count: number): Question[] {
  const { words, scores } = ctx
  // 只有一個字就湊不出選項，出不了題
  if (words.length < 2) return []

  const lookup = byKo(words)
  const questions: Question[] = []
  let guard = 0
  while (questions.length < count && guard++ < count * 20) {
    const ko = weightedPick(
      words.map((w) => w.ko),
      scores,
    )
    const word = lookup.get(ko)
    if (!word) continue
    const q = makeQuestion(word, words, KINDS[Math.floor(Math.random() * KINDS.length)])
    if (q.options.length < 2) continue
    // 避免連續兩題一模一樣
    const prev = questions[questions.length - 1]
    if (prev && prev.kind === q.kind && prev.prompt === q.prompt) continue
    questions.push(q)
  }
  return questions
}

/** 一輪要出幾題：字少的時候不要硬湊到 12 題，會一直重複 */
export const sessionSize = (wordCount: number): number =>
  Math.min(12, Math.max(4, wordCount))
