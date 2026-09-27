/**
 * 讓裝在主畫面的 App 自己更新，不用刪掉重加。
 *
 * iOS 的主畫面 App 切到背景不會真的關掉，回來時也不會重新載入頁面，
 * 所以瀏覽器幾乎沒機會去檢查有沒有新版。這裡在每次切回 App 時主動問一次；
 * 有新版的話 service worker 會直接接手（registerType: 'autoUpdate'），
 * virtual:pwa-register 再幫我們重新整理頁面。
 *
 * 進度存在 localStorage，跟著網址走、不跟著版本走 —— 更新完什麼都還在。
 * 反而是把主畫面圖示刪掉重加，iOS 會把那份資料一起清掉。
 */
import { registerSW } from 'virtual:pwa-register'
import { backgroundClipUrls } from './speech'

/** 要和 vite.config.ts 的 FINAL_AUDIO_CACHE 一致，service worker 從這個快取拿收音音檔 */
const FINAL_AUDIO_CACHE = 'audio-final-v1'

export function setupAutoUpdate(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          registration.update().catch(() => {})
        }
      }
      document.addEventListener('visibilitychange', check)
      // 一直開著不切走的話，也每小時問一次
      setInterval(check, 60 * 60 * 1000)
    },
  })

  // 開 App 之後等一下再開始，不要跟畫面載入搶頻寬
  setTimeout(() => void prefetchFinalAudio(), 5000)
}

/**
 * 聽寫用的收音音節（2786 個）沒有放進安裝包，這裡在背景把還沒抓過的慢慢抓下來，
 * 抓完之後離線也能用。中途關掉 App 沒關係，下次打開會從缺的繼續抓。
 */
async function prefetchFinalAudio(): Promise<void> {
  if (!('caches' in window) || !navigator.onLine) return
  // 使用者開了省流量就不要主動抓，用到的時候再抓
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return

  try {
    const cache = await caches.open(FINAL_AUDIO_CACHE)
    const have = new Set((await cache.keys()).map((r) => r.url))
    const queue = backgroundClipUrls()
      .map((u) => new URL(u, location.href).href)
      .filter((u) => !have.has(u))

    let failures = 0
    const worker = async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        if (!navigator.onLine || failures > 20) return
        try {
          const res = await fetch(url)
          if (res.ok) await cache.put(url, res)
          else failures++
        } catch {
          failures++
        }
      }
    }
    await Promise.all(Array.from({ length: 4 }, worker))
  } catch {
    // 快取用不了（無痕模式、空間不足）就算了，用到的時候還是會從網路抓
  }
}
