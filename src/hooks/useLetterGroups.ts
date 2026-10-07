import { useEffect, useState } from 'react'
import { GROUPS } from '../data/groups'

/**
 * 字母練習勾選的組別。和單字的週數一樣是介面偏好，不算學習進度，不進備份碼。
 */
const GROUPS_KEY = 'hangul.letters.groups.v1'

function loadGroups(fallback: number[]): number[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return fallback
    return parsed.filter((g): g is number => typeof g === 'number' && g >= 1 && g <= GROUPS.length)
  } catch {
    return fallback
  }
}

/**
 * @param initial 第一次打開（還沒存過勾選）時預設勾哪幾組 ——
 *   從闖關制升級上來的人，就沿用他原本解鎖到的那幾組
 */
export function useLetterGroups(initial: number[]) {
  const [groups, setGroups] = useState<number[]>(() => loadGroups(initial))

  useEffect(() => {
    try {
      localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
    } catch {
      // 寫不進去就算了，大不了下次重勾一遍
    }
  }, [groups])

  const toggle = (id: number) =>
    setGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id].sort((a, b) => a - b),
    )

  return { groups, setGroups, toggle }
}
