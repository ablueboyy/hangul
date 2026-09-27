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
}
