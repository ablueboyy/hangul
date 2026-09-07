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
    <section className="rounded-2xl border border-slate-700/70 bg-slate-800/40 p-4">
      <h2 className="text-sm font-semibold text-slate-200">備份與還原</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        進度只存在這個瀏覽器裡。把備份碼複製到備忘錄，換手機、清掉資料、或不小心按到重來時就能救回來。
      </p>
      <BackupAge lastBackupAt={state.lastBackupAt} totalAnswers={state.totalAnswers} />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === 'export' ? 'idle' : 'export')}
          className={`flex-1 rounded-xl py-3 text-sm font-medium active:scale-[0.98] ${
            mode === 'export' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200'
          }`}
        >
          匯出備份碼
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'import' ? 'idle' : 'import')}
          className={`flex-1 rounded-xl py-3 text-sm font-medium active:scale-[0.98] ${
            mode === 'import' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200'
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
      <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-2 text-xs text-amber-200">
        ⚠️ 還沒備份過
      </p>
    )
  }

  const days = Math.floor((now - lastBackupAt) / (24 * 60 * 60 * 1000))
  return (
    <p className="mt-2 text-xs text-slate-500">
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
        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed break-all text-slate-200"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex-1 rounded-xl bg-sky-600 py-3 text-sm font-medium text-white active:bg-sky-700"
        >
          {copied === 'ok' ? '已複製 ✓' : '複製'}
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={share}
            className="flex-1 rounded-xl bg-slate-800 py-3 text-sm text-slate-200 active:bg-slate-700"
          >
            分享 / 存到備忘錄
          </button>
        )}
      </div>
      {copied === 'manual' && (
        <p className="text-xs text-amber-200">
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
        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed break-all text-slate-200 placeholder:font-sans placeholder:text-slate-600"
      />

      {error && (
        <p className="rounded-lg bg-rose-500/10 px-2.5 py-2 text-xs text-rose-200">{error}</p>
      )}

      {pending ? (
        <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-xs leading-relaxed text-amber-100">
            要還原成：<span className="font-semibold">{describe(pending)}</span>
            <br />
            現在的進度會被<span className="font-semibold">整個覆蓋掉</span>，而且救不回來。
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRestore(pending)}
              className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white active:bg-amber-700"
            >
              確定覆蓋
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="flex-1 rounded-lg bg-slate-800 py-2.5 text-sm text-slate-300"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={check}
          className="w-full rounded-xl bg-sky-600 py-3 text-sm font-medium text-white active:bg-sky-700"
        >
          檢查備份碼
        </button>
      )}
    </div>
  )
}
