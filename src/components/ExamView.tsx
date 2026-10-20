import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { VOCAB_WEEKS, WORD_KIND_LABEL, wordKind, type WordKind } from '../data/vocab'
import { ORDER_ROWS, SENTENCE_TOPIC_COUNT, type OrderRowId } from '../data/exam'
import { LETTER_BY_CHAR, letterSound } from '../data/hangul'
import {
  EXAM_SESSION_SIZE,
  EXAM_WEEKS,
  LISTEN_LABEL,
  SECTION_LABEL,
  blankSession,
  checkTyped,
  examWords,
  itemFromId,
  listenSession,
  rowSession,
  sentenceSession,
  splitLetters,
  vocabSession,
  type ExamItem,
  type ExamSection,
  type ListenMode,
} from '../lib/exam'
import { shuffle } from '../lib/mastery'
import { compose } from '../lib/syllable'
import { speak, speakSequence, stopSpeaking, unlock } from '../lib/speech'
import { HandwritingPad } from './HandwritingPad'
import type { ProgressState } from '../hooks/useProgress'
import { useExamPrefs, type AnswerMode } from '../hooks/useExamPrefs'

interface Props {
  state: ProgressState
  record: (targets: string[], correct: boolean) => void
  recordVocab: (words: string[], correct: boolean) => void
}

interface Session {
  title: string
  items: ExamItem[]
  /** 「再來一輪」要重抽的話怎麼抽；錯題重練這種固定題目的就沒有 */
  again?: () => ExamItem[]
}

const KINDS: WordKind[] = ['hanja', 'loan', 'native']
const SECTIONS: ExamSection[] = ['vocab', 'listen', 'sentence', 'order']

/**
 * 期中考複習：題目照考卷的樣子出（給漢字／英文／中文寫韓文、聽了寫下來、照順序默寫字母），
 * 可以手寫再自己對答案，也可以用韓文鍵盤打字自動改。答錯的會進錯題本。
 */
export function ExamView({ state, record, recordVocab }: Props) {
  const { prefs, update, markResult } = useExamPrefs()
  const [session, setSession] = useState<Session | null>(null)
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])

  const begin = (next: Session) => {
    unlock()
    if (next.items.length === 0) return
    setSession(next)
    setIndex(0)
    setResults([])
  }

  const grade = (item: ExamItem, correct: boolean) => {
    if (item.scoring?.kind === 'vocab') recordVocab([item.scoring.ko], correct)
    else if (item.scoring?.kind === 'letters') record(item.scoring.targets, correct)
    markResult(item.id, correct)
    setResults((r) => [...r, correct])
    setIndex((i) => i + 1)
  }

  // ── 結算 ────────────────────────────────────────────────────
  if (session && index >= session.items.length) {
    const missed = session.items.filter((_, i) => !results[i])
    return (
      <Summary
        session={session}
        results={results}
        onRetryMissed={
          missed.length > 0
            ? () => begin({ title: session.title + '・錯的再練', items: shuffle(missed) })
            : undefined
        }
        onAgain={session.again ? () => begin({ ...session, items: session.again!() }) : undefined}
        onExit={() => setSession(null)}
      />
    )
  }

  // ── 作答中 ──────────────────────────────────────────────────
  if (session) {
    const item = session.items[index]
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
        {/* 換題就換 key，畫框和輸入框整個重來 */}
        <Question
          key={index}
          item={item}
          mode={prefs.answer}
          onGrade={(correct) => grade(item, correct)}
        />
      </div>
    )
  }

  // ── 選單 ────────────────────────────────────────────────────
  return <Home prefs={prefs} update={update} state={state} onBegin={begin} />
}

// ═══════════════════════════════════════════════════════════════
// 選單
// ═══════════════════════════════════════════════════════════════

function Home({
  prefs,
  update,
  state,
  onBegin,
}: {
  prefs: ReturnType<typeof useExamPrefs>['prefs']
  update: ReturnType<typeof useExamPrefs>['update']
  state: ProgressState
  onBegin: (s: Session) => void
}) {
  const words = useMemo(() => examWords(prefs.weeks, prefs.kinds), [prefs.weeks, prefs.kinds])
  const wrongItems = useMemo(
    () => prefs.wrong.map(itemFromId).filter((it): it is ExamItem => it !== null),
    [prefs.wrong],
  )

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const vocab = () => vocabSession(examWords(prefs.weeks, prefs.kinds), state.vocabScores)
  const listen = () => listenSession(prefs.listen, prefs.weeks, state.vocabScores, state.scores)
  const blanks = () => blankSession(prefs.rows, new Set(prefs.wrong))
  const rows = () => rowSession(prefs.rows)

  return (
    <div className="space-y-4">
      <Segmented<AnswerMode>
        value={prefs.answer}
        options={[
          ['hand', '✍️ 手寫・自己對'],
          ['type', '⌨️ 打字・自動改'],
        ]}
        onChange={(answer) => update({ answer })}
      />
      {prefs.answer === 'type' && (
        <p className="-mt-2 text-xs leading-relaxed text-ink-4">
          要先在 iPhone 加韓文鍵盤：設定 → 一般 → 鍵盤 → 新增鍵盤 → 韓文（標準）。
        </p>
      )}

      {wrongItems.length > 0 && (
        <Card title={`錯題本・${wrongItems.length} 題`}>
          <p className="text-xs leading-relaxed text-ink-3">
            {SECTIONS.map((s) => [s, wrongItems.filter((it) => it.section === s).length] as const)
              .filter(([, n]) => n > 0)
              .map(([s, n]) => `${SECTION_LABEL[s]} ${n}`)
              .join('・')}
            　答對就會從這裡消失。
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => update({ wrong: [] })}
              className="rounded-xl border border-line px-4 py-3 text-sm text-ink-3 active:bg-surface-3"
            >
              清空
            </button>
            <StartButton
              label={`練錯題（${Math.min(wrongItems.length, EXAM_SESSION_SIZE)} 題）`}
              onClick={() =>
                onBegin({
                  title: '錯題本',
                  items: shuffle(wrongItems).slice(0, EXAM_SESSION_SIZE),
                })
              }
            />
          </div>
        </Card>
      )}

      <Card title="單字" hint="漢字語：給漢字寫韓文和中文意思・外來語：給英文寫韓文・固有語：給中文寫韓文">
        <ChipRow>
          {KINDS.map((k) => (
            <Chip key={k} on={prefs.kinds.includes(k)} onClick={() => update({ kinds: toggle(prefs.kinds, k) })}>
              {WORD_KIND_LABEL[k]}
              <span className="ml-1 text-[10px] opacity-70">{examWords(prefs.weeks, [k]).length}</span>
            </Chip>
          ))}
        </ChipRow>
        <WeekChips weeks={prefs.weeks} onToggle={(w) => update({ weeks: toggle(prefs.weeks, w).sort((a, b) => a - b) })} />
        <div className="mt-3 flex">
        <StartButton
          label={
            words.length === 0
              ? '沒有符合的單字'
              : `開始（${Math.min(words.length, EXAM_SESSION_SIZE)} 題・共 ${words.length} 字）`
          }
          disabled={words.length === 0}
          onClick={() => onBegin({ title: '單字', items: vocab(), again: vocab })}
        />
        </div>
        <WordTable weeks={prefs.weeks} />
      </Card>

      <Card title="聽力" hint="念一個字或單字，寫下來。單字用上面勾的週數。">
        <Segmented<ListenMode>
          value={prefs.listen}
          options={(['word', 'syllable', 'mix'] as const).map((m) => [m, LISTEN_LABEL[m]])}
          onChange={(listen) => update({ listen })}
        />
        <div className="mt-3 flex">
          <StartButton
            label={`開始（${EXAM_SESSION_SIZE} 題）`}
            onClick={() => onBegin({ title: '聽力', items: listen(), again: listen })}
          />
        </div>
      </Card>

      <Card title="造句" hint="看中文寫出韓文句子，可以換名詞的句型每次換不同的字。打字模式不管空格和標點，但空格不一樣會提醒你。">
        <StartButton
          label={`開始（${SENTENCE_TOPIC_COUNT} 種句型・${sentenceSession().length} 題）`}
          onClick={() => onBegin({ title: '造句', items: sentenceSession(), again: sentenceSession })}
        />
      </Card>

      <Card title="字母順序" hint="整排默寫：照順序把整組寫出來・挖空：一排裡缺一個，寫出缺的那個">
        <ChipRow>
          {ORDER_ROWS.map((r) => (
            <Chip key={r.id} on={prefs.rows.includes(r.id)} onClick={() => update({ rows: toggle(prefs.rows, r.id) })}>
              {r.title}
              <span className="ml-1 text-[10px] opacity-70">{r.chars.length}</span>
            </Chip>
          ))}
        </ChipRow>
        <div className="mt-3 flex gap-2">
          <StartButton
            label="整排默寫"
            disabled={prefs.rows.length === 0}
            onClick={() => onBegin({ title: '整排默寫', items: rows(), again: rows })}
          />
          <StartButton
            label="挖空"
            disabled={prefs.rows.length === 0}
            onClick={() => onBegin({ title: '挖空', items: blanks(), again: blanks })}
          />
        </div>
        <OrderSheet />
      </Card>
    </div>
  )
}

function WeekChips({ weeks, onToggle }: { weeks: number[]; onToggle: (w: number) => void }) {
  return (
    <div className="mt-2 grid grid-cols-7 gap-1">
      {EXAM_WEEKS.map((w) => {
        const count = VOCAB_WEEKS.find((v) => v.week === w)?.words.length ?? 0
        const on = weeks.includes(w)
        return (
          <button
            key={w}
            type="button"
            disabled={count === 0}
            onClick={() => onToggle(w)}
            aria-pressed={on}
            className={`rounded-lg border py-1.5 text-xs active:scale-95 ${
              count === 0
                ? 'border-line-soft bg-sunken/70 text-ink-5'
                : on
                  ? 'border-accent bg-accent/20 text-accent'
                  : 'border-line bg-surface text-ink-3'
            }`}
          >
            W{w}
          </button>
        )
      })}
    </div>
  )
}

/** 分類表：照分類列出範圍內的字，順便讓人檢查分類對不對 */
function WordTable({ weeks }: { weeks: number[] }) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full text-center text-xs text-accent">
        看分類表 ▾
      </button>
    )
  }
  return (
    <div className="mt-3 space-y-3">
      {KINDS.map((k) => {
        const list = examWords(weeks, [k])
        return (
          <section key={k}>
            <h3 className="mb-1 text-xs font-semibold text-ink-3">
              {WORD_KIND_LABEL[k]}・{list.length}
            </h3>
            <div className="divide-y divide-line-soft rounded-xl bg-sunken">
              {list.map((w) => (
                <button
                  key={w.ko}
                  type="button"
                  onClick={() => speak(w.ko)}
                  className="flex w-full items-baseline gap-3 px-3 py-1.5 text-left active:bg-surface-3"
                >
                  <span className="font-kr w-24 shrink-0 text-base text-ink">{w.ko}</span>
                  {wordKind(w) !== 'native' && (
                    <span className="shrink-0 text-sm text-accent">{w.hanja ?? w.en}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-right text-xs text-ink-3">{w.meaning}</span>
                </button>
              ))}
            </div>
          </section>
        )
      })}
      <button type="button" onClick={() => setOpen(false)} className="w-full text-center text-xs text-ink-4">
        收起 ▴
      </button>
    </div>
  )
}

/** 字母順序表，點一下聽、整排可以連著念 */
function OrderSheet() {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState<{ row: OrderRowId; index: number } | null>(null)

  useEffect(() => () => stopSpeaking(), [])

  // 子音用代表音節（ㄱ → 가），終聲放在 아 底下（ㄱ → 악）才聽得出收音
  const soundOf = (row: OrderRowId, char: string): string => {
    if (row === 'final') return compose('ㅇ', 'ㅏ', char) ?? char
    const letter = LETTER_BY_CHAR.get(char)
    return letter ? letterSound(letter) : char
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full text-center text-xs text-accent">
        看順序表 ▾
      </button>
    )
  }
  return (
    <div className="mt-3 space-y-3">
      {ORDER_ROWS.map((r) => (
        <section key={r.id}>
          <div className="mb-1 flex items-baseline justify-between">
            <h3 className="text-xs font-semibold text-ink-3">
              {r.title}・{r.chars.length}
            </h3>
            <button
              type="button"
              onClick={() =>
                speakSequence(
                  r.chars.map((c) => soundOf(r.id, c)),
                  {
                    gap: 350,
                    onStep: (i) => setPlaying(i < 0 ? null : { row: r.id, index: i }),
                  },
                )
              }
              className="text-xs text-accent"
            >
              ▶ 整排念
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {r.chars.map((c, i) => {
              const lit = playing?.row === r.id && playing.index === i
              return (
                <button
                  key={c + i}
                  type="button"
                  onClick={() => speak(soundOf(r.id, c))}
                  className={`font-kr flex h-11 w-11 flex-col items-center justify-center rounded-lg border text-lg leading-none active:scale-95 ${
                    lit ? 'border-accent bg-accent/20 text-accent' : 'border-line bg-surface text-ink'
                  }`}
                >
                  {c}
                  <span className="mt-0.5 font-sans text-[9px] text-ink-4">{r.roman[i]}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
      <button type="button" onClick={() => setOpen(false)} className="w-full text-center text-xs text-ink-4">
        收起 ▴
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 一題
// ═══════════════════════════════════════════════════════════════

function Question({
  item,
  mode,
  onGrade,
}: {
  item: ExamItem
  mode: AnswerMode
  onGrade: (correct: boolean) => void
}) {
  const [revealed, setRevealed] = useState(false)
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 聽力題一出現就先念一次
  useEffect(() => {
    if (item.speak) speak(item.speak)
  }, [item])

  const typedLetters = item.row ? splitLetters(typed) : []
  const typedCheck = mode === 'type' && !item.row ? checkTyped(typed, item) : null
  const autoCorrect =
    mode === 'type' &&
    (item.row
      ? typedLetters.length === item.row.length && item.row.every((c, i) => typedLetters[i] === c)
      : typedCheck !== 'wrong')
  const spacingOff = typedCheck === 'spacing'

  const submit = () => {
    if (mode === 'type' && !typed.trim()) return
    inputRef.current?.blur()
    setRevealed(true)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-4 text-center">
        <div className="text-xs text-ink-3">{item.label}</div>
        {item.prompt && (
          <div
            className={`mt-2 break-keep text-ink ${
              item.section === 'sentence'
                  ? 'text-xl leading-relaxed'
                  : 'text-4xl'
            }`}
          >
            {item.prompt}
          </div>
        )}
        {item.sequence && (
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {item.sequence.chars.map((c, i) =>
              i === item.sequence!.blank ? (
                <span
                  key={i}
                  className="flex h-9 w-8 items-center justify-center rounded border-2 border-dashed border-accent text-lg font-semibold text-accent"
                >
                  ？
                </span>
              ) : (
                <span key={i} className="font-kr flex h-9 w-8 items-center justify-center rounded bg-sunken text-xl text-ink">
                  {c}
                </span>
              ),
            )}
          </div>
        )}
        {item.row && (
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {item.row.map((_, i) => (
              <span key={i} className="h-6 w-6 rounded border border-dashed border-line-strong text-[10px] leading-6 text-ink-4">
                {i + 1}
              </span>
            ))}
          </div>
        )}
        {item.speak && (
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => speak(item.speak!)}
              className="flex-1 rounded-xl border border-line bg-surface-2 py-3 text-ink-2 active:bg-surface-3"
            >
              🔊 再聽一次
            </button>
            <button
              type="button"
              onClick={() => speak(item.speak!, { rate: 0.7 })}
              className="flex-1 rounded-xl border border-line bg-surface-2 py-3 text-ink-2 active:bg-surface-3"
            >
              🐢 慢慢念
            </button>
          </div>
        )}
      </div>

      {mode === 'hand' ? (
        <HandwritingPad locked={revealed} />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            readOnly={revealed}
            lang="ko"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder={item.row ? '用空格隔開，例如 ㅏ ㅑ ㅓ' : '用韓文鍵盤打'}
            className={`font-kr w-full rounded-xl border bg-surface px-4 py-3 text-2xl text-ink outline-none placeholder:font-sans placeholder:text-base placeholder:text-ink-5 focus:border-accent ${
              revealed ? (autoCorrect ? 'border-ok' : 'border-bad') : 'border-line'
            }`}
          />
        </form>
      )}

      {!revealed ? (
        <button
          type="button"
          onClick={submit}
          disabled={mode === 'type' && !typed.trim()}
          className="w-full rounded-xl bg-accent-mid py-4 font-semibold text-oncolor active:bg-accent-deep disabled:opacity-50"
        >
          {mode === 'hand' ? '寫好了，看答案' : '對答案'}
        </button>
      ) : (
        <div className="animate-pop space-y-3">
          <Answer item={item} typedLetters={mode === 'type' ? typedLetters : null} />
          {mode === 'hand' ? (
            <>
              <p className="text-center text-xs text-ink-4">
                {item.alsoCheck ? '韓文和中文意思都對才算對' : '跟你寫的比比看，每一筆都對才算對'}
              </p>
              <GradeButtons onGrade={onGrade} />
            </>
          ) : (
            <TypedVerdict
              correct={autoCorrect}
              spacingOff={spacingOff}
              alsoCheck={item.alsoCheck}
              onGrade={onGrade}
            />
          )}
        </div>
      )}
    </div>
  )
}

function Answer({ item, typedLetters }: { item: ExamItem; typedLetters: string[] | null }) {
  return (
    <button
      type="button"
      onClick={() => speak(item.speak ?? item.answer)}
      className="w-full rounded-2xl border border-line bg-surface p-4 text-center active:bg-surface-3"
    >
      {item.row ? (
        <div className="flex flex-wrap justify-center gap-1">
          {item.row.map((c, i) => {
            const wrong = typedLetters !== null && typedLetters[i] !== c
            return (
              <span
                key={i}
                className={`font-kr flex w-8 flex-col items-center rounded border py-1 text-xl leading-none ${
                  typedLetters === null
                    ? 'border-line text-ink'
                    : wrong
                      ? 'border-bad bg-bad/10 text-ink'
                      : 'border-ok/60 text-ink'
                }`}
              >
                {c}
                {wrong && <span className="mt-1 text-xs text-bad-text">{typedLetters[i] ?? '–'}</span>}
              </span>
            )
          })}
        </div>
      ) : (
        <div className={`font-kr text-ink ${item.section === 'sentence' ? 'text-2xl leading-relaxed' : 'text-5xl leading-tight'}`}>
          {item.answer}
        </div>
      )}
      {item.detail && <div className="mt-1 text-sm text-accent">{item.detail}</div>}
      {item.alts && <div className="font-kr mt-1 text-xs text-ink-3">也可以：{item.alts.join('／')}</div>}
      {typedLetters && item.row && typedLetters.length > item.row.length && (
        <div className="mt-1 text-xs text-bad-text">多打了 {typedLetters.length - item.row.length} 個</div>
      )}
    </button>
  )
}

function GradeButtons({ onGrade, wrongLabel = '寫錯了', rightLabel = '寫對了' }: {
  onGrade: (correct: boolean) => void
  wrongLabel?: string
  rightLabel?: string
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onGrade(false)}
        className="flex-1 rounded-xl bg-bad-deep py-4 font-semibold text-oncolor active:bg-bad-press"
      >
        {wrongLabel}
      </button>
      <button
        type="button"
        onClick={() => onGrade(true)}
        className="flex-1 rounded-xl bg-ok-deep py-4 font-semibold text-oncolor active:bg-ok-press"
      >
        {rightLabel}
      </button>
    </div>
  )
}

function TypedVerdict({
  correct,
  spacingOff,
  alsoCheck,
  onGrade,
}: {
  correct: boolean
  spacingOff: boolean
  alsoCheck?: string
  onGrade: (correct: boolean) => void
}) {
  if (!correct) {
    return (
      <>
        <p className="text-center text-sm font-semibold text-bad-text">✗ 不對</p>
        <button
          type="button"
          onClick={() => onGrade(false)}
          className="w-full rounded-xl bg-accent-mid py-4 font-semibold text-oncolor active:bg-accent-deep"
        >
          下一題
        </button>
        <button type="button" onClick={() => onGrade(true)} className="w-full text-center text-xs text-ink-4">
          其實是打錯字，算我對
        </button>
      </>
    )
  }
  if (alsoCheck) {
    return (
      <>
        <p className="text-center text-sm text-ok-text">✓ 韓文對了。中文意思也寫得出來嗎？</p>
        <GradeButtons onGrade={onGrade} wrongLabel="意思不會" rightLabel="意思也會" />
      </>
    )
  }
  return (
    <>
      <p className="text-center text-sm font-semibold text-ok-text">✓ 答對了</p>
      {spacingOff && <p className="text-center text-xs text-warn-text">字都對，但空格和答案不一樣，考試要注意</p>}
      <button
        type="button"
        onClick={() => onGrade(true)}
        className="w-full rounded-xl bg-accent-mid py-4 font-semibold text-oncolor active:bg-accent-deep"
      >
        下一題
      </button>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// 結算
// ═══════════════════════════════════════════════════════════════

function Summary({
  session,
  results,
  onRetryMissed,
  onAgain,
  onExit,
}: {
  session: Session
  results: boolean[]
  onRetryMissed?: () => void
  onAgain?: () => void
  onExit: () => void
}) {
  const correctCount = results.filter(Boolean).length
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 text-center">
        <div className="text-sm text-ink-3">{session.title}</div>
        <div className="mt-1 text-4xl font-semibold text-ink">
          {correctCount} <span className="text-xl text-ink-4">/ {session.items.length}</span>
        </div>
      </div>

      <section className="space-y-2">
        {session.items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => speak(item.speak ?? item.answer)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left active:bg-surface-3 ${
              results[i] ? 'border-line-soft bg-surface' : 'border-bad/50 bg-bad/10'
            }`}
          >
            <span className={`shrink-0 text-sm ${results[i] ? 'text-ok-text' : 'text-bad-text'}`}>
              {results[i] ? '✓' : '✗'}
            </span>
            <span className="font-kr min-w-0 shrink-0 text-lg text-ink">
              {item.row ? item.row.join(' ') : item.answer}
            </span>
            <span className="min-w-0 flex-1 truncate text-right text-xs text-ink-3">
              {item.prompt ?? item.detail ?? ''}
            </span>
          </button>
        ))}
      </section>

      <div className="space-y-2">
        {onRetryMissed && (
          <button
            type="button"
            onClick={onRetryMissed}
            className="w-full rounded-xl bg-bad-deep py-3 font-semibold text-oncolor active:bg-bad-press"
          >
            錯的再練一次
          </button>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex-1 rounded-xl border border-line bg-surface py-3 text-ink-2 active:bg-surface-3"
          >
            回期中考
          </button>
          {onAgain && (
            <button
              type="button"
              onClick={onAgain}
              className="flex-1 rounded-xl bg-accent-mid py-3 font-semibold text-oncolor active:bg-accent-deep"
            >
              再來一輪
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 小元件
// ═══════════════════════════════════════════════════════════════

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {hint && <p className="mt-1 text-xs leading-relaxed text-ink-4">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function StartButton({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full flex-1 rounded-xl bg-accent-mid py-3 font-semibold text-oncolor active:bg-accent-deep disabled:opacity-50"
    >
      {label}
    </button>
  )
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3 py-1 text-sm active:scale-95 ${
        on ? 'border-accent bg-accent/20 text-accent' : 'border-line bg-surface text-ink-3'
      }`}
    >
      {children}
    </button>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: (readonly [T, string])[]
  onChange: (v: T) => void
}) {
  return (
    <div className="grid gap-1 rounded-xl bg-sunken p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-lg py-2 text-sm font-semibold ${value === v ? 'bg-surface-2 text-ink' : 'text-ink-4'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
