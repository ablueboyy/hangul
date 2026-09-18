import { useEffect } from 'react'
import type { Letter } from '../data/hangul'
import { LETTER_TYPE_LABEL, letterSound } from '../data/hangul'
import { GROUP_OF_CHAR } from '../data/groups'
import { speak } from '../lib/speech'
import { LEVEL_BADGE, LEVEL_BAR, LEVEL_LABEL, MAX_SCORE, levelOf, ratio } from '../lib/mastery'

interface Props {
  letter: Letter
  score: number
  unlocked: boolean
  onClose: () => void
}

export function LetterSheet({ letter, score, unlocked, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const level = levelOf(score, unlocked)
  const sound = letterSound(letter)
  // 子音的名字和它的音不一樣（ㅅ 叫 시옷，但音是 s），兩者要分開呈現
  const nameDiffers = sound !== letter.name

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-sunken p-5 pb-safe sm:mb-6 sm:rounded-3xl sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-3 sm:hidden" />

        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!unlocked}
            onClick={() => speak(sound)}
            className={`font-kr flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-6xl ${
              unlocked ? 'text-ink active:scale-95' : 'text-ink-5'
            }`}
            aria-label={`播放 ${letter.char} 的發音`}
          >
            {letter.char}
          </button>
          <div className="min-w-0">
            <div className="text-xs text-ink-3">{LETTER_TYPE_LABEL[letter.type]}</div>
            {unlocked ? (
              <>
                <div className="font-kr text-2xl font-semibold text-ink">{sound}</div>
                <div className="text-lg text-accent">{letter.roman}</div>
                {nameDiffers && (
                  <div className="text-xs text-ink-4">
                    字母名字：<span className="font-kr">{letter.name}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-lg font-semibold text-ink-4">還沒解鎖</div>
            )}
            <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${LEVEL_BADGE[level]}`}>
              {LEVEL_LABEL[level]}
            </span>
          </div>
        </div>

        {!unlocked ? (
          <p className="mt-5 rounded-xl bg-surface-2 p-4 text-sm leading-relaxed text-ink-2">
            這個字母在<span className="font-semibold text-accent">第 {GROUP_OF_CHAR.get(letter.char)} 組</span>
            。把目前這一組的 5 個字母都練到精通，就會解鎖下一組。
          </p>
        ) : (
          <>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => speak(sound)}
                className="flex-1 rounded-xl bg-accent-mid py-3 font-medium text-oncolor active:bg-accent-deep"
              >
                🔊 發音 <span className="font-kr">{sound}</span>
              </button>
              {nameDiffers && (
                <button
                  type="button"
                  onClick={() => speak(letter.name)}
                  className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-2 active:bg-surface-3"
                >
                  名字 <span className="font-kr">{letter.name}</span>
                </button>
              )}
            </div>
            {nameDiffers && (
              <p className="mt-2 text-xs leading-relaxed text-ink-4">
                子音沒辦法單獨發音，所以用「{sound}」示範它配上母音 ㅏ 的樣子。
                「{letter.name}」只是這個字母的名字，聽起來跟它的音不一樣。
              </p>
            )}

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="mb-1 font-medium text-ink-3">怎麼念</dt>
                <dd className="leading-relaxed text-ink-2">{letter.hint}</dd>
              </div>
              <div>
                <dt className="mb-1 font-medium text-ink-3">怎麼記字形</dt>
                <dd className="leading-relaxed text-ink-2">{letter.mnemonic}</dd>
              </div>
              <div>
                <dt className="mb-1 font-medium text-ink-3">例字</dt>
                <dd>
                  <button
                    type="button"
                    onClick={() => speak(letter.example.word)}
                    className="flex w-full items-center gap-3 rounded-xl bg-surface-2 p-3 text-left active:bg-surface-3"
                  >
                    <span className="font-kr text-2xl text-ink">{letter.example.word}</span>
                    <span className="text-ink-3">{letter.example.roman}</span>
                    <span className="ml-auto text-ink-2">{letter.example.meaning}</span>
                  </button>
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-ink-3">
                <span>熟練度</span>
                <span>
                  {score} / {MAX_SCORE}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full transition-[width] ${LEVEL_BAR[level]}`}
                  style={{ width: `${ratio(score) * 100}%` }}
                />
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-surface-2 py-3 text-ink-2 active:bg-surface-3"
        >
          關閉
        </button>
      </div>
    </div>
  )
}
