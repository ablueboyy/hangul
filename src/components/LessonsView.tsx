import { useState } from 'react'
import { GROUPS, type LetterGroup } from '../data/groups'
import { LETTER_BY_CHAR } from '../data/hangul'
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
  currentGroup: LetterGroup
  unlockedChars: string[]
  onPractice: () => void
}

export function LessonsView({ state, currentGroup, unlockedChars, onPractice }: Props) {
  const [studying, setStudying] = useState(false)

  if (studying) {
    return (
      <StudyScreen
        group={currentGroup}
        unlockedChars={unlockedChars}
        onBack={() => setStudying(false)}
        onPractice={onPractice}
      />
    )
  }

  const masteredTotal = GROUPS.flatMap((g) => g.chars).filter((c) =>
    isMastered(state.scores[c]),
  ).length

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line/70 bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-3">課程進度</span>
          <span className="text-sm text-ink-2">
            第 {state.unlockedCount} / {GROUPS.length} 組
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full bg-ok transition-[width]"
            style={{ width: `${(masteredTotal / 40) * 100}%` }}
          />
        </div>
        <div className="mt-1.5 text-xs text-ink-4">已精通 {masteredTotal} / 40 個字母</div>
      </div>

      {GROUPS.map((group) => {
        if (group.id < state.unlockedCount) {
          return <DoneGroup key={group.id} group={group} state={state} />
        }
        if (group.id === state.unlockedCount) {
          return (
            <CurrentGroup
              key={group.id}
              group={group}
              state={state}
              onStudy={() => setStudying(true)}
              onPractice={onPractice}
            />
          )
        }
        return <LockedGroup key={group.id} group={group} />
      })}
    </div>
  )
}

function CurrentGroup({
  group,
  state,
  onStudy,
  onPractice,
}: {
  group: LetterGroup
  state: ProgressState
  onStudy: () => void
  onPractice: () => void
}) {
  const remaining = group.chars.filter((c) => !isMastered(state.scores[c]))

  return (
    <section className="rounded-2xl border border-accent/60 bg-accent/10 p-4">
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
          const level = levelOf(score, true)
          return (
            <button
              key={char}
              type="button"
              onClick={() => speak(letter.name)}
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

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onStudy}
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

      <p className="mt-2 text-center text-[11px] text-ink-4">
        {remaining.length > 0
          ? `還有 ${remaining.length} 個沒到精通，全部精通就解鎖下一組`
          : '這組已全部精通 🎉'}
      </p>
    </section>
  )
}

function DoneGroup({ group, state }: { group: LetterGroup; state: ProgressState }) {
  return (
    <section className="rounded-2xl border border-line-soft bg-surface/60 p-3">
      <div className="flex items-center gap-2">
        <span className="text-ok">✓</span>
        <span className="text-xs text-ink-3">
          第 {group.id} 組・{group.title}
        </span>
        <div className="ml-auto flex gap-1.5">
          {group.chars.map((char) => {
            const level = levelOf(state.scores[char], true)
            return (
              <span
                key={char}
                className={`font-kr flex h-7 w-7 items-center justify-center rounded-md text-base ${LEVEL_BADGE[level]}`}
                title={LEVEL_LABEL[level]}
              >
                {char}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function LockedGroup({ group }: { group: LetterGroup }) {
  return (
    <section className="rounded-2xl border border-line-soft bg-sunken/50 p-3">
      <div className="flex items-center gap-2">
        <span className="text-ink-5">🔒</span>
        <span className="text-xs text-ink-5">第 {group.id} 組</span>
        <div className="font-kr ml-auto text-base tracking-widest text-ink-5 blur-[2px] select-none">
          {group.chars.join('')}
        </div>
      </div>
    </section>
  )
}

function StudyScreen({
  group,
  unlockedChars,
  onBack,
  onPractice,
}: {
  group: LetterGroup
  unlockedChars: string[]
  onBack: () => void
  onPractice: () => void
}) {
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm text-ink-3">
        ← 回課程
      </button>

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
                  onClick={() => speak(letter.name)}
                  className="font-kr flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sunken text-5xl text-ink active:scale-95"
                  aria-label={`播放 ${char} 的發音`}
                >
                  {char}
                </button>
                <div className="min-w-0">
                  <div className="font-kr text-xl font-semibold text-ink">{letter.name}</div>
                  <div className="text-base text-accent">{letter.roman}</div>
                  <button
                    type="button"
                    onClick={() => speak(letter.name)}
                    className="mt-1 text-xs text-ink-3"
                  >
                    🔊 播放
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{letter.hint}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-3">{letter.mnemonic}</p>
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

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-2">拼拼看</h3>
        <SyllableBuilder unlockedChars={unlockedChars} />
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
