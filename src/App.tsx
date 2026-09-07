import { useCallback, useEffect, useState } from 'react'
import { LessonsView } from './components/LessonsView'
import { PracticeView, type PracticeScope } from './components/PracticeView'
import { ChartView } from './components/ChartView'
import { ProgressView } from './components/ProgressView'
import { useProgress } from './hooks/useProgress'
import { useTheme } from './hooks/useTheme'
import { ThemeCycleButton } from './components/ThemeToggle'
import { hasKoreanVoice, speechSupported, warmUp } from './lib/speech'

type Tab = 'lessons' | 'practice' | 'chart' | 'progress'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'lessons', label: '課程', icon: '📚' },
  { id: 'practice', label: '練習', icon: '✏️' },
  { id: 'chart', label: '字母表', icon: '가' },
  { id: 'progress', label: '進度', icon: '📈' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('lessons')
  // 換掉 key 就能讓「練習」分頁重新掛載並直接開一輪；直接點分頁則沿用原本的 session
  const [practice, setPractice] = useState<{ key: number; scope: PracticeScope | null }>({
    key: 0,
    scope: null,
  })
  const { state, record, reset, restore, markBackedUp, unlockedChars, isUnlocked, currentGroup } =
    useProgress()
  const { pref: themePref, setPref: setThemePref, cycle: cycleTheme } = useTheme()
  const [canListen, setCanListen] = useState(true)
  const [voiceWarning, setVoiceWarning] = useState(false)

  useEffect(() => {
    // 語音清單在部分瀏覽器是非同步載入的，等一下再判斷才準
    const timer = setTimeout(() => {
      const ok = speechSupported() && hasKoreanVoice()
      setCanListen(ok)
      setVoiceWarning(!ok)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  const goPractice = useCallback(() => {
    setTab('practice')
    setPractice((p) => ({ key: p.key + 1, scope: 'group' }))
  }, [])

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col" onPointerDown={warmUp}>
      <header className="sticky top-0 z-20 border-b border-line-soft bg-page/90 px-4 pb-3 pt-safe backdrop-blur">
        <div className="flex items-baseline justify-between">
          <h1 className="text-lg font-semibold text-ink">
            韓文字母 <span className="font-kr text-ink-4">한글</span>
          </h1>
          <div className="flex items-center gap-2">
            {state.streak > 0 && (
              <span className="text-xs text-warn-text">🔥 連續 {state.streak} 天</span>
            )}
            <ThemeCycleButton pref={themePref} onCycle={cycleTheme} />
          </div>
        </div>
      </header>

      {voiceWarning && (
        <div className="mx-4 mt-3 rounded-xl border border-warn/50 bg-warn/15 p-3 text-xs leading-relaxed text-warn-text">
          這個瀏覽器找不到韓文語音，字母不會發聲，聽力題也會自動跳過。iPhone 請到「設定 → 輔助使用
          → 朗讀內容 → 聲音」下載韓文語音；電腦上用 Chrome 或 Edge 通常內建。
        </div>
      )}

      <main className="flex-1 px-4 pb-28 pt-5">
        {tab === 'lessons' && (
          <LessonsView
            state={state}
            currentGroup={currentGroup}
            unlockedChars={unlockedChars}
            onPractice={goPractice}
          />
        )}
        {tab === 'practice' && (
          <PracticeView
            key={practice.key}
            state={state}
            unlockedChars={unlockedChars}
            currentGroup={currentGroup}
            canListen={canListen}
            record={record}
            initialScope={practice.scope}
          />
        )}
        {tab === 'chart' && <ChartView state={state} isUnlocked={isUnlocked} />}
        {tab === 'progress' && (
          <ProgressView
            state={state}
            unlockedChars={unlockedChars}
            onReset={reset}
            onRestore={restore}
            onBackedUp={markBackedUp}
            themePref={themePref}
            onThemeChange={setThemePref}
          />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-line-soft bg-page/95 px-2 pb-safe pt-2 backdrop-blur">
        <div className="grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] ${
                tab === t.id ? 'text-accent' : 'text-ink-4'
              }`}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <span
                className={
                  t.id === 'chart' ? 'font-kr text-lg leading-none' : 'text-lg leading-none'
                }
              >
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
