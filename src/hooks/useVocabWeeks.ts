import { useEffect, useState } from 'react'
import { TOTAL_WEEKS } from '../data/vocab'

/**
 * 勾選的週數存在自己的 key 裡 —— 它是介面偏好，不算學習進度，不進備份碼。
 * 單字測驗和聽寫共用同一組勾選，換分頁不用重勾。
 */
const WEEKS_KEY = 'hangul.vocab.weeks.v1'

function loadWeeks(): number[] {
  try {
    const raw = localStorage.getItem(WEEKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((w): w is number => typeof w === 'number' && w >= 1 && w <= TOTAL_WEEKS)
  } catch {
    return []
  }
}

export function useVocabWeeks() {
  const [weeks, setWeeks] = useState<number[]>(loadWeeks)

  useEffect(() => {
    try {
      localStorage.setItem(WEEKS_KEY, JSON.stringify(weeks))
    } catch {
      // 寫不進去就算了，大不了下次重勾一遍
    }
  }, [weeks])

  const toggle = (week: number) =>
    setWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week].sort((a, b) => a - b),
    )

  return { weeks, setWeeks, toggle }
}
