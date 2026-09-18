/**
 * 一題的共通形狀。字母練習（quiz.ts）和單字測驗（vocabQuiz.ts）出的題目長得一樣，
 * 所以畫面（QuestionCard）可以共用，兩邊只差在題目怎麼生出來、答完要記到哪裡。
 */
import { shuffle } from './mastery'

export interface Option {
  key: string
  label: string
  /** 用韓文字體排版 */
  korean: boolean
}

export interface Question {
  /** 題型代號，只拿來避免連續出一模一樣的題 */
  kind: string
  /** 題目指示，例如「這個字母怎麼念？」 */
  title: string
  /** 大字提示；聽力題沒有文字提示 */
  prompt: string
  promptKorean: boolean
  /** 有值就顯示喇叭鈕 */
  speakText?: string
  /** 題目一出現就自動播放 */
  autoSpeak: boolean
  options: Option[]
  answerKey: string
  /** 這題影響哪些東西的熟練度：字母題是字母，單字題是韓文單字 */
  targets: string[]
  explanation: string
}

/** 湊出 n 個選項：正解 + 不重複的干擾項 */
export function buildOptions(
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
