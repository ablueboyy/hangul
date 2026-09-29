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
  {
    week: 3,
    note: '加入 ㄱ ㄷ ㅂ ㅅ ㅈ，收音多了 ㄴ ㄹ（산、말、하늘）。',
    words: [
      { ko: '다리', roman: 'dari', meaning: '腿' },
      { ko: '두부', roman: 'dubu', meaning: '豆腐' },
      { ko: '바다', roman: 'bada', meaning: '大海' },
      { ko: '자기', roman: 'jagi', meaning: '自己' },
      { ko: '기자', roman: 'gija', meaning: '記者' },
      { ko: '아기', roman: 'agi', meaning: '嬰兒' },
      { ko: '가구', roman: 'gagu', meaning: '家具' },
      { ko: '모자', roman: 'moja', meaning: '帽子' },
      { ko: '사자', roman: 'saja', meaning: '獅子' },
      { ko: '바지', roman: 'baji', meaning: '褲子' },
      { ko: '아버지', roman: 'abeoji', meaning: '父親' },
      { ko: '나비', roman: 'nabi', meaning: '蝴蝶' },
      { ko: '자음', roman: 'jaeum', meaning: '子音' },
      { ko: '모음', roman: 'moeum', meaning: '母音' },
      { ko: '술', roman: 'sul', meaning: '酒' },
      { ko: '산', roman: 'san', meaning: '山' },
      { ko: '말', roman: 'mal', meaning: '馬' },
      { ko: '물', roman: 'mul', meaning: '水' },
      { ko: '하늘', roman: 'haneul', meaning: '天空' },
      { ko: '구름', roman: 'gureum', meaning: '雲' },
      // 意思不能和第 2 週的 엄마（媽媽）一樣，不然「看意思選字」會出現兩個看起來都對的選項
      { ko: '어머니', roman: 'eomeoni', meaning: '母親（媽媽）' },
      { ko: '곰', roman: 'gom', meaning: '熊' },
    ],
  },
  {
    week: 4,
    note: '加入 ㅊ、雙子音 ㄸ 和複合母音 ㅘ，收音多了 ㅇ（강、한강）。',
    // 課本這週還有 아기（嬰兒），但第 3 週已經有了，ko 不能重複所以沒放
    words: [
      { ko: '허리', roman: 'heori', meaning: '腰' },
      { ko: '하나', roman: 'hana', meaning: '一' },
      { ko: '가자', roman: 'gaja', meaning: '走吧' },
      { ko: '여기요', roman: 'yeogiyo', meaning: '來一下' },
      { ko: '저기요', roman: 'jeogiyo', meaning: '不好意思' },
      { ko: '여기', roman: 'yeogi', meaning: '這裡' },
      { ko: '거기', roman: 'geogi', meaning: '那裡' },
      { ko: '저기', roman: 'jeogi', meaning: '更遠的那裡' },
      { ko: '야구', roman: 'yagu', meaning: '野球' },
      { ko: '고기', roman: 'gogi', meaning: '肉' },
      { ko: '다', roman: 'da', meaning: '都' },
      { ko: '어디', roman: 'eodi', meaning: '哪裡' },
      { ko: '가다', roman: 'gada', meaning: '去' },
      { ko: '오다', roman: 'oda', meaning: '來' },
      { ko: '바나나', roman: 'banana', meaning: '香蕉' },
      { ko: '구아바', roman: 'guaba', meaning: '芭樂' },
      { ko: '자두', roman: 'jadu', meaning: '李子' },
      { ko: '유자', roman: 'yuja', meaning: '柚子' },
      { ko: '차', roman: 'cha', meaning: '茶' },
      { ko: '귤', roman: 'gyul', meaning: '橘子' },
      { ko: '딸기', roman: 'ttalgi', meaning: '草莓' },
      { ko: '과일', roman: 'gwail', meaning: '水果' },
      { ko: '강', roman: 'gang', meaning: '江' },
      { ko: '한강', roman: 'hangang', meaning: '漢江' },
    ],
  },
  // 第 5～16 週：課上到了再把單字填進來
  ...Array.from({ length: TOTAL_WEEKS - 4 }, (_, i) => ({ week: i + 5, words: [] })),
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
