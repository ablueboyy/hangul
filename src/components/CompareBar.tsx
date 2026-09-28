import { useEffect, useState } from 'react'
import { CONFUSABLE_GROUPS, soundOfChar } from '../data/hangul'
import { speakSequence, stopSpeaking } from '../lib/speech'

/** 一次最多排幾個 —— 再多就記不住前面聽起來怎樣，對比就失去意義 */
export const MAX_COMPARE = 6

interface Props {
  /** 目前排好的字母，順序就是播放順序 */
  chars: string[]
  onChange: (chars: string[]) => void
  /** 對比模式開著時，點字母表是加進來而不是打開詳細頁 */
  picking: boolean
  onPickingChange: (picking: boolean) => void
}

/**
 * 字母表上方的「對比聽」：自己挑幾個字母，一個接一個念。
 * 像 어 / 오 / 우 這種單獨聽很難分的音，排在一起連著聽差異會明顯很多。
 */
export function CompareBar({ chars, onChange, picking, onPickingChange }: Props) {
  // 記住是哪一串在播：清單一變（加字、拿掉、點字母表單獨念）就視為沒在播
  const [progress, setProgress] = useState<{ list: string[]; index: number } | null>(null)
  const playing = progress && progress.list === chars ? progress.index : -1
  const [loop, setLoop] = useState(false)

  // 離開字母表時把還在循環的那串停掉
  useEffect(() => () => stopSpeaking(), [])

  const play = (list: string[] = chars) => {
    if (list.length === 0) return
    speakSequence(list.map(soundOfChar), {
      loop,
      onStep: (index) => setProgress({ list, index }),
    })
  }

  const stop = () => {
    stopSpeaking()
    setProgress(null)
  }

  const choosePreset = (group: string[]) => {
    onChange(group)
    play(group)
  }

  const remove = (char: string) => {
    stop()
    onChange(chars.filter((c) => c !== char))
  }

  if (!picking) {
    return (
      <button
        type="button"
        onClick={() => onPickingChange(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-line/70 bg-surface p-4 text-left active:bg-surface-2"
      >
        <span className="text-2xl">🔁</span>
        <span className="min-w-0">
          <span className="block font-medium text-ink">對比聽</span>
          <span className="block text-xs text-ink-3">
            自己挑幾個字母連著念，分辨 <span className="font-kr">어 / 오 / 우</span> 這種很像的音
          </span>
        </span>
      </button>
    )
  }

  return (
    <section className="rounded-2xl border border-accent/60 bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-medium text-ink">🔁 對比聽</h2>
        <button
          type="button"
          onClick={() => {
            stop()
            onPickingChange(false)
          }}
          className="text-sm text-ink-3"
        >
          完成
        </button>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-3">
        點下面字母表把字母加進來（再點一次拿掉），最多 {MAX_COMPARE} 個，會照你點的順序念。
      </p>

      <div className="mt-3 flex min-h-20 flex-wrap items-center gap-2 rounded-xl bg-sunken p-2">
        {chars.length === 0 ? (
          <span className="w-full text-center text-sm text-ink-4">還沒選字母</span>
        ) : (
          chars.map((char, i) => (
            <button
              key={char}
              type="button"
              onClick={() => remove(char)}
              className={`flex h-16 w-14 flex-col items-center justify-center rounded-xl border transition-colors ${
                playing === i
                  ? 'border-accent bg-accent/20'
                  : 'border-line/70 bg-surface-2'
              }`}
              aria-label={`從對比中移除 ${char}`}
            >
              <span className="font-kr text-2xl leading-none text-ink">{char}</span>
              <span className="font-kr mt-1 text-xs text-ink-3">{soundOfChar(char)}</span>
            </button>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {playing >= 0 ? (
          <button
            type="button"
            onClick={stop}
            className="flex-1 rounded-xl bg-surface-3 py-3 font-medium text-ink active:bg-surface-2"
          >
            ⏹ 停止
          </button>
        ) : (
          <button
            type="button"
            disabled={chars.length === 0}
            onClick={() => play()}
            className="flex-1 rounded-xl bg-accent-mid py-3 font-medium text-oncolor active:bg-accent-deep disabled:opacity-50"
          >
            ▶ 連著念
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            // 播放中切換的話，停掉讓使用者用新設定重播，免得狀態對不上
            stop()
            setLoop((v) => !v)
          }}
          aria-pressed={loop}
          className={`rounded-xl border px-4 text-sm ${
            loop ? 'border-accent bg-accent/20 text-accent' : 'border-line bg-surface-2 text-ink-3'
          }`}
        >
          循環
        </button>
        <button
          type="button"
          disabled={chars.length === 0}
          onClick={() => {
            stop()
            onChange([])
          }}
          className="rounded-xl bg-surface-2 px-4 text-sm text-ink-3 active:bg-surface-3 disabled:opacity-50"
        >
          清空
        </button>
      </div>

      <div className="mt-4 text-xs text-ink-4">常搞混的組合</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {CONFUSABLE_GROUPS.map((group) => (
          <button
            key={group.join('')}
            type="button"
            onClick={() => choosePreset(group)}
            className="font-kr rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm text-ink-2 active:bg-surface-3"
          >
            {group.join(' ')}
          </button>
        ))}
      </div>
    </section>
  )
}
