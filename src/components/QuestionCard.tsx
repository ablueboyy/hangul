import { speak } from '../lib/speech'
import type { Question } from '../lib/question'

interface Props {
  question: Question
  /** 0 起算 */
  index: number
  total: number
  /** 已經選了哪個答案，還沒作答就是 null */
  picked: string | null
  onPick: (key: string) => void
  onNext: () => void
  onExit: () => void
}

/**
 * 一題的畫面：進度條、題面（點了會發音）、選項、答完的解說與下一題。
 * 字母練習和單字測驗共用這個元件，兩邊只差在題目怎麼生出來。
 */
export function QuestionCard({ question: q, index, total, picked, onPick, onNext, onExit }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-ink-3">
        <span>
          {index + 1} / {total}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-accent transition-[width]"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
        <button type="button" onClick={onExit} className="text-ink-4">
          結束
        </button>
      </div>

      <p className="text-center text-sm text-ink-2">{q.title}</p>

      <button
        type="button"
        disabled={!q.speakText}
        onClick={() => q.speakText && speak(q.speakText)}
        className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-3xl border border-line bg-surface py-6 disabled:active:bg-surface"
      >
        <span
          className={`px-4 text-center leading-tight text-ink ${
            q.promptKorean ? 'font-kr text-[5.5rem] leading-none' : 'text-5xl'
          }`}
        >
          {q.prompt}
        </span>
        {q.speakText && <span className="text-xs text-ink-4">🔊 點一下再聽一次</span>}
      </button>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((option) => {
          const isAnswer = option.key === q.answerKey
          const chosen = option.key === picked
          const style = !picked
            ? 'border-line bg-surface text-ink'
            : isAnswer
              ? 'border-ok bg-ok/25 text-ok-text'
              : chosen
                ? 'border-bad bg-bad/25 text-bad-text'
                : 'border-line-soft bg-surface/60 text-ink-5'
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onPick(option.key)}
              className={`rounded-xl border px-2 py-4 text-lg font-medium active:scale-[0.98] ${style} ${
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
              picked === q.answerKey ? 'bg-ok/15 text-ok-text' : 'bg-bad/15 text-bad-text'
            }`}
          >
            <span className="font-semibold">{picked === q.answerKey ? '答對了 +1　' : '答錯了 −1　'}</span>
            <span className="font-kr">{q.explanation}</span>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="w-full rounded-xl bg-accent-mid py-4 font-semibold text-oncolor active:bg-accent-deep"
          >
            {index + 1 >= total ? '看結果' : '下一題'}
          </button>
        </div>
      )}
    </div>
  )
}
