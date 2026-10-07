import { useCallback, useEffect, useState } from 'react'
import { GROUPS } from '../data/groups'
import { nextScore } from '../lib/mastery'

const STORAGE_KEY = 'hangul.progress.v2'

export interface ProgressState {
  /** 字母 → 熟練度分數 0..MAX_SCORE */
  scores: Record<string, number>
  /** 單字（韓文原文）→ 熟練度分數 0..MAX_SCORE */
  vocabScores: Record<string, number>
  /**
   * 以前闖關制「解鎖到第幾組」，現在字母全開、不會再變了。
   * 留著是因為備份碼格式裡有這一格，另外第一次打開選組畫面時拿來決定預設勾哪幾組。
   */
  unlockedCount: number
  /** YYYY-MM-DD */
  lastStudyDate: string | null
  streak: number
  totalAnswers: number
  totalCorrect: number
  /** 上次匯出備份碼的時間，只存在本機，不進備份碼本身 */
  lastBackupAt: number | null
}

const emptyState = (): ProgressState => ({
  scores: {},
  vocabScores: {},
  unlockedCount: 1,
  lastStudyDate: null,
  streak: 0,
  totalAnswers: 0,
  totalCorrect: 0,
  lastBackupAt: null,
})

const dateKey = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const yesterdayKey = (): string => dateKey(new Date(Date.now() - 24 * 60 * 60 * 1000))

function load(): ProgressState {
  if (typeof localStorage === 'undefined') return emptyState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    return {
      ...emptyState(),
      ...parsed,
      scores: parsed.scores ?? {},
      vocabScores: parsed.vocabScores ?? {},
      unlockedCount: Math.min(Math.max(parsed.unlockedCount ?? 1, 1), GROUPS.length),
    }
  } catch {
    // 存檔壞了就當作全新開始，不要讓整個 App 掛掉
    return emptyState()
  }
}

/** 答完一題共通的部分：連續天數和總計，字母題和單字題都要算 */
function tally(prev: ProgressState, correct: boolean): ProgressState {
  const today = dateKey()
  const streak =
    prev.lastStudyDate === today
      ? prev.streak
      : prev.lastStudyDate === yesterdayKey()
        ? prev.streak + 1
        : 1
  return {
    ...prev,
    lastStudyDate: today,
    streak,
    totalAnswers: prev.totalAnswers + 1,
    totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
  }
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 無痕模式之類的情況寫不進去，忽略即可
    }
  }, [state])

  /** 答完一題字母題：把這題考到的每個字母都加減分 */
  const record = useCallback((targets: string[], correct: boolean) => {
    setState((prev) => {
      const scores = { ...prev.scores }
      for (const char of targets) scores[char] = nextScore(scores[char], correct)
      return { ...tally(prev, correct), scores }
    })
  }, [])

  /** 答完一題單字題 */
  const recordVocab = useCallback((words: string[], correct: boolean) => {
    setState((prev) => {
      const vocabScores = { ...prev.vocabScores }
      for (const ko of words) vocabScores[ko] = nextScore(vocabScores[ko], correct)
      return { ...tally(prev, correct), vocabScores }
    })
  }, [])

  const reset = useCallback(() => setState(emptyState()), [])

  /** 從備份碼還原：整份取代掉現在的進度 */
  const restore = useCallback((next: ProgressState) => setState(next), [])

  const markBackedUp = useCallback(
    () => setState((prev) => ({ ...prev, lastBackupAt: Date.now() })),
    [],
  )

  return {
    state,
    record,
    recordVocab,
    reset,
    restore,
    markBackedUp,
  }
}
