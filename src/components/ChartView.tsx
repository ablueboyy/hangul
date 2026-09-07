import { useMemo, useState } from 'react'
import { LETTERS, LETTER_TYPE_LABEL, type Letter, type LetterType } from '../data/hangul'
import { speak } from '../lib/speech'
import { LEVEL_BAR, levelOf, ratio } from '../lib/mastery'
import type { ProgressState } from '../hooks/useProgress'
import { LetterSheet } from './LetterSheet'

const ORDER: LetterType[] = ['consonant', 'tenseConsonant', 'vowel', 'compoundVowel']

interface Props {
  state: ProgressState
  isUnlocked: (char: string) => boolean
}

export function ChartView({ state, isUnlocked }: Props) {
  const [selected, setSelected] = useState<Letter | null>(null)

  const groups = useMemo(
    () => ORDER.map((type) => ({ type, items: LETTERS.filter((l) => l.type === type) })),
    [],
  )

  return (
    <div className="space-y-7">
      <p className="text-sm leading-relaxed text-slate-400">
        40 個字母的全景圖。已解鎖的點下去會唸出來並打開發音重點，還沒解鎖的會告訴你在第幾組。
      </p>

      {groups.map(({ type, items }) => (
        <section key={type}>
          <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-slate-300">
            {LETTER_TYPE_LABEL[type]}
            <span className="text-xs font-normal text-slate-500">
              {items.filter((l) => isUnlocked(l.char)).length} / {items.length} 已解鎖
            </span>
          </h2>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
            {items.map((letter) => {
              const unlocked = isUnlocked(letter.char)
              const score = state.scores[letter.char] ?? 0
              const level = levelOf(score, unlocked)
              return (
                <button
                  key={letter.char}
                  type="button"
                  onClick={() => {
                    if (unlocked) speak(letter.name)
                    setSelected(letter)
                  }}
                  className={`relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border active:scale-95 ${
                    unlocked
                      ? 'border-slate-700/70 bg-slate-800/70 active:bg-slate-700'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <span
                    className={`font-kr text-3xl leading-none ${
                      unlocked ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {letter.char}
                  </span>
                  <span className="mt-1 text-[10px] text-slate-500">
                    {unlocked ? letter.roman : '🔒'}
                  </span>
                  {unlocked && (
                    <span
                      className={`absolute inset-x-0 bottom-0 h-1 ${LEVEL_BAR[level]}`}
                      style={{ transform: `scaleX(${ratio(score)})`, transformOrigin: 'left' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {selected && (
        <LetterSheet
          letter={selected}
          score={state.scores[selected.char] ?? 0}
          unlocked={isUnlocked(selected.char)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
