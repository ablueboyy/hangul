/**
 * 熟練度：解鎖後從 0 分開始爬，答對 +1、答錯 −1，滿分 6 分＝精通。
 * 一組 5 個字母全部精通，下一組才會解鎖。
 * 已解鎖的組不會因為舊字母掉分而重新上鎖 —— 掉分只是提醒你回頭補。
 */

export const MAX_SCORE = 6
export const SCORE_FAMILIAR = 3

export type Level = 'locked' | 'novice' | 'familiar' | 'mastered'

export const LEVEL_LABEL: Record<Level, string> = {
  locked: '未解鎖',
  novice: '入門',
  familiar: '認識',
  mastered: '精通',
}

/** 給徽章用的 Tailwind class */
export const LEVEL_BADGE: Record<Level, string> = {
  locked: 'bg-slate-800 text-slate-500',
  novice: 'bg-slate-700 text-slate-300',
  familiar: 'bg-sky-500/20 text-sky-300',
  mastered: 'bg-emerald-500/20 text-emerald-300',
}

export const LEVEL_BAR: Record<Level, string> = {
  locked: 'bg-slate-700',
  novice: 'bg-slate-500',
  familiar: 'bg-sky-500',
  mastered: 'bg-emerald-500',
}

export function levelOf(score: number | undefined, unlocked: boolean): Level {
  if (!unlocked) return 'locked'
  const s = score ?? 0
  if (s >= MAX_SCORE) return 'mastered'
  if (s >= SCORE_FAMILIAR) return 'familiar'
  return 'novice'
}

export const nextScore = (score: number | undefined, correct: boolean): number =>
  Math.max(0, Math.min(MAX_SCORE, (score ?? 0) + (correct ? 1 : -1)))

export const isMastered = (score: number | undefined): boolean => (score ?? 0) >= MAX_SCORE

export const ratio = (score: number | undefined): number =>
  Math.max(0, Math.min(1, (score ?? 0) / MAX_SCORE))

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** 分數越低越容易被抽中出題 */
export function weightedPick(chars: string[], scores: Record<string, number>): string {
  const weights = chars.map((c) => MAX_SCORE + 1 - (scores[c] ?? 0))
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (let i = 0; i < chars.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return chars[i]
  }
  return chars[chars.length - 1]
}
