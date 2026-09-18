import { useCallback, useEffect, useMemo, useState } from 'react'
import { GROUPS, charsUpTo } from '../data/groups'
import { isMastered, nextScore } from '../lib/mastery'

const STORAGE_KEY = 'hangul.progress.v2'

export interface ProgressState {
  /** 字母 → 熟練度分數 0..MAX_SCORE */
  scores: Record<string, number>
  /** 單字（韓文原文）→ 熟練度分數 0..MAX_SCORE。和字母的解鎖闖關無關 */
  vocabScores: Record<string, number>
  /** 已解鎖幾組（至少 1） */
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

/**
 * 目前這組全部精通就解鎖下一組。
 * unlockedCount 只增不減 —— 舊字母之後掉分不會把已開的組收回去。
 */
function unlockIfComplete(state: ProgressState): number {
  const current = GROUPS[state.unlockedCount - 1]
  if (!current) return state.unlockedCount
  const done = current.chars.every((c) => isMastered(state.scores[c]))
  return done ? Math.min(state.unlockedCount + 1, GROUPS.length) : state.unlockedCount
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
      const next = { ...tally(prev, correct), scores }
      return { ...next, unlockedCount: unlockIfComplete(next) }
    })
  }, [])

  /** 答完一題單字題。單字不參與字母的解鎖闖關，所以不動 unlockedCount */
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

  const unlockedChars = useMemo(() => charsUpTo(state.unlockedCount), [state.unlockedCount])
  const isUnlocked = useCallback(
    (char: string) => unlockedChars.includes(char),
    [unlockedChars],
  )

  /** 目前正在練的那一組（全部通關後停在最後一組） */
  const currentGroup = GROUPS[state.unlockedCount - 1]
  const allDone = currentGroup.chars.every((c) => isMastered(state.scores[c]))

  return {
    state,
    record,
    recordVocab,
    reset,
    restore,
    markBackedUp,
    unlockedChars,
    isUnlocked,
    currentGroup,
    allDone,
  }
}
