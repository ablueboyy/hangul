import { useMemo, useRef, useState } from 'react'
import { decodeBackup, describe, encodeBackup } from '../lib/backup'
import type { ProgressState } from '../hooks/useProgress'

interface Props {
  state: ProgressState
  onRestore: (next: ProgressState) => void
  onBackedUp: () => void
}

type Mode = 'idle' | 'export' | 'import'

export function BackupSection({ state, onRestore, onBackedUp }: Props) {
  const [mode, setMode] = useState<Mode>('idle')
  const code = useMemo(() => encodeBackup(state), [state])

  return (
    <section className="rounded-2xl border border-line/70 bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink-2">備份與還原</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-3">
        進度只存在這個瀏覽器裡。把備份碼複製到備忘錄，換手機、清掉資料、或不小心按到重來時就能救回來。
      </p>
      <BackupAge lastBackupAt={state.lastBackupAt} totalAnswers={state.totalAnswers} />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === 'export' ? 'idle' : 'export')}
          className={`flex-1 rounded-xl py-3 text-sm font-medium active:scale-[0.98] ${
            mode === 'export' ? 'bg-accent-mid text-oncolor' : 'bg-surface-2 text-ink-2'
          }`}
        >
          匯出備份碼
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'import' ? 'idle' : 'import')}
          className={`flex-1 rounded-xl py-3 text-sm font-medium active:scale-[0.98] ${
            mode === 'import' ? 'bg-accent-mid text-oncolor' : 'bg-surface-2 text-ink-2'
          }`}
        >
          還原進度
        </button>
      </div>

      {mode === 'export' && <ExportPanel code={code} onBackedUp={onBackedUp} />}
      {mode === 'import' && (
        <ImportPanel
          onRestore={(next) => {
            onRestore(next)
            setMode('idle')
          }}
        />
      )}
    </section>
  )
}

function BackupAge({
  lastBackupAt,
  totalAnswers,
}: {
  lastBackupAt: number | null
  totalAnswers: number
}) {
  // 時間戳在 render 外面取一次就好
  const [now] = useState(() => Date.now())

  if (totalAnswers === 0) return null

  if (lastBackupAt === null) {
    return (
      <p className="mt-2 rounded-lg bg-warn/15 px-2.5 py-2 text-xs text-warn-text">
        ⚠️ 還沒備份過
      </p>
    )
  }

  const days = Math.floor((now - lastBackupAt) / (24 * 60 * 60 * 1000))
  return (
    <p className="mt-2 text-xs text-ink-4">
      上次備份：{days === 0 ? '今天' : `${days} 天前`}
    </p>
  )
}

function ExportPanel({ code, onBackedUp }: { code: string; onBackedUp: () => void }) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'manual'>('idle')
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  const copy = async () => {
    onBackedUp()
    try {
      // clipboard API 只在 https / localhost 能用，區網 http 會直接丟錯
      await navigator.clipboard.writeText(code)
      setCopied('ok')
      return
    } catch {
      // 退而求其次：把文字選起來，讓使用者自己長按複製
      fieldRef.current?.focus()
      fieldRef.current?.select()
      setCopied('manual')
    }
  }

  const share = async () => {
    onBackedUp()
    try {
      await navigator.share({ title: '韓文字母練習備份碼', text: code })
    } catch {
      // 使用者取消分享，什麼都不用做
    }
  }

  return (
    <div className="animate-pop mt-3 space-y-2">
      <textarea
        ref={fieldRef}
        readOnly
        value={code}
        rows={3}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full resize-none rounded-xl border border-line bg-sunken p-3 font-mono text-[11px] leading-relaxed break-all text-ink-2"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex-1 rounded-xl bg-accent-mid py-3 text-sm font-medium text-oncolor active:bg-accent-deep"
        >
          {copied === 'ok' ? '已複製 ✓' : '複製'}
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={share}
            className="flex-1 rounded-xl bg-surface-2 py-3 text-sm text-ink-2 active:bg-surface-3"
          >
            分享 / 存到備忘錄
          </button>
        )}
      </div>
      {copied === 'manual' && (
        <p className="text-xs text-warn-text">
          這個瀏覽器不給自動複製（區網 http 會這樣）。文字已經選起來了，長按選「拷貝」即可。
        </p>
      )}
    </div>
  )
}

function ImportPanel({ onRestore }: { onRestore: (next: ProgressState) => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<ProgressState | null>(null)

  const check = () => {
    const result = decodeBackup(text)
    if (!result.ok) {
      setError(result.error)
      setPending(null)
      return
    }
    setError(null)
    setPending(result.state)
  }

  return (
    <div className="animate-pop mt-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
          setPending(null)
        }}
        rows={3}
        placeholder="把備份碼貼在這裡"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full resize-none rounded-xl border border-line bg-sunken p-3 font-mono text-[11px] leading-relaxed break-all text-ink-2 placeholder:font-sans placeholder:text-ink-5"
      />

      {error && (
        <p className="rounded-lg bg-bad/15 px-2.5 py-2 text-xs text-bad-text">{error}</p>
      )}

      {pending ? (
        <div className="space-y-2 rounded-xl border border-warn/50 bg-warn/15 p-3">
          <p className="text-xs leading-relaxed text-warn-text">
            要還原成：<span className="font-semibold">{describe(pending)}</span>
            <br />
            現在的進度會被<span className="font-semibold">整個覆蓋掉</span>，而且救不回來。
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRestore(pending)}
              className="flex-1 rounded-lg bg-warn-deep py-2.5 text-sm font-medium text-oncolor active:bg-warn-press"
            >
              確定覆蓋
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="flex-1 rounded-lg bg-surface-2 py-2.5 text-sm text-ink-2"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={check}
          className="w-full rounded-xl bg-accent-mid py-3 text-sm font-medium text-oncolor active:bg-accent-deep"
        >
          檢查備份碼
        </button>
      )}
    </div>
  )
}
