import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// GitHub Pages 部署在 https://<user>.github.io/<repo>/ 底下，
// 所以正式版需要 base path。用環境變數覆蓋，本機開發維持 '/'。
const base = process.env.BASE_PATH ?? '/'

// 收音音節的快取名稱，src/lib/pwa.ts 背景下載時寫進同一個快取，兩邊要一致
const FINAL_AUDIO_CACHE = 'audio-final-v1'

export default defineConfig({
  base,
  // 顯示在「進度」頁最底下，用來確認手機上的 App 已經更新到最新版
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // 自己在 src/lib/pwa.ts 註冊，才能在切回 App 時主動檢查更新
      injectRegister: false,
      includeAssets: ['icon.svg'],
      // 發音音檔也要進離線快取（約 480 個、2MB），不然裝成 App 後沒網路就啞了。
      //
      // 但聽寫用的收音音節（audio/final/，2786 個、12MB）不能放進安裝包：新版要整包下載完才會生效，
      // iOS 只要把 App 切走或有一個檔案失敗就從頭來，結果主畫面的 App 永遠更新不完。
      // 所以它們改成用到才抓、抓過就留著，另外 pwa.ts 會在背景慢慢把全部抓下來。
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,mp3}'],
        globIgnores: ['**/audio/final/**'],
        runtimeCaching: [
          {
            urlPattern: /\/audio\/final\/[^/]+\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: FINAL_AUDIO_CACHE,
              // <audio> 會用 Range 請求，快取裡要存完整的 200 回應才能拿來切
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      manifest: {
        name: '韓文字母練習',
        short_name: '韓文字母',
        description: '從零開始學會韓文 40 個字母與拼音組合',
        lang: 'zh-Hant',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
