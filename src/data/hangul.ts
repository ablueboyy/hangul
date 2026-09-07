export type LetterType = 'consonant' | 'tenseConsonant' | 'vowel' | 'compoundVowel'

export interface Letter {
  /** 字母本身 */
  char: string
  /** 韓國人念這個字母時說的名字（同時也是拿去給 TTS 唸的字串） */
  name: string
  /** 修正羅馬字 */
  roman: string
  type: LetterType
  /** 給中文母語者的發音提示 */
  hint: string
  /** 字形記憶法 */
  mnemonic: string
  example: { word: string; roman: string; meaning: string }
}

export const LETTER_TYPE_LABEL: Record<LetterType, string> = {
  consonant: '基本子音',
  tenseConsonant: '雙子音',
  vowel: '基本母音',
  compoundVowel: '複合母音',
}

export const LETTERS: Letter[] = [
  // ── 基本子音 14 ──────────────────────────────────────────────
  {
    char: 'ㄱ', name: '기역', roman: 'g / k', type: 'consonant',
    hint: '介於注音 ㄍ 和 ㄎ 之間。在字首偏 k，在母音之間變成 g（가구 念 ga-gu）。',
    mnemonic: '舌根抬起抵住上顎後方的側面圖，像一把朝下的槍。',
    example: { word: '가방', roman: 'gabang', meaning: '包包' },
  },
  {
    char: 'ㄴ', name: '니은', roman: 'n', type: 'consonant',
    hint: '就是注音 ㄋ。',
    mnemonic: '舌尖頂住上排牙齦的側面圖，像一個鉤子。',
    example: { word: '나무', roman: 'namu', meaning: '樹' },
  },
  {
    char: 'ㄷ', name: '디귿', roman: 'd / t', type: 'consonant',
    hint: '介於 ㄉ 和 ㄊ 之間。字首偏 t，夾在母音之間變 d。',
    mnemonic: 'ㄴ 上面加一橫 — 發音位置和 ㄴ 一樣，但氣流被完全擋住。',
    example: { word: '다리', roman: 'dari', meaning: '腿、橋' },
  },
  {
    char: 'ㄹ', name: '리을', roman: 'r / l', type: 'consonant',
    hint: '字首、母音之間像輕彈的 r（西班牙語的 r）；在收音位置變成 l。',
    mnemonic: '舌頭捲起又彈開的路徑圖，筆畫連續轉彎。',
    example: { word: '라디오', roman: 'radio', meaning: '收音機' },
  },
  {
    char: 'ㅁ', name: '미음', roman: 'm', type: 'consonant',
    hint: '就是注音 ㄇ。',
    mnemonic: '閉起來的嘴巴，就是漢字的「口」。',
    example: { word: '머리', roman: 'meori', meaning: '頭、頭髮' },
  },
  {
    char: 'ㅂ', name: '비읍', roman: 'b / p', type: 'consonant',
    hint: '介於 ㄅ 和 ㄆ 之間。字首偏 p，夾在母音之間變 b。',
    mnemonic: 'ㅁ 的上方打開 — 氣從緊閉的雙唇爆出來。',
    example: { word: '바다', roman: 'bada', meaning: '海' },
  },
  {
    char: 'ㅅ', name: '시옷', roman: 's', type: 'consonant',
    hint: '注音 ㄙ。但後面接 ㅣ、ㅑ 這類音時會變成 ㄒ（시 念「西」）。',
    mnemonic: '牙齒的形狀，氣流從齒縫摩擦而出。',
    example: { word: '사람', roman: 'saram', meaning: '人' },
  },
  {
    char: 'ㅇ', name: '이응', roman: '– / ng', type: 'consonant',
    hint: '放在音節開頭不發音，只是佔位子；放在收音位置才發鼻音 ng（像「工」的尾音）。',
    mnemonic: '喉嚨（聲門）的形狀，空心代表沒有阻礙。',
    example: { word: '아이', roman: 'ai', meaning: '小孩' },
  },
  {
    char: 'ㅈ', name: '지읒', roman: 'j', type: 'consonant',
    hint: '介於 ㄗ 和 ㄐ 之間，接 ㅣ 類母音時偏 ㄐ。',
    mnemonic: 'ㅅ 上面加一橫 — 摩擦音變成塞擦音。',
    example: { word: '자다', roman: 'jada', meaning: '睡覺' },
  },
  {
    char: 'ㅊ', name: '치읓', roman: 'ch', type: 'consonant',
    hint: 'ㅈ 的送氣版，像 ㄘ / ㄑ，吐氣要明顯。',
    mnemonic: 'ㅈ 再加一畫 — 多出來的那一畫就是多出來的那口氣。',
    example: { word: '차', roman: 'cha', meaning: '車、茶' },
  },
  {
    char: 'ㅋ', name: '키읔', roman: 'k', type: 'consonant',
    hint: 'ㄱ 的送氣版，就是注音 ㄎ，紙片放嘴前應該會被吹動。',
    mnemonic: 'ㄱ 加一橫 = 加一口氣。',
    example: { word: '코', roman: 'ko', meaning: '鼻子' },
  },
  {
    char: 'ㅌ', name: '티읕', roman: 't', type: 'consonant',
    hint: 'ㄷ 的送氣版，就是注音 ㄊ。',
    mnemonic: 'ㄷ 加一橫 = 加一口氣。',
    example: { word: '토끼', roman: 'tokki', meaning: '兔子' },
  },
  {
    char: 'ㅍ', name: '피읖', roman: 'p', type: 'consonant',
    hint: 'ㅂ 的送氣版，就是注音 ㄆ。',
    mnemonic: 'ㅂ 攤平打開 — 雙唇爆音再加一口氣。',
    example: { word: '포도', roman: 'podo', meaning: '葡萄' },
  },
  {
    char: 'ㅎ', name: '히읗', roman: 'h', type: 'consonant',
    hint: '注音 ㄏ，但比中文輕，夾在母音之間常常幾乎聽不見。',
    mnemonic: '喉嚨 ㅇ 戴上帽子 — 氣直接從喉嚨出來。',
    example: { word: '하늘', roman: 'haneul', meaning: '天空' },
  },

  // ── 雙子音 5 ─────────────────────────────────────────────────
  {
    char: 'ㄲ', name: '쌍기역', roman: 'kk', type: 'tenseConsonant',
    hint: '緊音：喉嚨繃緊、完全不送氣的 ㄍ。像憋住一口氣再彈出來。',
    mnemonic: '兩個 ㄱ 並排 = 加倍用力，但不是加倍吐氣。',
    example: { word: '꽃', roman: 'kkot', meaning: '花' },
  },
  {
    char: 'ㄸ', name: '쌍디귿', roman: 'tt', type: 'tenseConsonant',
    hint: '緊音版 ㄷ，喉嚨緊繃、不吐氣。',
    mnemonic: '兩個 ㄷ 並排。',
    example: { word: '딸기', roman: 'ttalgi', meaning: '草莓' },
  },
  {
    char: 'ㅃ', name: '쌍비읍', roman: 'pp', type: 'tenseConsonant',
    hint: '緊音版 ㅂ，雙唇夾緊再彈開，完全不送氣。',
    mnemonic: '兩個 ㅂ 並排。',
    example: { word: '빵', roman: 'ppang', meaning: '麵包' },
  },
  {
    char: 'ㅆ', name: '쌍시옷', roman: 'ss', type: 'tenseConsonant',
    hint: '緊音版 ㅅ，摩擦更強更短促。',
    mnemonic: '兩個 ㅅ 並排。',
    example: { word: '쌀', roman: 'ssal', meaning: '米' },
  },
  {
    char: 'ㅉ', name: '쌍지읒', roman: 'jj', type: 'tenseConsonant',
    hint: '緊音版 ㅈ，喉嚨繃緊不吐氣。',
    mnemonic: '兩個 ㅈ 並排。',
    example: { word: '짜다', roman: 'jjada', meaning: '鹹的' },
  },

  // ── 基本母音 10 ───────────────────────────────────────────────
  {
    char: 'ㅏ', name: '아', roman: 'a', type: 'vowel',
    hint: '注音 ㄚ，嘴巴張大。',
    mnemonic: '人（ㅣ）的右邊加一點：點在右邊 = 陽性母音（亮）。',
    example: { word: '아기', roman: 'agi', meaning: '嬰兒' },
  },
  {
    char: 'ㅑ', name: '야', roman: 'ya', type: 'vowel',
    hint: 'ㄧㄚ 連著念。',
    mnemonic: 'ㅏ 加一點：多一畫就多一個 y 的介音。',
    example: { word: '야구', roman: 'yagu', meaning: '棒球' },
  },
  {
    char: 'ㅓ', name: '어', roman: 'eo', type: 'vowel',
    hint: '接近注音 ㄜ。嘴巴微張、嘴唇放鬆不要噘起來 — 這是最常和 ㅗ 搞混的音。',
    mnemonic: '點在左邊 = 陰性母音（暗）。',
    example: { word: '어머니', roman: 'eomeoni', meaning: '媽媽' },
  },
  {
    char: 'ㅕ', name: '여', roman: 'yeo', type: 'vowel',
    hint: 'ㄧㄜ 連著念。',
    mnemonic: 'ㅓ 加一點。',
    example: { word: '여자', roman: 'yeoja', meaning: '女生' },
  },
  {
    char: 'ㅗ', name: '오', roman: 'o', type: 'vowel',
    hint: '注音 ㄛ，嘴唇要圓、要噘出來。和 ㅓ 的差別就在嘴唇圓不圓。',
    mnemonic: '地（ㅡ）的上面加一點 = 陽性母音。',
    example: { word: '오이', roman: 'oi', meaning: '小黃瓜' },
  },
  {
    char: 'ㅛ', name: '요', roman: 'yo', type: 'vowel',
    hint: 'ㄧㄛ 連著念。',
    mnemonic: 'ㅗ 加一點。',
    example: { word: '요리', roman: 'yori', meaning: '料理' },
  },
  {
    char: 'ㅜ', name: '우', roman: 'u', type: 'vowel',
    hint: '注音 ㄨ，嘴唇圓而收緊。',
    mnemonic: '地（ㅡ）的下面加一點 = 陰性母音。',
    example: { word: '우유', roman: 'uyu', meaning: '牛奶' },
  },
  {
    char: 'ㅠ', name: '유', roman: 'yu', type: 'vowel',
    hint: 'ㄧㄨ 連著念。',
    mnemonic: 'ㅜ 加一點。',
    example: { word: '유리', roman: 'yuri', meaning: '玻璃' },
  },
  {
    char: 'ㅡ', name: '으', roman: 'eu', type: 'vowel',
    hint: '嘴唇往兩側拉平、牙齒微開發出的「呃」。中文沒有完全對應的音，注意不要念成 ㄨ。',
    mnemonic: '一橫代表「地」，扁平的嘴型。',
    example: { word: '그림', roman: 'geurim', meaning: '圖畫' },
  },
  {
    char: 'ㅣ', name: '이', roman: 'i', type: 'vowel',
    hint: '注音 ㄧ。',
    mnemonic: '一豎代表站立的「人」。',
    example: { word: '이름', roman: 'ireum', meaning: '名字' },
  },

  // ── 複合母音 11 ───────────────────────────────────────────────
  {
    char: 'ㅐ', name: '애', roman: 'ae', type: 'compoundVowel',
    hint: '英文 cat 的 a，嘴巴比 ㅔ 再開一點。現代韓語裡幾乎和 ㅔ 同音，聽不出差別是正常的。',
    mnemonic: 'ㅏ + ㅣ 合體。',
    example: { word: '개', roman: 'gae', meaning: '狗' },
  },
  {
    char: 'ㅒ', name: '얘', roman: 'yae', type: 'compoundVowel',
    hint: 'ㅐ 加上 y 的介音。實際使用非常少。',
    mnemonic: 'ㅑ + ㅣ 合體。',
    example: { word: '얘기', roman: 'yaegi', meaning: '聊天、話' },
  },
  {
    char: 'ㅔ', name: '에', roman: 'e', type: 'compoundVowel',
    hint: '注音 ㄝ。和 ㅐ 現代已經合流，只能靠背單字分辨寫法。',
    mnemonic: 'ㅓ + ㅣ 合體。',
    example: { word: '게', roman: 'ge', meaning: '螃蟹' },
  },
  {
    char: 'ㅖ', name: '예', roman: 'ye', type: 'compoundVowel',
    hint: 'ㄧㄝ 連著念。',
    mnemonic: 'ㅕ + ㅣ 合體。',
    example: { word: '예의', roman: 'yeui', meaning: '禮儀' },
  },
  {
    char: 'ㅘ', name: '와', roman: 'wa', type: 'compoundVowel',
    hint: 'ㄨㄚ 連著念。',
    mnemonic: 'ㅗ + ㅏ 合體。',
    example: { word: '과자', roman: 'gwaja', meaning: '餅乾' },
  },
  {
    char: 'ㅙ', name: '왜', roman: 'wae', type: 'compoundVowel',
    hint: 'ㄨㄝ。和 ㅚ、ㅞ 三個現在幾乎同音。',
    mnemonic: 'ㅗ + ㅐ 合體。',
    example: { word: '왜', roman: 'wae', meaning: '為什麼' },
  },
  {
    char: 'ㅚ', name: '외', roman: 'oe', type: 'compoundVowel',
    hint: '現代口語念成 ㄨㄝ，和 ㅙ、ㅞ 一樣。',
    mnemonic: 'ㅗ + ㅣ 合體。',
    example: { word: '외국', roman: 'oeguk', meaning: '外國' },
  },
  {
    char: 'ㅝ', name: '워', roman: 'wo', type: 'compoundVowel',
    hint: 'ㄨㄜ 連著念（不是 ㄨㄛ）。',
    mnemonic: 'ㅜ + ㅓ 合體。',
    example: { word: '원숭이', roman: 'wonsungi', meaning: '猴子' },
  },
  {
    char: 'ㅞ', name: '웨', roman: 'we', type: 'compoundVowel',
    hint: 'ㄨㄝ。三兄弟 ㅙ / ㅚ / ㅞ 之一，用得最少。',
    mnemonic: 'ㅜ + ㅔ 合體。',
    example: { word: '웨딩', roman: 'weding', meaning: '婚禮' },
  },
  {
    char: 'ㅟ', name: '위', roman: 'wi', type: 'compoundVowel',
    hint: 'ㄨㄧ 連著念。',
    mnemonic: 'ㅜ + ㅣ 合體。',
    example: { word: '위', roman: 'wi', meaning: '上面、胃' },
  },
  {
    char: 'ㅢ', name: '의', roman: 'ui', type: 'compoundVowel',
    hint: 'ㅡ 快速滑到 ㅣ。當所有格助詞時念成 ㅔ，不在字首時念成 ㅣ。',
    mnemonic: 'ㅡ + ㅣ 合體。',
    example: { word: '의사', roman: 'uisa', meaning: '醫生' },
  },
]

export const LETTER_BY_CHAR = new Map(LETTERS.map((l) => [l.char, l]))

/** 容易搞混、值得放在一起練的組合 */
export const CONFUSABLE_GROUPS: string[][] = [
  ['ㄱ', 'ㅋ', 'ㄲ'],
  ['ㄷ', 'ㅌ', 'ㄸ'],
  ['ㅂ', 'ㅍ', 'ㅃ'],
  ['ㅈ', 'ㅊ', 'ㅉ'],
  ['ㅅ', 'ㅆ'],
  ['ㅓ', 'ㅗ'],
  ['ㅡ', 'ㅜ'],
  ['ㅐ', 'ㅔ'],
  ['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ'],
]

/**
 * 出題選項用的單一羅馬拼音。
 * 顯示用的 roman 有 "g / k" 這種兩讀（字首和母音之間念法不同），
 * 拿來當選項會看不懂，所以這幾個字母另外指定一個代表拼音。
 */
const QUIZ_ROMAN_OVERRIDE: Record<string, string> = {
  ㄱ: 'g',
  ㄷ: 'd',
  ㄹ: 'r',
  ㅂ: 'b',
  ㅇ: 'ng',
}

export const quizRoman = (char: string): string =>
  QUIZ_ROMAN_OVERRIDE[char] ?? LETTER_BY_CHAR.get(char)?.roman ?? char
