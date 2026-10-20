export type MoreTab = 'lessons' | 'dictation' | 'progress'

const ITEMS: { id: MoreTab; icon: string; title: string; note: string }[] = [
  { id: 'lessons', icon: '📚', title: '字母課程與練習', note: '勾組別練 40 個字母、拼字盤' },
  { id: 'dictation', icon: '✍️', title: '聽寫', note: '單字或自選字母拼出來的音節' },
  { id: 'progress', icon: '📈', title: '進度與備份', note: '熟練度、備份碼、外觀' },
]

/** 「更多」：不常用、但還是想留著的功能 */
export function MoreView({ onOpen }: { onOpen: (tab: MoreTab) => void }) {
  return (
    <div className="space-y-2">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onOpen(it.id)}
          className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left active:bg-surface-3"
        >
          <span className="text-2xl">{it.icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">{it.title}</span>
            <span className="block text-xs text-ink-3">{it.note}</span>
          </span>
          <span className="text-ink-4">›</span>
        </button>
      ))}
    </div>
  )
}
