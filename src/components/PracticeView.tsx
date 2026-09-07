import { useCallback, useEffect, useState } from 'react'
import { GROUPS, type LetterGroup } from '../data/groups'
import { LETTER_BY_CHAR } from '../data/hangul'
import { speak, warmUp } from '../lib/speech'
import { LEVEL_LABEL, isMastered, levelOf } from '../lib/mastery'
import { generateSession, type Question } from '../lib/quiz'
import type { ProgressState } from '../hooks/useProgress'

const SESSION_SIZE = 12

export type PracticeScope = 'group' | 'all'

interface Props {
  state: ProgressState
  unlockedChars: string[]
  currentGroup: LetterGroup
  canListen: boolean
  record: (targets: string[], correct: boolean) => void
  /**
   * 從「課程」按練習進來時直接開一輪。App 會換掉 key 讓這個元件重新掛載，
   * 所以這裡只需要在初始化時看一眼，不用 effect。
   */
  initialScope: PracticeScope | null
}

interface Session {
  scope: PracticeScope
  questions: Question[]
  /** 開場時各字母的分數，結算時拿來比對誰升級了 */
  before: Record<string, number>
  unlockedBefore: number
}

/** 抽一輪題目。優先練還沒精通的字母，整組都精通了就當純複習 */
function buildSession(
  scope: PracticeScope,
  state: ProgressState,
  currentGroup: LetterGroup,
  unlockedChars: string[],
  canListen: boolean,
): Session {
  const scopeChars = scope === 'group' ? currentGroup.chars : unlockedChars
  const notMastered = scopeChars.filter((c) => !isMastered(state.scores[c]))
  return {
    scope,
    questions: generateSession(
      {
        pool: unlockedChars,
        focus: notMastered.length > 0 ? notMastered : scopeChars,
        scores: state.scores,
        canListen,
      },
      SESSION_SIZE,
    ),
    before: { ...state.scores },
    unlockedBefore: state.unlockedCount,
  }
}

export function PracticeView({
  state,
  unlockedChars,
  currentGroup,
  canListen,
  record,
  initialScope,
}: Props) {
  const [session, setSession] = useState<Session | null>(() =>
    initialScope ? buildSession(initialScope, state, currentGroup, unlockedChars, canListen) : null,
  )
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const start = useCallback(
    (scope: PracticeScope) => {
      warmUp()
      setSession(buildSession(scope, state, currentGroup, unlockedChars, canListen))
      setIndex(0)
      setPicked(null)
      setCorrectCount(0)
    },
    [state, currentGroup, unlockedChars, canListen],
  )

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
    record(question.targets, correct)
    if (question.speakText) speak(question.speakText)
  }

  // ── 開始畫面 ───────────────────────────────────────────────
  if (!session) {
    return (
      <StartScreen
        state={state}
        currentGroup={currentGroup}
        unlockedChars={unlockedChars}
        onStart={start}
      />
    )
  }

  // ── 結算畫面 ───────────────────────────────────────────────
  if (index >= session.questions.length) {
    return (
      <Summary
        session={session}
        state={state}
        correctCount={correctCount}
        onAgain={() => start(session.scope)}
        onExit={() => setSession(null)}
      />
    )
  }

  const q = question!

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>
          {index + 1} / {session.questions.length}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-sky-500 transition-[width]"
            style={{ width: `${(index / session.questions.length) * 100}%` }}
          />
        </div>
        <button type="button" onClick={() => setSession(null)} className="text-slate-500">
          結束
        </button>
      </div>

      <p className="text-center text-sm text-slate-300">{q.title}</p>

      <button
        type="button"
        disabled={!q.speakText}
        onClick={() => q.speakText && speak(q.speakText)}
        className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-3xl border border-slate-700 bg-slate-800/60 py-6 disabled:active:bg-slate-800/60"
      >
        <span
          className={`leading-none text-white ${
            q.promptKorean ? 'font-kr text-[5.5rem]' : 'text-5xl'
          }`}
        >
          {q.prompt}
        </span>
        {q.speakText && <span className="text-xs text-slate-500">🔊 點一下再聽一次</span>}
      </button>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((option) => {
          const isAnswer = option.key === q.answerKey
          const chosen = option.key === picked
          const style = !picked
            ? 'border-slate-700 bg-slate-800/60 text-white'
            : isAnswer
              ? 'border-emerald-500 bg-emerald-600/25 text-emerald-300'
              : chosen
                ? 'border-rose-500 bg-rose-600/25 text-rose-300'
                : 'border-slate-800 bg-slate-800/30 text-slate-600'
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => choose(option.key)}
              className={`rounded-xl border py-4 text-lg font-medium active:scale-[0.98] ${style} ${
                option.korean ? 'font-kr text-2xl' : ''
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className="animate-pop space-y-3">
          <div
            className={`rounded-xl p-3 text-sm leading-relaxed ${
              picked === q.answerKey
                ? 'bg-emerald-500/10 text-emerald-200'
                : 'bg-rose-500/10 text-rose-200'
            }`}
          >
            <span className="font-semibold">
              {picked === q.answerKey ? '答對了 +1　' : '答錯了 −1　'}
            </span>
            <span className="font-kr">{q.explanation}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIndex((i) => i + 1)
              setPicked(null)
            }}
            className="w-full rounded-xl bg-sky-600 py-4 font-semibold text-white active:bg-sky-700"
          >
            {index + 1 >= session.questions.length ? '看結果' : '下一題'}
          </button>
        </div>
      )}
    </div>
  )
}

function StartScreen({
  state,
  currentGroup,
  unlockedChars,
  onStart,
}: {
  state: ProgressState
  currentGroup: LetterGroup
  unlockedChars: string[]
  onStart: (scope: PracticeScope) => void
}) {
  const remaining = currentGroup.chars.filter((c) => !isMastered(state.scores[c]))

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-400">
        題目只會用已經解鎖的字母。答對該字母 +1 分，答錯 −1 分，滿 6 分就是精通。拼字題一次會考到子音和母音兩個字母。
      </p>

      <button
        type="button"
        onClick={() => onStart('group')}
        className="w-full rounded-2xl bg-sky-600 p-4 text-left active:bg-sky-700"
      >
        <div className="text-base font-semibold text-white">
          練這一組（第 {currentGroup.id} 組・{currentGroup.title}）
        </div>
        <div className="font-kr mt-1 text-xl text-sky-100">{currentGroup.chars.join('　')}</div>
        <div className="mt-1 text-xs text-sky-200/80">
          {remaining.length > 0 ? `還有 ${remaining.length} 個沒精通` : '這組已全部精通，可以純複習'}
        </div>
      </button>

      <button
        type="button"
        onClick={() => onStart('all')}
        className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 p-4 text-left active:bg-slate-800"
      >
        <div className="text-base font-semibold text-white">複習全部已解鎖</div>
        <div className="mt-1 text-xs text-slate-400">
          {unlockedChars.length} 個字母混合出題，把舊的也顧一下
        </div>
      </button>
    </div>
  )
}

function Summary({
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
  const unlockedNew = state.unlockedCount > session.unlockedBefore
  const newGroup = GROUPS[state.unlockedCount - 1]

  // 這一輪碰到的字母，依變化排序
  const touched = [...new Set(session.questions.flatMap((q) => q.targets))]
    .map((char) => ({
      char,
      before: session.before[char] ?? 0,
      after: state.scores[char] ?? 0,
    }))
    .sort((a, b) => b.after - b.before - (a.after - a.before))

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-6xl">{correctCount === total ? '🎉' : '👏'}</div>
        <h2 className="mt-2 text-xl font-semibold text-white">這一輪結束</h2>
        <p className="text-slate-300">
          答對 <span className="font-semibold text-emerald-400">{correctCount}</span> / {total}
        </p>
      </div>

      {unlockedNew && (
        <div className="animate-pop rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4 text-center">
          <div className="text-2xl">🔓</div>
          <div className="mt-1 font-semibold text-emerald-300">
            解鎖第 {newGroup.id} 組・{newGroup.title}
          </div>
          <div className="font-kr mt-1 text-xl text-white">{newGroup.chars.join('　')}</div>
        </div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">這一輪的字母</h3>
        <div className="space-y-2">
          {touched.map(({ char, before, after }) => {
            const letter = LETTER_BY_CHAR.get(char)!
            const delta = after - before
            const level = levelOf(after, true)
            return (
              <button
                key={char}
                type="button"
                onClick={() => speak(letter.name)}
                className="flex w-full items-center gap-3 rounded-xl bg-slate-800/60 p-3 text-left active:bg-slate-700"
              >
                <span className="font-kr w-9 text-center text-2xl text-white">{char}</span>
                <span className="text-sm text-sky-400">{letter.roman}</span>
                <span
                  className={`ml-auto text-xs ${
                    delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-500'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </span>
                <span className="w-12 text-right text-xs text-slate-400">
                  {LEVEL_LABEL[level]}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={onAgain}
        className="w-full rounded-xl bg-sky-600 py-4 font-semibold text-white active:bg-sky-700"
      >
        再來一輪
      </button>
      <button
        type="button"
        onClick={onExit}
        className="w-full rounded-xl bg-slate-800 py-3 text-slate-300 active:bg-slate-700"
      >
        回到選單
      </button>
    </div>
  )
}
