import { useMemo, useState } from 'react'
import { GROUPS } from '../data/groups'
import { LETTER_BY_CHAR } from '../data/hangul'
import { speak } from '../lib/speech'
import { LEVEL_BADGE, LEVEL_LABEL, MAX_SCORE, SCORE_FAMILIAR, type Level } from '../lib/mastery'
import type { ProgressState } from '../hooks/useProgress'
import { BackupSection } from './BackupSection'
import { ThemePicker } from './ThemeToggle'
import type { ThemePref } from '../hooks/useTheme'

interface Props {
  state: ProgressState
  unlockedChars: string[]
  onReset: () => void
  onRestore: (next: ProgressState) => void
  onBackedUp: () => void
  themePref: ThemePref
  onThemeChange: (next: ThemePref) => void
}

const TOTAL_LETTERS = GROUPS.reduce((n, g) => n + g.chars.length, 0)

const LEVEL_FILL: Record<Level, string> = {
  mastered: 'bg-ok',
  familiar: 'bg-accent',
  novice: 'bg-ink-4',
  locked: 'bg-surface-2',
}

const LEVEL_ORDER: Level[] = ['mastered', 'familiar', 'novice', 'locked']

export function ProgressView({
  state,
  unlockedChars,
  onReset,
  onRestore,
  onBackedUp,
  themePref,
  onThemeChange,
}: Props) {
  const [confirming, setConfirming] = useState(false)

  const buckets = useMemo(() => {
    const counts: Record<Level, number> = { locked: 0, novice: 0, familiar: 0, mastered: 0 }
    for (const group of GROUPS) {
      for (const char of group.chars) {
        if (!unlockedChars.includes(char)) {
          counts.locked++
          continue
        }
        const score = state.scores[char] ?? 0
        if (score >= MAX_SCORE) counts.mastered++
        else if (score >= SCORE_FAMILIAR) counts.familiar++
        else counts.novice++
      }
    }
    return counts
  }, [state.scores, unlockedChars])

  // 已解鎖但還沒精通的，就是現在最該補的
  const weakest = useMemo(
    () =>
      unlockedChars
        .map((char) => ({ char, score: state.scores[char] ?? 0 }))
        .filter((x) => x.score < MAX_SCORE)
        .sort((a, b) => a.score - b.score)
        .slice(0, 8),
    [state.scores, unlockedChars],
  )

  const accuracy =
    state.totalAnswers > 0 ? Math.round((state.totalCorrect / state.totalAnswers) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="已精通" value={`${buckets.mastered}`} unit={`/ ${TOTAL_LETTERS}`} />
        <Stat label="連續天數" value={`${state.streak}`} unit="天" />
        <Stat label="總正確率" value={`${accuracy}`} unit="%" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-2">字母分布</h2>
        <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
          {LEVEL_ORDER.map((level) => (
            <div
              key={level}
              className={LEVEL_FILL[level]}
              style={{ width: `${(buckets[level] / TOTAL_LETTERS) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {LEVEL_ORDER.map((level) => (
            <div key={level} className="flex items-center gap-2 text-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${LEVEL_FILL[level]}`} />
              <span className="text-ink-3">{LEVEL_LABEL[level]}</span>
              <span className="ml-auto text-ink-2">{buckets[level]}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-2">現在最該補的字母</h2>
        {weakest.length === 0 ? (
          <p className="text-sm text-ink-4">已解鎖的字母全部精通了，去「課程」開下一組吧。</p>
        ) : (
          <div className="space-y-2">
            {weakest.map(({ char, score }) => {
              const letter = LETTER_BY_CHAR.get(char)!
              const level: Level = score >= SCORE_FAMILIAR ? 'familiar' : 'novice'
              return (
                <button
                  key={char}
                  type="button"
                  onClick={() => speak(letter.name)}
                  className="flex w-full items-center gap-3 rounded-xl bg-surface p-3 text-left active:bg-surface-3"
                >
                  <span className="font-kr w-9 text-center text-2xl text-ink">{char}</span>
                  <span className="text-sm text-accent">{letter.roman}</span>
                  <span
                    className={`ml-auto rounded px-1.5 py-0.5 text-[10px] ${LEVEL_BADGE[level]}`}
                  >
                    {LEVEL_LABEL[level]}
                  </span>
                  <span className="w-9 text-right text-xs text-ink-4">
                    {score}/{MAX_SCORE}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <ThemePicker pref={themePref} onChange={onThemeChange} />

      <BackupSection state={state} onRestore={onRestore} onBackedUp={onBackedUp} />

      <section className="border-t border-line-soft pt-5">
        <p className="mb-3 text-xs text-ink-4">
          總共答過 {state.totalAnswers} 題。清除之前記得先匯出備份碼。
        </p>
        {confirming ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onReset()
                setConfirming(false)
              }}
              className="flex-1 rounded-xl bg-bad-deep py-3 text-sm font-medium text-oncolor"
            >
              確定清除
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-xl bg-surface-2 py-3 text-sm text-ink-2"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full rounded-xl bg-surface-2 py-3 text-sm text-ink-3 active:bg-surface-3"
          >
            清除所有學習紀錄，從第 1 組重來
          </button>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-line/70 bg-surface p-3 text-center">
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="text-[10px] text-ink-4">{unit}</div>
      <div className="mt-1 text-xs text-ink-3">{label}</div>
    </div>
  )
}
