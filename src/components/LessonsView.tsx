import { useState } from 'react'
import { ALL_CHARS, GROUPS, type LetterGroup } from '../data/groups'
import { LETTER_BY_CHAR, letterSound } from '../data/hangul'
import { speak } from '../lib/speech'
import {
  LEVEL_BADGE,
  LEVEL_BAR,
  LEVEL_LABEL,
  MAX_SCORE,
  isMastered,
  levelOf,
  ratio,
} from '../lib/mastery'
import type { ProgressState } from '../hooks/useProgress'
import { SyllableBuilder } from './SyllableBuilder'

interface Props {
  state: ProgressState
  /** 勾選的組別 */
  groups: number[]
  onToggle: (id: number) => void
  onSet: (ids: number[]) => void
  onPractice: () => void
}

export function LessonsView({ state, groups, onToggle, onSet, onPractice }: Props) {
  const [studying, setStudying] = useState(false)
  const picked = GROUPS.filter((g) => groups.includes(g.id))
  const pickedChars = picked.flatMap((g) => g.chars)

  if (studying && picked.length > 0) {
    return <StudyScreen groups={picked} onBack={() => setStudying(false)} onPractice={onPractice} />
  }

  const masteredTotal = ALL_CHARS.filter((c) => isMastered(state.scores[c])).length
  const pickedMastered = pickedChars.filter((c) => isMastered(state.scores[c])).length

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line/70 bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-3">字母進度</span>
          <span className="text-sm text-ink-2">
            已精通 {masteredTotal} / {ALL_CHARS.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full bg-ok transition-[width]"
            style={{ width: `${(masteredTotal / ALL_CHARS.length) * 100}%` }}
          />
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink-2">要練哪幾組</h2>
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => onSet(GROUPS.map((g) => g.id))}
              className="text-accent"
            >
              全選
            </button>
            <button type="button" onClick={() => onSet([])} className="text-ink-4">
              清除
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {GROUPS.map((group) => {
            const on = groups.includes(group.id)
            const done = group.chars.filter((c) => isMastered(state.scores[c])).length
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onToggle(group.id)}
                aria-pressed={on}
                className={`rounded-xl border p-2.5 text-left active:scale-95 ${
                  on ? 'border-accent bg-accent/20' : 'border-line bg-surface'
                }`}
              >
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className={on ? 'text-accent' : 'text-ink-3'}>第 {group.id} 組</span>
                  <span className="text-ink-4">
                    {done === group.chars.length ? '✓ 精通' : `${done}/${group.chars.length}`}
                  </span>
                </div>
                <div
                  className={`font-kr mt-0.5 text-lg tracking-wider ${on ? 'text-ink' : 'text-ink-2'}`}
                >
                  {group.chars.join('')}
                </div>
                <div className="truncate text-[11px] text-ink-4">{group.title}</div>
              </button>
            )
          })}
        </div>
      </section>

      <div className="rounded-2xl border border-line bg-surface p-4">
        {picked.length === 0 ? (
          <p className="text-sm text-ink-4">還沒勾選任何一組。</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-2">
              已選 {picked.length} 組・共{' '}
              <span className="font-semibold text-ink">{pickedChars.length}</span> 個字母・已精通{' '}
              {pickedMastered} 個
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStudying(true)}
                className="flex-1 rounded-xl border border-line-strong bg-surface-2 py-3 text-sm font-medium text-ink-2 active:bg-surface-3"
              >
                先認識字母
              </button>
              <button
                type="button"
                onClick={onPractice}
                className="flex-1 rounded-xl bg-accent-mid py-3 text-sm font-semibold text-oncolor active:bg-accent-deep"
              >
                練習
              </button>
            </div>
          </>
        )}
      </div>

      {picked.map((group) => (
        <GroupDetail key={group.id} group={group} state={state} />
      ))}
    </div>
  )
}

function GroupDetail({ group, state }: { group: LetterGroup; state: ProgressState }) {
  return (
    <section className="rounded-2xl border border-line/70 bg-surface p-4">
      <div className="flex items-baseline gap-2">
        <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
          第 {group.id} 組
        </span>
        <h2 className="text-base font-semibold text-ink">{group.title}</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-3">{group.note}</p>

      <div className="mt-4 space-y-2">
        {group.chars.map((char) => {
          const letter = LETTER_BY_CHAR.get(char)!
          const score = state.scores[char] ?? 0
          const level = levelOf(score)
          return (
            <button
              key={char}
              type="button"
              onClick={() => speak(letterSound(letter))}
              className="flex w-full items-center gap-3 rounded-xl bg-surface-2 p-2.5 text-left active:bg-surface-3"
            >
              <span className="font-kr w-8 text-center text-2xl text-ink">{char}</span>
              <span className="w-12 text-sm text-accent">{letter.roman}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                <div
                  className={`h-full rounded-full transition-[width] ${LEVEL_BAR[level]}`}
                  style={{ width: `${ratio(score) * 100}%` }}
                />
              </div>
              <span className={`rounded px-1.5 py-0.5 text-[10px] ${LEVEL_BADGE[level]}`}>
                {LEVEL_LABEL[level]}
              </span>
              <span className="w-7 text-right text-[10px] text-ink-4">
                {score}/{MAX_SCORE}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function StudyScreen({
  groups,
  onBack,
  onPractice,
}: {
  groups: LetterGroup[]
  onBack: () => void
  onPractice: () => void
}) {
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm text-ink-3">
        ← 回課程
      </button>

      {groups.map((group) => (
        <section key={group.id} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              第 {group.id} 組・{group.title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">{group.note}</p>
          </div>

          <div className="space-y-3">
            {group.chars.map((char) => {
              const letter = LETTER_BY_CHAR.get(char)!
              return (
                <div key={char} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => speak(letterSound(letter))}
                      className="font-kr flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sunken text-5xl text-ink active:scale-95"
                      aria-label={`播放 ${char} 的發音`}
                    >
                      {char}
                    </button>
                    <div className="min-w-0">
                      <div className="font-kr text-xl font-semibold text-ink">
                        {letterSound(letter)}
                      </div>
                      <div className="text-base text-accent">{letter.roman}</div>
                      <button
                        type="button"
                        onClick={() => speak(letterSound(letter))}
                        className="mt-1 text-xs text-ink-3"
                      >
                        🔊 播放
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">{letter.hint}</p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-3">{letter.mnemonic}</p>
                  {letterSound(letter) !== letter.name && (
                    <p className="mt-2 text-xs leading-relaxed text-ink-4">
                      子音單獨是發不出聲音的，所以用
                      <span className="font-kr text-ink-3">「{letterSound(letter)}」</span>
                      示範 —— 韓國人自己學字母也是這樣念 가나다라마바사。這個字母的名字叫
                      <button
                        type="button"
                        onClick={() => speak(letter.name)}
                        className="font-kr text-ink-3 underline decoration-dotted underline-offset-2"
                      >
                        {letter.name}
                      </button>
                      ，那是名字、不是它的音。
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => speak(letter.example.word)}
                    className="mt-3 flex w-full items-center gap-3 rounded-xl bg-sunken/70 p-2.5 text-left active:bg-sunken"
                  >
                    <span className="font-kr text-lg text-ink">{letter.example.word}</span>
                    <span className="text-xs text-ink-3">{letter.example.roman}</span>
                    <span className="ml-auto text-xs text-ink-2">{letter.example.meaning}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-2">拼拼看</h3>
        <SyllableBuilder chars={ALL_CHARS} />
      </section>

      <button
        type="button"
        onClick={onPractice}
        className="w-full rounded-xl bg-accent-mid py-4 font-semibold text-oncolor active:bg-accent-deep"
      >
        記住了，開始練習
      </button>
    </div>
  )
}
