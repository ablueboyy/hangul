import { useMemo, useState } from 'react'
import { LETTERS, LETTER_TYPE_LABEL, type Letter, type LetterType } from '../data/hangul'
import { letterSound } from '../data/hangul'
import { speak } from '../lib/speech'
import { LEVEL_BAR, levelOf, ratio } from '../lib/mastery'
import type { ProgressState } from '../hooks/useProgress'
import { LetterSheet } from './LetterSheet'
import { CompareBar, MAX_COMPARE } from './CompareBar'

const ORDER: LetterType[] = ['consonant', 'tenseConsonant', 'vowel', 'compoundVowel']

interface Props {
  state: ProgressState
}

export function ChartView({ state }: Props) {
  const [selected, setSelected] = useState<Letter | null>(null)
  const [picking, setPicking] = useState(false)
  const [compare, setCompare] = useState<string[]>([])

  // 對比模式下點字母是加進 / 拿出對比清單 —— 這裡只是聽，不計分
  const togglePick = (letter: Letter) => {
    if (compare.includes(letter.char)) {
      setCompare(compare.filter((c) => c !== letter.char))
      return
    }
    if (compare.length >= MAX_COMPARE) return
    speak(letterSound(letter))
    setCompare([...compare, letter.char])
  }

  const groups = useMemo(
    () => ORDER.map((type) => ({ type, items: LETTERS.filter((l) => l.type === type) })),
    [],
  )

  return (
    <div className="space-y-7">
      <p className="text-sm leading-relaxed text-ink-3">
        40 個字母的全景圖。點下去會唸出來並打開發音重點。
      </p>

      <CompareBar
        chars={compare}
        onChange={setCompare}
        picking={picking}
        onPickingChange={setPicking}
      />

      {groups.map(({ type, items }) => (
        <section key={type}>
          <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-ink-2">
            {LETTER_TYPE_LABEL[type]}
            <span className="text-xs font-normal text-ink-4">{items.length} 個</span>
          </h2>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
            {items.map((letter) => {
              const score = state.scores[letter.char] ?? 0
              const level = levelOf(score)
              const order = compare.indexOf(letter.char)
              return (
                <button
                  key={letter.char}
                  type="button"
                  onClick={() => {
                    if (picking) {
                      togglePick(letter)
                      return
                    }
                    speak(letterSound(letter))
                    setSelected(letter)
                  }}
                  aria-pressed={picking ? order >= 0 : undefined}
                  className={`relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border active:scale-95 ${
                    picking && order >= 0
                      ? 'border-accent bg-accent/20'
                      : 'border-line/70 bg-surface-2 active:bg-surface-3'
                  }`}
                >
                  {picking && order >= 0 && (
                    <span className="absolute left-1 top-0.5 text-[10px] font-semibold text-accent">
                      {order + 1}
                    </span>
                  )}
                  <span className="font-kr text-3xl leading-none text-ink">{letter.char}</span>
                  <span className="mt-1 text-[10px] text-ink-4">{letter.roman}</span>
                  <span
                    className={`absolute inset-x-0 bottom-0 h-1 ${LEVEL_BAR[level]}`}
                    style={{ transform: `scaleX(${ratio(score)})`, transformOrigin: 'left' }}
                  />
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
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
