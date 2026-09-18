/**
 * 學校課程每週的單字庫。
 *
 * 和「字母」那套進度是分開的兩件事：字母有解鎖闖關，單字沒有 ——
 * 想練哪幾週就勾哪幾週，勾了才會出現在測驗裡。
 *
 * 要加新的一週，就把 words 填進對應的 week；順序不要動、也不要插隊，
 * 因為備份碼是照「第幾週的第幾個字」的位置存分數的。
 * 加完單字記得跑一次 `npm run audio` 產對應的發音檔。
 */

export interface VocabWord {
  /** 韓文（同時也是發音音檔的 key 和熟練度的 key，所以同一份單字庫裡不能重複） */
  ko: string
  /** 修正羅馬字 */
  roman: string
  /** 中文意思 */
  meaning: string
}

export interface VocabWeek {
  /** 1 起算 */
  week: number
  /** 這週在練什麼，沒有就不顯示 */
  note?: string
  words: VocabWord[]
}

export const TOTAL_WEEKS = 16

export const VOCAB_WEEKS: VocabWeek[] = [
  {
    week: 1,
    note: '全部只用母音和不發音的 ㅇ — 還沒學子音就能念的字。',
    words: [
      { ko: '이', roman: 'i', meaning: '二' },
      { ko: '오', roman: 'o', meaning: '五' },
      { ko: '아이', roman: 'ai', meaning: '小孩' },
      { ko: '오이', roman: 'oi', meaning: '小黃瓜' },
      { ko: '아우', roman: 'au', meaning: '弟弟' },
      { ko: '우유', roman: 'uyu', meaning: '牛乳' },
      { ko: '이유', roman: 'iyu', meaning: '理由' },
      { ko: '여우', roman: 'yeou', meaning: '狐狸' },
      { ko: '여유', roman: 'yeoyu', meaning: '餘裕' },
    ],
  },
  {
    week: 2,
    note: '加入 ㄴ ㄹ ㅁ ㅎ 四個子音，並出現第一個收音（엄마 的 ㅁ）。',
    words: [
      { ko: '머리', roman: 'meori', meaning: '頭部' },
      { ko: '엄마', roman: 'eomma', meaning: '媽媽' },
      { ko: '나무', roman: 'namu', meaning: '樹' },
      { ko: '하마', roman: 'hama', meaning: '河馬' },
      { ko: '이마', roman: 'ima', meaning: '額頭' },
      { ko: '무', roman: 'mu', meaning: '白蘿蔔' },
      { ko: '나', roman: 'na', meaning: '我' },
      { ko: '너', roman: 'neo', meaning: '你（平輩）' },
      { ko: '누나', roman: 'nuna', meaning: '男生的姊姊' },
      { ko: '나이', roman: 'nai', meaning: '年齡' },
      { ko: '미니', roman: 'mini', meaning: '迷你' },
      { ko: '오리', roman: 'ori', meaning: '鴨子' },
      { ko: '요리', roman: 'yori', meaning: '料理' },
      { ko: '우리', roman: 'uri', meaning: '我們' },
      { ko: '유리', roman: 'yuri', meaning: '琉璃' },
    ],
  },
  // 第 3～16 週：課上到了再把單字填進來
  ...Array.from({ length: TOTAL_WEEKS - 2 }, (_, i) => ({ week: i + 3, words: [] })),
]

export const WEEK_BY_NUMBER = new Map(VOCAB_WEEKS.map((w) => [w.week, w]))

/** 有填單字的週次 */
export const filledWeeks = (): VocabWeek[] => VOCAB_WEEKS.filter((w) => w.words.length > 0)

export const ALL_WORDS: VocabWord[] = VOCAB_WEEKS.flatMap((w) => w.words)

export const WORD_BY_KO = new Map(ALL_WORDS.map((w) => [w.ko, w]))

/** 指定週次的所有單字（週次順序，週內保持原順序） */
export const wordsOfWeeks = (weeks: number[]): VocabWord[] => {
  const picked = new Set(weeks)
  return VOCAB_WEEKS.filter((w) => picked.has(w.week)).flatMap((w) => w.words)
}
