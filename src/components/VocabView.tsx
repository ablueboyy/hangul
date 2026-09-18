import { useCallback, useEffect, useMemo, useState } from 'react'
import { TOTAL_WEEKS, VOCAB_WEEKS, WORD_BY_KO, wordsOfWeeks, type VocabWord } from '../data/vocab'
import {
  LEVEL_BADGE,
  LEVEL_BAR,
  LEVEL_LABEL,
  MAX_SCORE,
  isMastered,
  levelOf,
  ratio,
} from '../lib/mastery'
import { generateVocabSession, sessionSize } from '../lib/vocabQuiz'
import type { Question } from '../lib/question'
import { speak, unlock } from '../lib/speech'
import { QuestionCard } from './QuestionCard'
import type { ProgressState } from '../hooks/useProgress'

/** 勾選的週數存在自己的 key 裡 —— 它是介面偏好，不算學習進度，不進備份碼 */
const WEEKS_KEY = 'hangul.vocab.weeks.v1'

interface Props {
  state: ProgressState
  recordVocab: (words: string[], correct: boolean) => void
}

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

interface Session {
  questions: Question[]
  /** 開場時各單字的分數，結算時拿來比對誰進步了 */
  before: Record<string, number>
}

export function VocabView({ state, recordVocab }: Props) {
  const [weeks, setWeeks] = useState<number[]>(loadWeeks)
  const [session, setSession] = useState<Session | null>(null)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  useEffect(() => {
    try {
      localStorage.setItem(WEEKS_KEY, JSON.stringify(weeks))
    } catch {
      // 寫不進去就算了，大不了下次重勾一遍
    }
  }, [weeks])

  const words = useMemo(() => wordsOfWeeks(weeks), [weeks])

  const toggle = (week: number) =>
    setWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week].sort((a, b) => a - b),
    )

  const start = useCallback(() => {
    unlock()
    const questions = generateVocabSession(
      { words, scores: state.vocabScores },
      sessionSize(words.length),
    )
    if (questions.length === 0) return
    setSession({ questions, before: { ...state.vocabScores } })
    setIndex(0)
    setPicked(null)
    setCorrectCount(0)
  }, [words, state.vocabScores])

  const question = session?.questions[index]

  // 聽力題一出現就自動播放
  useEffect(() => {
    if (question?.autoSpeak && question.speakText) speak(question.speakText)
  }, [question])

  const choose = (key: string) => {
    if (picked || !question) return
    const correct = key === question.answerKey
    setPicked(key)
    if (correct) setCorrectCount((c) => c + 1)
    recordVocab(question.targets, correct)
    if (question.speakText) speak(question.speakText)
  }

  // ── 測驗結果 ────────────────────────────────────────────────
  if (session && index >= session.questions.length) {
    return (
      <VocabSummary
        session={session}
        state={state}
        correctCount={correctCount}
        onAgain={start}
        onExit={() => setSession(null)}
      />
    )
  }

  // ── 測驗中 ──────────────────────────────────────────────────
  if (session && question) {
    return (
      <QuestionCard
        question={question}
        index={index}
        total={session.questions.length}
        picked={picked}
        onPick={choose}
        onNext={() => {
          setIndex((i) => i + 1)
          setPicked(null)
        }}
        onExit={() => setSession(null)}
      />
    )
  }

  // ── 選週數 ──────────────────────────────────────────────────
  const mastered = words.filter((w) => isMastered(state.vocabScores[w.ko])).length
  const available = VOCAB_WEEKS.filter((w) => w.words.length > 0).map((w) => w.week)

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-ink-3">
        課程每週的單字庫。勾選這次要測驗的週數（可以複選），會考「看字選意思」「看意思選字」
        和兩種聽力題。干擾選項只會從你勾選的範圍裡抽，所以你分辨的是真正會考的那幾個字。
      </p>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink-2">要測驗哪幾週</h2>
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={() => setWeeks(available)} className="text-accent">
              全選
            </button>
            <button type="button" onClick={() => setWeeks([])} className="text-ink-4">
              清除
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {VOCAB_WEEKS.map((w) => {
            const empty = w.words.length === 0
            const on = weeks.includes(w.week)
            return (
              <button
                key={w.week}
                type="button"
                disabled={empty}
                onClick={() => toggle(w.week)}
                aria-pressed={on}
                className={`flex flex-col items-center rounded-xl border py-2 text-[11px] active:scale-95 ${
                  empty
                    ? 'border-line-soft bg-sunken/70 text-ink-5'
                    : on
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-line bg-surface text-ink-2'
                }`}
              >
                <span className="text-sm font-semibold">第 {w.week} 週</span>
                <span>{empty ? '未建立' : w.words.length + ' 字'}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="rounded-2xl border border-line bg-surface p-4">
        {words.length === 0 ? (
          <p className="text-sm text-ink-4">還沒勾選任何一週。</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-2">
              已選 {weeks.length} 週・共 <span className="font-semibold text-ink">{words.length}</span>{' '}
              個單字・已精通 {mastered} 個
            </p>
            <button
              type="button"
              disabled={words.length < 2}
              onClick={start}
              className="mt-3 w-full rounded-xl bg-accent-mid py-3 font-semibold text-oncolor active:bg-accent-deep disabled:opacity-50"
            >
              {words.length < 2
                ? '至少要兩個單字才出得了題'
                : '開始測驗（' + sessionSize(words.length) + ' 題）'}
            </button>
          </>
        )}
      </div>

      {weeks.map((week) => {
        const w = VOCAB_WEEKS.find((v) => v.week === week)
        if (!w || w.words.length === 0) return null
        return (
          <section key={week}>
            <h3 className="mb-1 text-sm font-semibold text-ink-2">
              第 {w.week} 週 <span className="font-normal text-ink-4">{w.words.length} 字</span>
            </h3>
            {w.note && <p className="mb-2 text-xs leading-relaxed text-ink-4">{w.note}</p>}
            <div className="space-y-2">
              {w.words.map((word) => (
                <WordRow key={word.ko} word={word} score={state.vocabScores[word.ko] ?? 0} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function WordRow({ word, score }: { word: VocabWord; score: number }) {
  const level = levelOf(score, true)
  return (
    <button
      type="button"
      onClick={() => speak(word.ko)}
      className="flex w-full items-center gap-3 rounded-xl bg-surface p-3 text-left active:bg-surface-3"
      aria-label={'播放 ' + word.ko + ' 的發音'}
    >
      <span className="font-kr w-20 shrink-0 text-xl text-ink">{word.ko}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-ink-2">{word.meaning}</div>
        <div className="text-xs text-ink-4">{word.roman}</div>
      </div>
      <div className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-sunken">
        <div
          className={`h-full rounded-full transition-[width] ${LEVEL_BAR[level]}`}
          style={{ width: `${ratio(score) * 100}%` }}
        />
      </div>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${LEVEL_BADGE[level]}`}>
        {LEVEL_LABEL[level]}
      </span>
    </button>
  )
}

function VocabSummary({
  session,
  state,
  correctCount,
  onAgain,
  onExit,
}: {
  session: Session
  state: ProgressState
  correctCount: number
  onAgain: () => void
  onExit: () => void
}) {
  const total = session.questions.length
  const touched = [...new Set(session.questions.flatMap((q) => q.targets))]
    .map((ko) => ({
      ko,
      before: session.before[ko] ?? 0,
      after: state.vocabScores[ko] ?? 0,
    }))
    .sort((a, b) => a.after - b.after)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 text-center">
        <div className="text-sm text-ink-3">這一輪</div>
        <div className="mt-1 text-4xl font-semibold text-ink">
          {correctCount} <span className="text-xl text-ink-4">/ {total}</span>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink-2">這一輪的單字</h3>
        <div className="space-y-2">
          {touched.map(({ ko, before, after }) => {
            const word = WORD_BY_KO.get(ko)
            const delta = after - before
            const level = levelOf(after, true)
            return (
              <button
                key={ko}
                type="button"
                onClick={() => speak(ko)}
                className="flex w-full items-center gap-3 rounded-xl bg-surface p-3 text-left active:bg-surface-3"
              >
                <span className="font-kr w-20 shrink-0 text-xl text-ink">{ko}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{word?.meaning}</span>
                <span
                  className={`shrink-0 text-xs ${
                    delta > 0 ? 'text-ok-text' : delta < 0 ? 'text-bad-text' : 'text-ink-4'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </span>
                <span className="w-16 shrink-0 text-right text-xs text-ink-3">
                  {LEVEL_LABEL[level]} {after}/{MAX_SCORE}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onExit}
          className="flex-1 rounded-xl border border-line bg-surface py-3 text-ink-2 active:bg-surface-3"
        >
          換週數
        </button>
        <button
          type="button"
          onClick={onAgain}
          className="flex-1 rounded-xl bg-accent-mid py-3 font-semibold text-oncolor active:bg-accent-deep"
        >
          再來一輪
        </button>
      </div>
    </div>
  )
}
