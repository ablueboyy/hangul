/**
 * 期中考的範圍：單字考到第幾週、字母要照什麼順序背、造句考哪幾句。
 *
 * 單字本身還是放在 vocab.ts（漢字語標 hanja、外來語標 en），這裡只放考試專用的東西。
 */

/** 期中考單字範圍：第 1 週到第幾週 */
export const EXAM_LAST_WEEK = 7

export type OrderRowId = 'vowel' | 'consonant' | 'tense' | 'compound' | 'final'

export interface OrderRow {
  id: OrderRowId
  title: string
  /** 照考試要背的順序 */
  chars: string[]
  /** 課堂上用的拼音，和 chars 一一對應（不是修正羅馬字：送氣音寫 kk、硬音寫 g） */
  roman: string[]
}

/** 字母要照這個順序默寫（課堂講義的順序） */
export const ORDER_ROWS: OrderRow[] = [
  {
    id: 'vowel',
    title: '基本母音',
    chars: ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'],
    roman: ['a', 'ya', 'eo', 'yeo', 'o', 'yo', 'u', 'yu', 'eu', 'i'],
  },
  {
    id: 'consonant',
    title: '基本子音',
    chars: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'],
    roman: ['k', 'n', 't', 'r', 'm', 'p', 's', 'x', 'ch', 'chch', 'kk', 'tt', 'pp', 'h'],
  },
  {
    id: 'tense',
    title: '硬音',
    chars: ['ㄲ', 'ㄸ', 'ㅃ', 'ㅉ', 'ㅆ'],
    roman: ['g', 'd', 'b', 'j', 'z'],
  },
  {
    id: 'compound',
    title: '複合母音',
    chars: ['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'],
    roman: ['e', 'ye', 'e', 'ye', 'wa', 'we', 'we', 'wo', 'we', 'wi', 'eui'],
  },
  {
    id: 'final',
    title: '終聲',
    chars: ['ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅇ', 'ㄱ'],
    roman: ['n', 't', 'r', 'm', 'p', 'ng', 'k'],
  },
]

export const ORDER_ROW_BY_ID = new Map(ORDER_ROWS.map((r) => [r.id, r]))

// ── 造句 ──────────────────────────────────────────────────────────
//
// 這個檔案不 import 任何東西：scripts/make_audio.py 會直接用 node 載入它，把所有句子產成音檔。

export interface ExamSentence {
  /** 錯題本用的 id，見 lib/exam.ts */
  id: string
  /** 哪一種句型，例如「買了 N」 */
  topic: string
  /** 題目給的中文 */
  zh: string
  /** 要寫出來的韓文 */
  ko: string
  /** 也算對的其他寫法 */
  alts?: string[]
}

/** 最後一個字有沒有收音：決定助詞用 이/을（有）還是 가/를（沒有） */
const hasBatchim = (word: string): boolean => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code < 11172 && code % 28 !== 0
}

type Noun = readonly [ko: string, zh: string]

interface Pattern {
  id: string
  topic: string
  nouns: readonly Noun[]
  make: (noun: Noun) => Omit<ExamSentence, 'id' | 'topic'>
}

/** 名詞可以替換的句型 */
const PATTERNS: Pattern[] = [
  {
    id: 'one',
    topic: '什麼東西要一個',
    nouns: [
      ['커피', '咖啡'], ['피자', '披薩'], ['케이크', '蛋糕'], ['사과', '蘋果'], ['바나나', '香蕉'],
      ['주스', '果汁'], ['우유', '牛奶'], ['과자', '餅乾'], ['소주', '燒酒'], ['사이다', '汽水'],
    ],
    make: ([ko, zh]) => ({ zh: `${zh}一個（請給我）`, ko: `${ko} 하나요.` }),
  },
  {
    id: 'flow',
    topic: '什麼流出來',
    nouns: [['코피', '鼻血'], ['피', '血']],
    // 口語省略助詞；加了助詞（코피가 나요）文法也對，一起算對
    make: ([ko, zh]) => ({
      zh: `${zh}流出來了`,
      ko: `${ko} 나요.`,
      alts: [`${ko}${hasBatchim(ko) ? '이' : '가'} 나요.`],
    }),
  },
  {
    id: 'buy',
    topic: '買了什麼',
    nouns: [
      ['티셔츠', 'T 恤'], ['코트', '大衣'], ['카메라', '相機'], ['가방', '包包'], ['안경', '眼鏡'],
      ['우표', '郵票'], ['소파', '沙發'], ['시계', '時鐘'], ['바지', '褲子'], ['치마', '裙子'],
      ['모자', '帽子'], ['사과', '蘋果'], ['기타', '吉他'], ['피아노', '鋼琴'],
    ],
    make: ([ko, zh]) => ({
      zh: `買了${zh}`,
      ko: `${ko} 샀어요.`,
      alts: [`${ko}${hasBatchim(ko) ? '을' : '를'} 샀어요.`],
    }),
  },
]

/** 名詞不能換的固定句 */
const FIXED: ExamSentence[] = [
  { id: 's:hi', topic: 'How are you?', zh: 'How are you?（一般）', ko: '안녕하세요?' },
  { id: 's:hi-formal', topic: 'How are you?', zh: 'How are you?（正式）', ko: '안녕하십니까?' },
  { id: 's:first', topic: 'How do you do?', zh: 'How do you do?（初次見面）', ko: '처음 뵙겠습니다.' },
  { id: 's:nice', topic: 'Nice to meet you', zh: 'Nice to meet you（很高興見到你）', ko: '만나서 반갑습니다.', alts: ['반갑습니다.', '만나서 반가워요.'] },
  { id: 's:bye-host', topic: 'Goodbye', zh: 'Goodbye（主人對要離開的客人說）', ko: '안녕히 가세요.', alts: ['안녕히 가십시오.'] },
  { id: 's:bye-guest', topic: 'Goodbye', zh: 'Goodbye（客人對留下來的主人說）', ko: '안녕히 계십시오.' },
  { id: 's:next-week', topic: 'See you next week', zh: 'See you next week（下週見）', ko: '다음 주에 뵙겠습니다.' },
  { id: 's:weekend', topic: 'Have a nice weekend', zh: 'Have a nice weekend（一般）', ko: '주말 잘 지내세요.' },
  { id: 's:weekend-polite', topic: 'Have a nice weekend', zh: 'Have a nice weekend（比較尊敬）', ko: '주말 잘 보내십시오.' },
]

const PATTERN_BY_ID = new Map(PATTERNS.map((p) => [p.id, p]))

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]

function patternSentence(p: Pattern, noun: Noun): ExamSentence {
  return { id: `s:${p.id}:${noun[0]}`, topic: p.topic, ...p.make(noun) }
}

/** 一輪造句：每個固定句一次，每個句型隨機換一個名詞 */
export const sentenceDrill = (): ExamSentence[] => [
  ...FIXED,
  ...PATTERNS.map((p) => patternSentence(p, pick(p.nouns))),
]

export function sentenceById(id: string): ExamSentence | null {
  const fixed = FIXED.find((s) => s.id === id)
  if (fixed) return fixed
  const [, kind, a] = id.split(':')
  const p = PATTERN_BY_ID.get(kind)
  const noun = p?.nouns.find((n) => n[0] === a)
  return p && noun ? patternSentence(p, noun) : null
}

/** 所有可能出現的句子（產音檔用） */
export const allSentences = (): ExamSentence[] => [
  ...FIXED,
  ...PATTERNS.flatMap((p) => p.nouns.map((n) => patternSentence(p, n))),
]

/** 選單上顯示的句型數 */
export const SENTENCE_TOPIC_COUNT = new Set(sentenceDrill().map((s) => s.topic)).size
