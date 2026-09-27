import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { wordsOfWeeks, type VocabWord } from '../data/vocab'
import { LETTERS, LETTER_TYPE_LABEL, type LetterType } from '../data/hangul'
import { isMastered, weightedPick } from '../lib/mastery'
import { sessionSize } from '../lib/vocabQuiz'
import { generateSyllables } from '../lib/dictation'
import { SOUND_FINALS, isMedial } from '../lib/syllable'
import { speak, unlock } from '../lib/speech'
import { HandwritingPad } from './HandwritingPad'
import { VocabSummary, WeekPicker } from './VocabView'
import type { ProgressState } from '../hooks/useProgress'
import { useVocabWeeks } from '../hooks/useVocabWeeks'

type Mode = 'word' | 'letter'

/** 字母模式一輪的題數 */
const LETTER_SESSION_SIZE = 12

/** 聽寫自己的介面偏好（模式、勾了哪些字母和收音），一樣不進備份碼 */
const PREFS_KEY = 'hangul.dictation.v2'

interface Prefs {
  mode: Mode
  /** null = 還沒自己勾過，預設用已解鎖的字母 */
  letters: string[] | null
  /** 同上，null = 預設用已解鎖的那幾個代表音 */
  finals: string[] | null
}

function loadPrefs(): Prefs {
  const fallback: Prefs = { mode: 'word', letters: null, finals: null }
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Prefs>
    const known = new Set(LETTERS.map((l) => l.char))
    return {
      mode: parsed.mode === 'letter' ? 'letter' : 'word',
      letters: Array.isArray(parsed.letters)
        ? parsed.letters.filter((c): c is string => typeof c === 'string' && known.has(c))
        : null,
      finals: Array.isArray(parsed.finals)
        ? parsed.finals.filter((c): c is string => (SOUND_FINALS as readonly string[]).includes(c))
        : null,
    }
  } catch {
    return fallback
  }
}

interface Props {
  state: ProgressState
  unlockedChars: string[]
  record: (targets: string[], correct: boolean) => void
  recordVocab: (words: string[], correct: boolean) => void
}

/** 一題聽寫：念什麼、答案長怎樣、答完要記到哪 */
interface Item {
  speak: string
  answer: string
  roman: string
  /** 答案底下的小字：單字是中文意思，音節是拆字 */
  detail: string
  targets: string[]
}

interface Session {
  mode: Mode
  items: Item[]
  /** 開場時各單字的分數，單字模式結算時拿來比對誰進步了 */
  before: Record<string, number>
}

const toggled = (list: string[], char: string): string[] =>
  list.includes(char) ? list.filter((c) => c !== char) : [...list, char]

/** 抽一輪要聽寫的字：分數低的優先，同一個字不會連續出兩次 */
function pickWords(words: VocabWord[], scores: Record<string, number>, count: number): VocabWord[] {
  const byKo = new Map(words.map((w) => [w.ko, w]))
  const keys = words.map((w) => w.ko)
  const out: VocabWord[] = []
  let guard = 0
  while (out.length < count && guard++ < count * 20) {
    const ko = weightedPick(keys, scores)
    if (keys.length > 1 && out[out.length - 1]?.ko === ko) continue
    out.push(byKo.get(ko)!)
  }
  return out
}

/**
 * 聽寫：念一個單字或音節，在畫框裡手寫出來，寫完看答案自己改。
 * 單字模式的分數和「單字」分頁記在一起；字母模式則算進字母的熟練度 ——
 * 會寫當然也算會。
 */
export function DictationView({ state, unlockedChars, record, recordVocab }: Props) {
  const { weeks, setWeeks, toggle: toggleWeek } = useVocabWeeks()
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [session, setSession] = useState<Session | null>(null)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      // 寫不進去就算了，大不了下次重選
    }
  }, [prefs])

  const words = useMemo(() => wordsOfWeeks(weeks), [weeks])
  const letters = prefs.letters ?? unlockedChars
  const setLetters = (next: string[]) => setPrefs((p) => ({ ...p, letters: next }))
  const finals = prefs.finals ?? SOUND_FINALS.filter((f) => unlockedChars.includes(f))
  const setFinals = (next: string[]) => setPrefs((p) => ({ ...p, finals: next }))
  // 用 functional update，連點好幾個字母時才不會互相蓋掉
  const toggleLetter = (char: string) =>
    setPrefs((p) => ({ ...p, letters: toggled(p.letters ?? unlockedChars, char) }))
  const toggleFinal = (char: string) =>
    setPrefs((p) => ({
      ...p,
      finals: toggled(p.finals ?? SOUND_FINALS.filter((f) => unlockedChars.includes(f)), char),
    }))

  const start = useCallback(() => {
    unlock()
    let items: Item[]
    if (prefs.mode === 'word') {
      items = pickWords(words, state.vocabScores, sessionSize(words.length)).map((w) => ({
        speak: w.ko,
        answer: w.ko,
        roman: w.roman,
        detail: w.meaning,
        targets: [w.ko],
      }))
    } else {
      items = generateSyllables(letters, finals, state.scores, LETTER_SESSION_SIZE).map((s) => ({
        speak: s.text,
        answer: s.text,
        roman: s.roman,
        detail: s.parts.join(' + '),
        targets: s.targets,
      }))
    }
    if (items.length === 0) return
    setSession({ mode: prefs.mode, items, before: { ...state.vocabScores } })
    setIndex(0)
    setRevealed(false)
    setResults([])
  }, [prefs.mode, words, letters, finals, state.vocabScores, state.scores])

  const item = session?.items[index]

  // 每題一出現就先念一次
  useEffect(() => {
    if (item) speak(item.speak)
  }, [item, index])

  const grade = (correct: boolean) => {
    if (!session || !item) return
    if (session.mode === 'word') recordVocab(item.targets, correct)
    // 還沒解鎖的字母可以拿來練，但不計分，免得打亂闖關的順序
    else record(item.targets.filter((c) => unlockedChars.includes(c)), correct)
    setResults((r) => [...r, correct])
    setIndex((i) => i + 1)
    setRevealed(false)
  }

  // ── 結算 ────────────────────────────────────────────────────
  if (session && index >= session.items.length) {
    const correctCount = results.filter(Boolean).length
    if (session.mode === 'word') {
      return (
        <VocabSummary
          targets={session.items.map((i) => i.answer)}
          before={session.before}
          total={session.items.length}
          state={state}
          correctCount={correctCount}
          onAgain={start}
          onExit={() => setSession(null)}
        />
      )
    }
    return (
      <SyllableSummary
        items={session.items}
        results={results}
        onAgain={start}
        onExit={() => setSession(null)}
      />
    )
  }

  // ── 聽寫中 ──────────────────────────────────────────────────
  if (session && item) {
    const total = session.items.length
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-xs text-ink-3">
          <span>
            {index + 1} / {total}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-accent transition-[width]"
              style={{ width: `${(index / total) * 100}%` }}
            />
          </div>
          <button type="button" onClick={() => setSession(null)} className="text-ink-4">
            結束
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => speak(item.speak)}
            className="flex-1 rounded-xl border border-line bg-surface py-3 text-ink-2 active:bg-surface-3"
          >
            🔊 再聽一次
          </button>
          <button
            type="button"
            onClick={() => speak(item.speak, { rate: 0.7 })}
            className="flex-1 rounded-xl border border-line bg-surface py-3 text-ink-2 active:bg-surface-3"
          >
            🐢 慢慢念
          </button>
        </div>

        {/* 換題就換 key，畫框整個重來 */}
        <HandwritingPad key={index} locked={revealed} />

        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="w-full rounded-xl bg-accent-mid py-4 font-semibold text-oncolor active:bg-accent-deep"
          >
            寫好了，看答案
          </button>
        ) : (
          <div className="animate-pop space-y-3">
            <button
              type="button"
              onClick={() => speak(item.speak)}
              className="w-full rounded-2xl border border-line bg-surface p-4 text-center active:bg-surface-3"
            >
              <div className="font-kr text-5xl leading-tight text-ink">{item.answer}</div>
              <div className="mt-1 text-sm text-accent">{item.roman}</div>
              <div className={`text-sm text-ink-2 ${session.mode === 'letter' ? 'font-kr' : ''}`}>
                {item.detail}
              </div>
            </button>
            <p className="text-center text-xs text-ink-4">跟你寫的比比看，每一筆都對才算對</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => grade(false)}
                className="flex-1 rounded-xl bg-bad-deep py-4 font-semibold text-oncolor active:bg-bad-press"
              >
                寫錯了 −1
              </button>
              <button
                type="button"
                onClick={() => grade(true)}
                className="flex-1 rounded-xl bg-ok-deep py-4 font-semibold text-oncolor active:bg-ok-press"
              >
                寫對了 +1
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── 設定 ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-sunken p-1">
        {(
          [
            ['word', '單字'],
            ['letter', '字母'],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setPrefs((p) => ({ ...p, mode }))}
            aria-pressed={prefs.mode === mode}
            className={`rounded-lg py-2 text-sm font-semibold ${
              prefs.mode === mode ? 'bg-surface-2 text-ink' : 'text-ink-4'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {prefs.mode === 'word' ? (
        <WordSetup
          state={state}
          weeks={weeks}
          words={words}
          onToggle={toggleWeek}
          onSet={setWeeks}
          onStart={start}
        />
      ) : (
        <LetterSetup
          letters={letters}
          unlockedChars={unlockedChars}
          finals={finals}
          onSet={setLetters}
          onToggle={toggleLetter}
          onSetFinals={setFinals}
          onToggleFinal={toggleFinal}
          onStart={start}
        />
      )}
    </div>
  )
}

function StartCard({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-line bg-surface p-4">{children}</div>
}

function StartButton({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-3 w-full rounded-xl bg-accent-mid py-3 font-semibold text-oncolor active:bg-accent-deep disabled:opacity-50"
    >
      {label}
    </button>
  )
}

function WordSetup({
  state,
  weeks,
  words,
  onToggle,
  onSet,
  onStart,
}: {
  state: ProgressState
  weeks: number[]
  words: VocabWord[]
  onToggle: (week: number) => void
  onSet: (weeks: number[]) => void
  onStart: () => void
}) {
  const mastered = words.filter((w) => isMastered(state.vocabScores[w.ko])).length
  return (
    <>
      <p className="text-xs leading-relaxed text-ink-3">
        念一個單字，在畫框裡用手指寫出來，寫完看答案自己改。分數和「單字」分頁記在一起，
        勾選的週數也是共用的。
      </p>

      <WeekPicker weeks={weeks} onToggle={onToggle} onSet={onSet} />

      <StartCard>
        {words.length === 0 ? (
          <p className="text-sm text-ink-4">還沒勾選任何一週。</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-2">
              已選 {weeks.length} 週・共 <span className="font-semibold text-ink">{words.length}</span>{' '}
              個單字・已精通 {mastered} 個
            </p>
            <StartButton label={'開始聽寫（' + sessionSize(words.length) + ' 題）'} onClick={onStart} />
          </>
        )}
      </StartCard>
    </>
  )
}

const TYPE_ORDER: LetterType[] = ['consonant', 'tenseConsonant', 'vowel', 'compoundVowel']

function LetterButton({
  char,
  on,
  locked,
  onClick,
}: {
  char: string
  on: boolean
  locked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`font-kr relative aspect-square rounded-lg border text-xl active:scale-95 ${
        on ? 'border-accent bg-accent/20 text-accent' : 'border-line bg-surface text-ink-3'
      }`}
    >
      {char}
      {locked && <span className="absolute right-0.5 top-0 text-[8px]">🔒</span>}
    </button>
  )
}

function LetterSetup({
  letters,
  unlockedChars,
  finals,
  onSet,
  onToggle,
  onSetFinals,
  onToggleFinal,
  onStart,
}: {
  letters: string[]
  unlockedChars: string[]
  finals: string[]
  onSet: (letters: string[]) => void
  onToggle: (char: string) => void
  onSetFinals: (finals: string[]) => void
  onToggleFinal: (char: string) => void
  onStart: () => void
}) {
  const hasVowel = letters.some(isMedial)

  return (
    <>
      <p className="text-xs leading-relaxed text-ink-3">
        勾幾個字母，會用它們拼出音節念給你聽：子音當開頭、母音在中間，收音在下面另外勾。
        只勾母音的話，開頭會用不發音的 ㅇ。還沒解鎖的字母也能選來練，只是不計分。
      </p>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink-2">要考哪些字母</h2>
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={() => onSet(unlockedChars)} className="text-accent">
              已解鎖
            </button>
            <button type="button" onClick={() => onSet(LETTERS.map((l) => l.char))} className="text-accent">
              全選
            </button>
            <button type="button" onClick={() => onSet([])} className="text-ink-4">
              清除
            </button>
          </div>
        </div>

        {TYPE_ORDER.map((type) => (
          <div key={type}>
            <div className="mb-1 text-xs text-ink-4">{LETTER_TYPE_LABEL[type]}</div>
            <div className="grid grid-cols-7 gap-1.5">
              {LETTERS.filter((l) => l.type === type).map((l) => {
                return (
                  <LetterButton
                    key={l.char}
                    char={l.char}
                    on={letters.includes(l.char)}
                    locked={!unlockedChars.includes(l.char)}
                    onClick={() => onToggle(l.char)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink-2">收音（尾音）</h2>
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={() => onSetFinals([...SOUND_FINALS])} className="text-accent">
              全選
            </button>
            <button type="button" onClick={() => onSetFinals([])} className="text-ink-4">
              不要收音
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {SOUND_FINALS.map((f) => (
            <LetterButton
              key={f}
              char={f}
              on={finals.includes(f)}
              locked={!unlockedChars.includes(f)}
              onClick={() => onToggleFinal(f)}
            />
          ))}
        </div>
        <p className="text-xs leading-relaxed text-ink-4">
          收音只有這 7 個代表音 —— 其他子音收在下面念起來都會變成這幾個（갓 갖 같 都念 갇），光聽分不出來。
          {finals.length === 0 && '沒勾的話就不會有收音。'}
        </p>
      </section>

      <StartCard>
        {!hasVowel ? (
          <p className="text-sm text-ink-4">至少要勾一個母音才拼得出字。</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-2">
              已選 <span className="font-semibold text-ink">{letters.length}</span> 個字母・
              {finals.length > 0 ? `${finals.length} 個收音` : '不帶收音'}
            </p>
            <StartButton label={'開始聽寫（' + LETTER_SESSION_SIZE + ' 題）'} onClick={onStart} />
          </>
        )}
      </StartCard>
    </>
  )
}

function SyllableSummary({
  items,
  results,
  onAgain,
  onExit,
}: {
  items: Item[]
  results: boolean[]
  onAgain: () => void
  onExit: () => void
}) {
  const correctCount = results.filter(Boolean).length
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 text-center">
        <div className="text-sm text-ink-3">這一輪</div>
        <div className="mt-1 text-4xl font-semibold text-ink">
          {correctCount} <span className="text-xl text-ink-4">/ {items.length}</span>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink-2">這一輪的音節（點一下再聽）</h3>
        <div className="grid grid-cols-3 gap-2">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => speak(item.speak)}
              className={`rounded-xl border p-2 text-center active:scale-95 ${
                results[i] ? 'border-ok/60 bg-ok/10' : 'border-bad/60 bg-bad/10'
              }`}
            >
              <div className="font-kr text-3xl text-ink">{item.answer}</div>
              <div className={`text-xs ${results[i] ? 'text-ok-text' : 'text-bad-text'}`}>
                {results[i] ? '✓' : '✗'} {item.roman}
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onExit}
          className="flex-1 rounded-xl border border-line bg-surface py-3 text-ink-2 active:bg-surface-3"
        >
          換字母
        </button>
        <button
          type="button"
          onClick={onAgain}
          className="flex-1 rounded-xl bg-accent-mid py-3 font-semibold text-oncolor active:bg-accent-deep"
        >
          再來一輪
        </button>
      </div>
    </div>
  )
}
