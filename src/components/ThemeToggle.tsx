import { THEME_ICON, THEME_LABEL, type ThemePref } from '../hooks/useTheme'

const OPTIONS: ThemePref[] = ['system', 'light', 'dark']

/** 進度分頁裡的三段式切換，標籤寫清楚 */
export function ThemePicker({
  pref,
  onChange,
}: {
  pref: ThemePref
  onChange: (next: ThemePref) => void
}) {
  return (
    <section className="rounded-2xl border border-line/70 bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink-2">外觀</h2>
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-sunken p-1">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={pref === option}
            className={`rounded-lg py-2.5 text-xs font-medium ${
              pref === option ? 'bg-accent-mid text-oncolor' : 'text-ink-3'
            }`}
          >
            <span className="mr-1">{THEME_ICON[option]}</span>
            {THEME_LABEL[option]}
          </button>
        ))}
      </div>
    </section>
  )
}

/** header 上的小按鈕，點一下換下一個 */
export function ThemeCycleButton({ pref, onCycle }: { pref: ThemePref; onCycle: () => void }) {
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`外觀：${THEME_LABEL[pref]}，點一下切換`}
      title={`外觀：${THEME_LABEL[pref]}`}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-base active:bg-surface-2"
    >
      {THEME_ICON[pref]}
    </button>
  )
}
