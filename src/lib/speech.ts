/**
 * 發音播放。
 *
 * 以前是直接丟給瀏覽器內建的語音合成唸，問題是各裝置差太多：系統沒裝韓文語音
 * 時，瀏覽器會拿英文或中文語音去硬念韓文字，出來的聲音跟那個字母一點關係都沒有。
 *
 * 所以改成事先產好的 mp3（scripts/make_audio.py，edge-tts 的 ko-KR-SunHiNeural），
 * App 裡會用到的每一個音 —— 399 個子音母音組合、40 個字母名稱、40 個例詞 ——
 * 全部都有檔，播放時只是播 mp3，每台裝置聽到的完全一樣，離線也能用。
 * 語音合成只留著當萬一的後備。
 *
 * iOS Safari 的雷：第一次播放必須發生在使用者手勢裡，否則之後程式主動播都會被擋。
 * 所以 unlock() 要在第一次點擊時呼叫（App.tsx 的 onPointerDown），而且從頭到尾
 * 共用同一個 <audio> 元素 —— iOS 解鎖的是元素，不是整個頁面。
 */

import manifest from '../data/audio-manifest.json'

const CLIPS = new Set<string>(manifest.keys)

/** 檔名 = 每個字的碼位十六進位，用 - 接起來（和 make_audio.py 同一套規則） */
const clipKey = (text: string): string =>
  Array.from(text)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-')

const clipUrl = (text: string): string => `${import.meta.env.BASE_URL}audio/${clipKey(text)}.mp3`

/** 一小段無聲的 wav，只拿來在使用者手勢裡解鎖 iOS 的音訊 */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='

let audio: HTMLAudioElement | null = null
let unlocked = false
/** 連點時用來判斷「這次播放是不是已經被下一次蓋掉了」 */
let token = 0

function element(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'auto'
  }
  return audio
}

/** 在第一個使用者手勢裡呼叫一次，解鎖 iOS 的音訊與語音引擎 */
export function unlock(): void {
  if (unlocked || typeof window === 'undefined') return
  unlocked = true

  const el = element()
  el.src = SILENT_WAV
  void el.play().catch(() => {})

  if ('speechSynthesis' in window) {
    const silent = new SpeechSynthesisUtterance('')
    silent.volume = 0
    window.speechSynthesis.speak(silent)
  }
}

export interface SpeakOptions {
  /** 播放速度倍率，預設 1（音檔本身已經放慢過） */
  rate?: number
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!text || typeof window === 'undefined') return
  unlock()

  const mine = ++token

  if (CLIPS.has(clipKey(text))) {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    const el = element()
    el.pause()
    el.src = clipUrl(text)
    el.playbackRate = options.rate ?? 1
    void el.play().catch((err: unknown) => {
      // 連點時前一個播放會被中斷而 reject，那是正常的，不要退回語音合成再念一次
      if (mine !== token) return
      if (err instanceof Error && err.name === 'AbortError') return
      speakWithSynthesis(text, options)
    })
    return
  }

  speakWithSynthesis(text, options)
}

// ── 後備：瀏覽器語音合成 ──────────────────────────────────────────────

let cachedVoice: SpeechSynthesisVoice | null = null

const synthesisSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

function pickKoreanVoice(): SpeechSynthesisVoice | null {
  if (!synthesisSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang === 'ko-KR') ??
    voices.find((v) => v.lang.replace('_', '-').startsWith('ko')) ??
    null
  )
}

if (synthesisSupported()) {
  const refresh = () => {
    cachedVoice = pickKoreanVoice()
  }
  refresh()
  window.speechSynthesis.addEventListener('voiceschanged', refresh)
}

function speakWithSynthesis(text: string, options: SpeakOptions): void {
  if (!synthesisSupported()) return
  if (!cachedVoice) cachedVoice = pickKoreanVoice()
  // 沒有韓文語音就乾脆不要出聲 —— 用英文語音念韓文字只會念出誤導人的東西
  if (!cachedVoice) return

  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  utterance.voice = cachedVoice
  utterance.rate = (options.rate ?? 1) * 0.85
  synth.speak(utterance)
}
