/**
 * 把學習進度壓成一段可以複製貼上的備份碼。
 *
 *   HG1-<40 個字母的分數>-<解鎖組數>-<連續天數>-<最後練習日>-<總題數>-<答對數>-<檢查碼>
 *
 * 檢查碼是為了讓貼錯 / 少複製到的碼直接被擋下來，而不是安靜地載入一份壞掉的進度。
 */
import type { ProgressState } from '../hooks/useProgress'
import { GROUPS } from '../data/groups'
import { MAX_SCORE } from './mastery'

const VERSION = 'HG1'

/**
 * 備份碼裡分數的排列順序。
 * ⚠️ 這個陣列一旦上線就不能改動或重排，否則舊的備份碼會對到錯的字母。
 * 要加字母只能往後面接。
 */
const BACKUP_ORDER = [
  'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
  'ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ',
  'ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ',
  'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ',
] as const

function checksum(payload: string): string {
  let h = 0
  for (let i = 0; i < payload.length; i++) h = (Math.imul(h, 31) + payload.charCodeAt(i)) >>> 0
  return h.toString(36).slice(-4).padStart(4, '0')
}

const toBase36 = (n: number): string => Math.max(0, Math.floor(n)).toString(36)

const fromBase36 = (s: string): number | null => {
  if (!/^[0-9a-z]+$/.test(s)) return null
  const n = parseInt(s, 36)
  return Number.isFinite(n) ? n : null
}

/** 'YYYY-MM-DD' ⇄ 'YYYYMMDD'，沒有日期就用 '0' */
const packDate = (d: string | null): string => (d ? d.replace(/-/g, '') : '0')

function unpackDate(s: string): string | null {
  if (s === '0') return null
  if (!/^\d{8}$/.test(s)) return null
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

export function encodeBackup(state: ProgressState): string {
  const scores = BACKUP_ORDER.map((char) =>
    String(Math.max(0, Math.min(MAX_SCORE, state.scores[char] ?? 0))),
  ).join('')

  const parts = [
    VERSION,
    scores,
    String(state.unlockedCount),
    toBase36(state.streak),
    packDate(state.lastStudyDate),
    toBase36(state.totalAnswers),
    toBase36(state.totalCorrect),
  ]
  return [...parts, checksum(parts.join('-'))].join('-')
}

export type DecodeResult =
  | { ok: true; state: ProgressState }
  | { ok: false; error: string }

export function decodeBackup(raw: string): DecodeResult {
  // 從備忘錄貼回來常常會夾帶空白或換行
  const code = raw.trim().replace(/\s+/g, '')
  if (!code) return { ok: false, error: '請先貼上備份碼。' }

  const parts = code.split('-')
  if (parts.length !== 8) return { ok: false, error: '備份碼格式不對，可能沒有複製完整。' }

  const [version, scores, unlocked, streak, date, answers, correct, sum] = parts
  if (version !== VERSION) return { ok: false, error: `認不得的備份碼版本「${version}」。` }
  if (checksum(parts.slice(0, 7).join('-')) !== sum)
    return { ok: false, error: '備份碼檢查碼對不上，可能貼到一半或改到內容。' }

  if (scores.length !== BACKUP_ORDER.length || !/^[0-6]+$/.test(scores))
    return { ok: false, error: '備份碼裡的分數壞掉了。' }

  const unlockedCount = Number(unlocked)
  if (!Number.isInteger(unlockedCount) || unlockedCount < 1 || unlockedCount > GROUPS.length)
    return { ok: false, error: '備份碼裡的解鎖組數不合理。' }

  const streakN = fromBase36(streak)
  const answersN = fromBase36(answers)
  const correctN = fromBase36(correct)
  if (streakN === null || answersN === null || correctN === null)
    return { ok: false, error: '備份碼裡的統計數字壞掉了。' }

  const lastStudyDate = date === '0' ? null : unpackDate(date)
  if (date !== '0' && lastStudyDate === null)
    return { ok: false, error: '備份碼裡的日期壞掉了。' }

  const restored: Record<string, number> = {}
  BACKUP_ORDER.forEach((char, i) => {
    const score = Number(scores[i])
    if (score > 0) restored[char] = score
  })

  return {
    ok: true,
    state: {
      scores: restored,
      unlockedCount,
      lastStudyDate,
      streak: streakN,
      totalAnswers: answersN,
      totalCorrect: correctN,
      lastBackupAt: Date.now(),
    },
  }
}

/** 給還原前的預覽用 */
export function describe(state: ProgressState): string {
  const mastered = Object.values(state.scores).filter((s) => s >= MAX_SCORE).length
  return `第 ${state.unlockedCount} 組・已精通 ${mastered} 個字母・答過 ${state.totalAnswers} 題`
}
