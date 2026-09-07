/**
 * 用瀏覽器內建的語音合成唸韓文，這樣不用帶任何音檔。
 * iOS 內建 ko-KR 語音（Yuna），Android / macOS / Windows 也都有。
 *
 * iOS Safari 的兩個雷：
 *  1. getVoices() 一開始是空陣列，要等 voiceschanged 事件。
 *  2. 第一次 speak() 必須發生在使用者手勢的同步流程裡，否則整個語音引擎會靜音。
 *     所以 warmUp() 要在第一次點擊時呼叫。
 */

let cachedVoice: SpeechSynthesisVoice | null = null
let warmedUp = false

export const speechSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

function pickKoreanVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  return (
    voices.find((v) => v.lang === 'ko-KR') ??
    voices.find((v) => v.lang.replace('_', '-').startsWith('ko')) ??
    null
  )
}

if (speechSupported()) {
  const refresh = () => {
    cachedVoice = pickKoreanVoice()
  }
  refresh()
  window.speechSynthesis.addEventListener('voiceschanged', refresh)
}

/** 在第一個使用者手勢裡呼叫一次，解鎖 iOS 的語音引擎 */
export function warmUp(): void {
  if (warmedUp || !speechSupported()) return
  warmedUp = true
  const silent = new SpeechSynthesisUtterance('')
  silent.volume = 0
  window.speechSynthesis.speak(silent)
}

export interface SpeakOptions {
  /** 0.1 ~ 10，預設放慢到 0.85 方便跟著念 */
  rate?: number
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!speechSupported() || !text) return
  warmUp()
  const synth = window.speechSynthesis
  // 連點時不要排隊，直接蓋掉前一個
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  utterance.rate = options.rate ?? 0.85
  if (!cachedVoice) cachedVoice = pickKoreanVoice()
  if (cachedVoice) utterance.voice = cachedVoice
  synth.speak(utterance)
}

/** 系統上到底有沒有韓文語音 — 沒有的話介面上要提醒使用者 */
export function hasKoreanVoice(): boolean {
  if (!speechSupported()) return false
  if (!cachedVoice) cachedVoice = pickKoreanVoice()
  // 語音清單還沒載入時先當作有，避免一開啟就跳警告
  return cachedVoice !== null || window.speechSynthesis.getVoices().length === 0
}
