import { useCallback, useEffect, useState } from 'react'
import { GROUPS, type LetterGroup } from '../data/groups'
import { LETTER_BY_CHAR, letterSound } from '../data/hangul'
import { speak, unlock } from '../lib/speech'
import { QuestionCard } from './QuestionCard'
import { LEVEL_LABEL, isMastered, levelOf } from '../lib/mastery'
import { generateSession } from '../lib/quiz'
import type { Question } from '../lib/question'
import type { ProgressState } from '../hooks/useProgress'

const SESSION_SIZE = 12

export type PracticeScope = 'group' | 'all'

interface Props {
  state: ProgressState
  unlockedChars: string[]
  currentGroup: LetterGroup
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
  record,
  initialScope,
}: Props) {
  const [session, setSession] = useState<Session | null>(() =>
    initialScope ? buildSession(initialScope, state, currentGroup, unlockedChars) : null,
  )
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const start = useCallback(
    (scope: PracticeScope) => {
      unlock()
      setSession(buildSession(scope, state, currentGroup, unlockedChars))
      setIndex(0)
      setPicked(null)
      setCorrectCount(0)
    },
    [state, currentGroup, unlockedChars],
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
    <QuestionCard
      question={q}
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
      <p className="text-sm leading-relaxed text-ink-3">
        題目只會用已經解鎖的字母。答對該字母 +1 分，答錯 −1 分，滿 6 分就是精通。拼字題一次會考到子音和母音兩個字母。
      </p>

      <button
        type="button"
        onClick={() => onStart('group')}
        className="w-full rounded-2xl bg-accent-mid p-4 text-left active:bg-accent-deep"
      >
        <div className="text-base font-semibold text-ink">
          練這一組（第 {currentGroup.id} 組・{currentGroup.title}）
        </div>
        <div className="font-kr mt-1 text-xl text-accent-pale">{currentGroup.chars.join('　')}</div>
        <div className="mt-1 text-xs text-accent-pale/90">
          {remaining.length > 0 ? `還有 ${remaining.length} 個沒精通` : '這組已全部精通，可以純複習'}
        </div>
      </button>

      <button
        type="button"
        onClick={() => onStart('all')}
        className="w-full rounded-2xl border border-line bg-surface p-4 text-left active:bg-surface-2"
      >
        <div className="text-base font-semibold text-ink">複習全部已解鎖</div>
        <div className="mt-1 text-xs text-ink-3">
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
        <h2 className="mt-2 text-xl font-semibold text-ink">這一輪結束</h2>
        <p className="text-ink-2">
          答對 <span className="font-semibold text-ok-text">{correctCount}</span> / {total}
        </p>
      </div>

      {unlockedNew && (
        <div className="animate-pop rounded-2xl border border-ok/60 bg-ok/15 p-4 text-center">
          <div className="text-2xl">🔓</div>
          <div className="mt-1 font-semibold text-ok-text">
            解鎖第 {newGroup.id} 組・{newGroup.title}
          </div>
          <div className="font-kr mt-1 text-xl text-ink">{newGroup.chars.join('　')}</div>
        </div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink-2">這一輪的字母</h3>
        <div className="space-y-2">
          {touched.map(({ char, before, after }) => {
            const letter = LETTER_BY_CHAR.get(char)!
            const delta = after - before
            const level = levelOf(after, true)
            return (
              <button
                key={char}
                type="button"
                onClick={() => speak(letterSound(letter))}
                className="flex w-full items-center gap-3 rounded-xl bg-surface p-3 text-left active:bg-surface-3"
              >
                <span className="font-kr w-9 text-center text-2xl text-ink">{char}</span>
                <span className="text-sm text-accent">{letter.roman}</span>
                <span
                  className={`ml-auto text-xs ${
                    delta > 0 ? 'text-ok-text' : delta < 0 ? 'text-bad-text' : 'text-ink-4'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </span>
                <span className="w-12 text-right text-xs text-ink-3">
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
        className="w-full rounded-xl bg-accent-mid py-4 font-semibold text-oncolor active:bg-accent-deep"
      >
        再來一輪
      </button>
      <button
        type="button"
        onClick={onExit}
        className="w-full rounded-xl bg-surface-2 py-3 text-ink-2 active:bg-surface-3"
      >
        回到選單
      </button>
    </div>
  )
}
