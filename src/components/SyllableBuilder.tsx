import { useMemo, useState } from 'react'
import { SILENT_INITIAL } from '../data/groups'
import { speak } from '../lib/speech'
import { compose, isInitial, isMedial, romanize } from '../lib/syllable'

interface Props {
  /** 已解鎖的字母，拼字盤只會出現這些 */
  unlockedChars: string[]
}

/** 自由拼字盤：子音配母音，字會即時組出來 */
export function SyllableBuilder({ unlockedChars }: Props) {
  // ㅇ 在字首不發音，母音要單獨成字就得靠它，所以一開始就給
  const initials = useMemo(
    () => [...new Set([SILENT_INITIAL, ...unlockedChars.filter(isInitial)])],
    [unlockedChars],
  )
  const medials = useMemo(() => unlockedChars.filter(isMedial), [unlockedChars])

  const [initial, setInitial] = useState(initials[0])
  const [medial, setMedial] = useState(medials[0])

  const safeInitial = initials.includes(initial) ? initial : initials[0]
  const safeMedial = medials.includes(medial) ? medial : medials[0]

  const syllable = compose(safeInitial, safeMedial)
  const roman = romanize(safeInitial, safeMedial)

  if (!safeMedial) return null

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => syllable && speak(syllable)}
        className="flex w-full flex-col items-center gap-1 rounded-3xl border border-line bg-surface py-6 active:bg-surface-2"
      >
        <div className="font-kr text-[5rem] leading-none text-ink">{syllable}</div>
        <div className="text-lg text-accent">{roman}</div>
        <div className="font-kr text-xs text-ink-4">
          {safeInitial} + {safeMedial}　🔊 點一下發音
        </div>
      </button>

      <ChipRow
        title="子音（初聲）"
        items={initials}
        active={safeInitial}
        onPick={setInitial}
        hint={initials.length === 1 ? 'ㅇ 在字首不發音，只是讓母音有個字可以站' : undefined}
      />
      <ChipRow title="母音（中聲）" items={medials} active={safeMedial} onPick={setMedial} />
    </div>
  )
}

function ChipRow({
  title,
  items,
  active,
  onPick,
  hint,
}: {
  title: string
  items: string[]
  active: string
  onPick: (v: string) => void
  hint?: string
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink-2">
        {title}
        {hint && <span className="ml-2 text-xs font-normal text-ink-4">{hint}</span>}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPick(item)}
            className={`font-kr h-11 w-11 rounded-xl border text-xl active:scale-95 ${
              item === active
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-line bg-surface text-ink'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
