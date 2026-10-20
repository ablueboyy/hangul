import { useCallback, useEffect, useState } from 'react'
import type { WordKind } from '../data/vocab'
import { ORDER_ROWS, type OrderRowId } from '../data/exam'
import { EXAM_WEEKS, type ListenMode } from '../lib/exam'

export type AnswerMode = 'hand' | 'type'

/**
 * 期中考分頁的偏好和錯題本。錯題本是複習用的暫時清單，考完就沒用了，所以不進備份碼。
 */
const PREFS_KEY = 'hangul.exam.v1'

export interface ExamPrefs {
  answer: AnswerMode
  kinds: WordKind[]
  weeks: number[]
  listen: ListenMode
  rows: OrderRowId[]
  /** 錯題本：答錯的題目 id，見 lib/exam.ts */
  wrong: string[]
}

const DEFAULT_PREFS: ExamPrefs = {
  answer: 'hand',
  kinds: ['hanja', 'loan', 'native'],
  weeks: EXAM_WEEKS,
  listen: 'mix',
  rows: ORDER_ROWS.map((r) => r.id),
  wrong: [],
}

const stringsIn = <T extends string>(value: unknown, allowed: readonly T[]): T[] | null =>
  Array.isArray(value) ? value.filter((v): v is T => allowed.includes(v as T)) : null

function loadPrefs(): ExamPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Partial<Record<keyof ExamPrefs, unknown>>
    return {
      answer: p.answer === 'type' ? 'type' : 'hand',
      kinds: stringsIn(p.kinds, ['hanja', 'loan', 'native'] as const) ?? DEFAULT_PREFS.kinds,
      weeks: Array.isArray(p.weeks)
        ? p.weeks.filter((w): w is number => EXAM_WEEKS.includes(w as number))
        : DEFAULT_PREFS.weeks,
      listen: p.listen === 'word' || p.listen === 'syllable' ? p.listen : 'mix',
      rows: stringsIn(p.rows, ORDER_ROWS.map((r) => r.id)) ?? DEFAULT_PREFS.rows,
      wrong: Array.isArray(p.wrong) ? p.wrong.filter((w): w is string => typeof w === 'string') : [],
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function useExamPrefs() {
  const [prefs, setPrefs] = useState<ExamPrefs>(loadPrefs)

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      // 寫不進去就算了，大不了下次重選
    }
  }, [prefs])

  const update = useCallback((patch: Partial<ExamPrefs>) => setPrefs((p) => ({ ...p, ...patch })), [])

  /** 答錯進錯題本、答對拿掉 */
  const markResult = useCallback(
    (id: string, correct: boolean) =>
      setPrefs((p) => {
        const has = p.wrong.includes(id)
        if (correct && has) return { ...p, wrong: p.wrong.filter((w) => w !== id) }
        if (!correct && !has) return { ...p, wrong: [...p.wrong, id] }
        return p
      }),
    [],
  )

  return { prefs, update, markResult }
}
