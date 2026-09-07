import { useCallback, useEffect, useState } from 'react'

/** 這個 key 在 index.html 的防閃爍腳本裡也有一份，改了要一起改 */
const STORAGE_KEY = 'hangul.theme.v1'

export type ThemePref = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_LABEL: Record<ThemePref, string> = {
  system: '跟隨系統',
  light: '丹青',
  dark: '深夜',
}

export const THEME_ICON: Record<ThemePref, string> = {
  system: '🌗',
  light: '☀️',
  dark: '🌙',
}

/** 狀態列和 iOS 切換 App 畫面的底色 */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: '#0b1120',
  light: '#f4efe3',
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

const prefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches

function loadPref(): ThemePref {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    // 讀不到就跟隨系統
  }
  return 'system'
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(loadPref)
  const [systemDark, setSystemDark] = useState(prefersDark)

  // 使用者在 iOS 設定裡切換深淺色時要即時反應
  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY)
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: ResolvedTheme = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref

  // 主題只影響 <html> 和 meta，兩個都在 React 樹外面
  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[resolved])
  }, [resolved])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      // 無痕模式寫不進去，主題本身還是會生效
    }
  }, [pref])

  /** 給 header 那顆小按鈕用：系統 → 丹青 → 深夜 → 系統 */
  const cycle = useCallback(
    () => setPref((p) => (p === 'system' ? 'light' : p === 'light' ? 'dark' : 'system')),
    [],
  )

  return { pref, resolved, setPref, cycle }
}
