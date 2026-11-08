/**
 * 學校課程每週的單字庫。
 *
 * 和「字母」那套進度是分開的兩件事：字母照組別勾、單字照週數勾 ——
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
  /** 漢字語的漢字（正體）。期中考「給漢字寫韓文和意思」用 */
  hanja?: string
  /** 外來語的英文原文。期中考「給英文寫韓文」用 */
  en?: string
}

/** 期中考的單字分類：有 hanja 的是漢字語、有 en 的是外來語，其他都算固有語 */
export type WordKind = 'hanja' | 'loan' | 'native'

export const WORD_KIND_LABEL: Record<WordKind, string> = {
  hanja: '漢字語',
  loan: '外來語',
  native: '固有語',
}

export const wordKind = (w: VocabWord): WordKind =>
  w.hanja ? 'hanja' : w.en ? 'loan' : 'native'

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
      { ko: '이', roman: 'i', meaning: '二', hanja: '二' },
      { ko: '오', roman: 'o', meaning: '五', hanja: '五' },
      { ko: '아이', roman: 'ai', meaning: '小孩' },
      { ko: '오이', roman: 'oi', meaning: '小黃瓜' },
      { ko: '아우', roman: 'au', meaning: '弟弟' },
      { ko: '우유', roman: 'uyu', meaning: '牛乳', hanja: '牛乳' },
      { ko: '이유', roman: 'iyu', meaning: '理由', hanja: '理由' },
      { ko: '여우', roman: 'yeou', meaning: '狐狸' },
      { ko: '여유', roman: 'yeoyu', meaning: '餘裕', hanja: '餘裕' },
    ],
  },
  {
    week: 2,
    note: '加入 ㄴ ㄹ ㅁ ㅎ 四個子音，並出現第一個收音（엄마 的 ㅁ）。',
    words: [
      { ko: '머리', roman: 'meori', meaning: '頭部' },
      { ko: '엄마', roman: 'eomma', meaning: '媽媽' },
      { ko: '나무', roman: 'namu', meaning: '樹' },
      { ko: '하마', roman: 'hama', meaning: '河馬', hanja: '河馬' },
      { ko: '이마', roman: 'ima', meaning: '額頭' },
      { ko: '무', roman: 'mu', meaning: '白蘿蔔' },
      { ko: '나', roman: 'na', meaning: '我' },
      { ko: '너', roman: 'neo', meaning: '你（平輩）' },
      { ko: '누나', roman: 'nuna', meaning: '男生的姊姊' },
      { ko: '나이', roman: 'nai', meaning: '年齡' },
      { ko: '미니', roman: 'mini', meaning: '迷你', en: 'mini' },
      { ko: '오리', roman: 'ori', meaning: '鴨子' },
      { ko: '요리', roman: 'yori', meaning: '料理', hanja: '料理' },
      { ko: '우리', roman: 'uri', meaning: '我們' },
      { ko: '유리', roman: 'yuri', meaning: '琉璃', hanja: '琉璃' },
    ],
  },
  {
    week: 3,
    note: '加入 ㄱ ㄷ ㅂ ㅅ ㅈ，收音多了 ㄴ ㄹ（산、말、하늘）。',
    words: [
      { ko: '다리', roman: 'dari', meaning: '腿' },
      { ko: '두부', roman: 'dubu', meaning: '豆腐', hanja: '豆腐' },
      { ko: '바다', roman: 'bada', meaning: '大海' },
      { ko: '자기', roman: 'jagi', meaning: '自己', hanja: '自己' },
      { ko: '기자', roman: 'gija', meaning: '記者', hanja: '記者' },
      { ko: '아기', roman: 'agi', meaning: '嬰兒' },
      { ko: '가구', roman: 'gagu', meaning: '家具', hanja: '家具' },
      { ko: '모자', roman: 'moja', meaning: '帽子', hanja: '帽子' },
      { ko: '사자', roman: 'saja', meaning: '獅子', hanja: '獅子' },
      { ko: '바지', roman: 'baji', meaning: '褲子' },
      { ko: '아버지', roman: 'abeoji', meaning: '父親' },
      { ko: '나비', roman: 'nabi', meaning: '蝴蝶' },
      { ko: '자음', roman: 'jaeum', meaning: '子音', hanja: '子音' },
      { ko: '모음', roman: 'moeum', meaning: '母音', hanja: '母音' },
      { ko: '술', roman: 'sul', meaning: '酒' },
      { ko: '산', roman: 'san', meaning: '山', hanja: '山' },
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
      // 意思不能和第 5 週的 일（一）一樣，所以標出是哪一套數字
      { ko: '하나', roman: 'hana', meaning: '一（固有語數字）' },
      { ko: '가자', roman: 'gaja', meaning: '走吧' },
      { ko: '여기요', roman: 'yeogiyo', meaning: '來一下' },
      { ko: '저기요', roman: 'jeogiyo', meaning: '不好意思' },
      { ko: '여기', roman: 'yeogi', meaning: '這裡' },
      { ko: '거기', roman: 'geogi', meaning: '那裡' },
      { ko: '저기', roman: 'jeogi', meaning: '更遠的那裡' },
      { ko: '야구', roman: 'yagu', meaning: '野球', hanja: '野球' },
      { ko: '고기', roman: 'gogi', meaning: '肉' },
      { ko: '다', roman: 'da', meaning: '都' },
      { ko: '어디', roman: 'eodi', meaning: '哪裡' },
      { ko: '가다', roman: 'gada', meaning: '去' },
      { ko: '오다', roman: 'oda', meaning: '來' },
      { ko: '바나나', roman: 'banana', meaning: '香蕉', en: 'banana' },
      { ko: '구아바', roman: 'guaba', meaning: '芭樂', en: 'guava' },
      { ko: '자두', roman: 'jadu', meaning: '李子' },
      { ko: '유자', roman: 'yuja', meaning: '柚子', hanja: '柚子' },
      { ko: '차', roman: 'cha', meaning: '茶', hanja: '茶' },
      { ko: '귤', roman: 'gyul', meaning: '橘子', hanja: '橘' },
      { ko: '딸기', roman: 'ttalgi', meaning: '草莓' },
      { ko: '과일', roman: 'gwail', meaning: '水果' },
      { ko: '강', roman: 'gang', meaning: '江', hanja: '江' },
      { ko: '한강', roman: 'hangang', meaning: '漢江', hanja: '漢江' },
    ],
  },
  {
    week: 5,
    note: '加入送氣音 ㅋ ㅌ ㅍ、母音 ㅐ ㅔ 和雙子音 ㄲ，收音多了 ㅂ ㅍ（입、잎），還有不少外來語和地名。',
    words: [
      { ko: '바보', roman: 'babo', meaning: '傻瓜' },
      { ko: '도로', roman: 'doro', meaning: '道路', hanja: '道路' },
      { ko: '라디오', roman: 'radio', meaning: '收音機', en: 'radio' },
      { ko: '우비', roman: 'ubi', meaning: '雨衣（雨備）', hanja: '雨備' },
      { ko: '비', roman: 'bi', meaning: '雨' },
      { ko: '비누', roman: 'binu', meaning: '肥皂' },
      { ko: '보라', roman: 'bora', meaning: '紫色' },
      { ko: '자', roman: 'ja', meaning: '尺' },
      { ko: '여자', roman: 'yeoja', meaning: '女子', hanja: '女子' },
      { ko: '지구', roman: 'jigu', meaning: '地球', hanja: '地球' },
      { ko: '부자', roman: 'buja', meaning: '有錢人（富者）', hanja: '富者' },
      { ko: '아주', roman: 'aju', meaning: '非常' },
      { ko: '주머니', roman: 'jumeoni', meaning: '口袋' },
      { ko: '아주머니', roman: 'ajumeoni', meaning: '大嬸（尊稱）' },
      { ko: '아줌마', roman: 'ajumma', meaning: '大嬸（口語）' },
      { ko: '조류', roman: 'joryu', meaning: '鳥類', hanja: '鳥類' },
      { ko: '주스', roman: 'juseu', meaning: '果汁', en: 'juice' },
      { ko: '자다', roman: 'jada', meaning: '睡覺' },
      { ko: '리치', roman: 'richi', meaning: '荔枝', en: 'lychee' },
      { ko: '사다', roman: 'sada', meaning: '買' },
      { ko: '스시', roman: 'seusi', meaning: '壽司', en: 'sushi' },
      { ko: '시', roman: 'si', meaning: '詩', hanja: '詩' },
      { ko: '도시', roman: 'dosi', meaning: '都市', hanja: '都市' },
      { ko: '가수', roman: 'gasu', meaning: '歌手', hanja: '歌手' },
      { ko: '뉴스', roman: 'nyuseu', meaning: '新聞', en: 'news' },
      { ko: '버스', roman: 'beoseu', meaning: '公車', en: 'bus' },
      { ko: '마우스', roman: 'mauseu', meaning: '滑鼠', en: 'mouse' },
      { ko: '미소', roman: 'miso', meaning: '微笑', hanja: '微笑' },
      { ko: '러시아', roman: 'reosia', meaning: '俄羅斯', en: 'Russia' },
      { ko: '사이다', roman: 'saida', meaning: '汽水', en: 'cider' },
      { ko: '소주', roman: 'soju', meaning: '燒酒', hanja: '燒酒' },
      { ko: '혀', roman: 'hyeo', meaning: '舌頭' },
      { ko: '호수', roman: 'hosu', meaning: '湖水', hanja: '湖水' },
      { ko: '오후', roman: 'ohu', meaning: '午後', hanja: '午後' },
      { ko: '호두', roman: 'hodu', meaning: '核桃', hanja: '胡桃' },
      { ko: '포도', roman: 'podo', meaning: '葡萄', hanja: '葡萄' },
      { ko: '머리띠', roman: 'meoritti', meaning: '頭帶' },
      { ko: '토끼', roman: 'tokki', meaning: '兔子' },
      { ko: '치마', roman: 'chima', meaning: '裙子' },
      { ko: '치마바지', roman: 'chimabaji', meaning: '褲裙' },
      { ko: '아빠', roman: 'appa', meaning: '爸爸' },
      { ko: '커피', roman: 'keopi', meaning: '咖啡', en: 'coffee' },
      { ko: '기차', roman: 'gicha', meaning: '火車（汽車）', hanja: '汽車' },
      { ko: '토마토', roman: 'tomato', meaning: '番茄', en: 'tomato' },
      { ko: '개', roman: 'gae', meaning: '狗' },
      { ko: '게', roman: 'ge', meaning: '螃蟹' },
      { ko: '이탈리아', roman: 'itallia', meaning: '義大利', en: 'Italy' },
      { ko: '로마', roman: 'roma', meaning: '羅馬', en: 'Rome' },
      { ko: '타이완', roman: 'taiwan', meaning: '台灣（外來語）', en: 'Taiwan' },
      { ko: '대만', roman: 'daeman', meaning: '台灣（臺灣，漢字語）', hanja: '臺灣' },
      { ko: '타이베이', roman: 'taibei', meaning: '台北', en: 'Taipei' },
      { ko: '일본', roman: 'ilbon', meaning: '日本', hanja: '日本' },
      { ko: '도쿄', roman: 'dokyo', meaning: '東京', en: 'Tokyo' },
      { ko: '호주', roman: 'hoju', meaning: '澳洲', hanja: '濠洲' },
      { ko: '서울', roman: 'seoul', meaning: '首爾' },
      { ko: '프랑스', roman: 'peurangseu', meaning: '法國', en: 'France' },
      { ko: '파리', roman: 'pari', meaning: '巴黎', en: 'Paris' },
      { ko: '브라질', roman: 'beurajil', meaning: '巴西', en: 'Brazil' },
      { ko: '브라질리아', roman: 'beurajillia', meaning: '巴西利亞', en: 'Brasília' },
      { ko: '인도', roman: 'indo', meaning: '印度', hanja: '印度' },
      { ko: '뉴델리', roman: 'nyudelli', meaning: '新德里', en: 'New Delhi' },
      { ko: '입', roman: 'ip', meaning: '嘴巴' },
      { ko: '잎', roman: 'ip', meaning: '葉子' },
      { ko: '일', roman: 'il', meaning: '一（漢字語數字）', hanja: '一' },
      { ko: '안녕하세요', roman: 'annyeonghaseyo', meaning: '你好嗎（平常）' },
      { ko: '안녕하십니까', roman: 'annyeonghasimnikka', meaning: '你好嗎（正式）' },
      { ko: '인사', roman: 'insa', meaning: '打招呼（人事）', hanja: '人事' },
      { ko: '일반', roman: 'ilban', meaning: '一般', hanja: '一般' },
      { ko: '표현', roman: 'pyohyeon', meaning: '表現', hanja: '表現' },
      { ko: '대화', roman: 'daehwa', meaning: '對話', hanja: '對話' },
    ],
  },
  {
    week: 6,
    note: '職業：선생님、경찰、변호사……漢字語居多，也有外來語 셰프。',
    words: [
      { ko: '도끼', roman: 'dokki', meaning: '斧頭' },
      { ko: '보도', roman: 'bodo', meaning: '報導', hanja: '報道' },
      { ko: '고리', roman: 'gori', meaning: '環（圈）' },
      { ko: '선생님', roman: 'seonsaengnim', meaning: '老師（先生）', hanja: '先生' },
      { ko: '교수', roman: 'gyosu', meaning: '教授', hanja: '教授' },
      { ko: '경찰', roman: 'gyeongchal', meaning: '警察', hanja: '警察' },
      { ko: '요리사', roman: 'yorisa', meaning: '廚師（料理師）', hanja: '料理師' },
      { ko: '셰프', roman: 'syepeu', meaning: '主廚', en: 'chef' },
      { ko: '군인', roman: 'gunin', meaning: '軍人', hanja: '軍人' },
      { ko: '음악가', roman: 'eumakga', meaning: '音樂家', hanja: '音樂家' },
      { ko: '변호사', roman: 'byeonhosa', meaning: '律師（辯護士）', hanja: '辯護士' },
      { ko: '연예인', roman: 'yeonyein', meaning: '藝人（演藝人）', hanja: '演藝人' },
      { ko: '교직원', roman: 'gyojigwon', meaning: '教職員', hanja: '教職員' },
    ],
  },
  {
    week: 7,
    note: '大量外來語（카드、피자、카메라……），複合母音 ㅐ ㅔ ㅘ ㅟ ㅢ ㅖ（새、그네、과자、주사위、의자、시계）。',
    // 課本這週還有 차（茶），但第 4 週已經有了，ko 不能重複所以沒放
    words: [
      { ko: '코', roman: 'ko', meaning: '鼻子' },
      { ko: '카드', roman: 'kadeu', meaning: '卡片', en: 'card' },
      { ko: '스키', roman: 'seuki', meaning: '滑雪', en: 'ski' },
      { ko: '비키니', roman: 'bikini', meaning: '比基尼', en: 'bikini' },
      { ko: '키스', roman: 'kiseu', meaning: '親吻', en: 'kiss' },
      { ko: '키보드', roman: 'kibodeu', meaning: '鍵盤', en: 'keyboard' },
      { ko: '기타', roman: 'gita', meaning: '吉他', en: 'guitar' },
      { ko: '오토바이', roman: 'otobai', meaning: '摩托車', en: 'auto bike' },
      { ko: '투수', roman: 'tusu', meaning: '投手', hanja: '投手' },
      { ko: '티셔츠', roman: 'tisyeocheu', meaning: 'T 恤', en: 'T-shirt' },
      { ko: '노트', roman: 'noteu', meaning: '筆記本', en: 'note' },
      { ko: '코트', roman: 'koteu', meaning: '大衣', en: 'coat' },
      { ko: '모니터', roman: 'moniteo', meaning: '螢幕', en: 'monitor' },
      { ko: '피아노', roman: 'piano', meaning: '鋼琴', en: 'piano' },
      { ko: '피자', roman: 'pija', meaning: '披薩', en: 'pizza' },
      { ko: '소파', roman: 'sopa', meaning: '沙發', en: 'sofa' },
      { ko: '비자', roman: 'bija', meaning: '簽證', en: 'visa' },
      { ko: '아파트', roman: 'apateu', meaning: '公寓', en: 'apartment' },
      { ko: '파티', roman: 'pati', meaning: '派對', en: 'party' },
      { ko: '포크', roman: 'pokeu', meaning: '叉子', en: 'fork' },
      { ko: '카피', roman: 'kapi', meaning: '影印', en: 'copy' },
      { ko: '카메라', roman: 'kamera', meaning: '相機', en: 'camera' },
      { ko: '케이크', roman: 'keikeu', meaning: '蛋糕', en: 'cake' },
      { ko: '스타', roman: 'seuta', meaning: '明星', en: 'star' },
      { ko: '파', roman: 'pa', meaning: '蔥' },
      { ko: '우표', roman: 'upyo', meaning: '郵票', hanja: '郵票' },
      { ko: '피', roman: 'pi', meaning: '血' },
      { ko: '아파요?', roman: 'apayo', meaning: '不舒服嗎？' },
      { ko: '고추', roman: 'gochu', meaning: '辣椒' },
      { ko: '차다', roman: 'chada', meaning: '冰的（冷）' },
      { ko: '그네', roman: 'geune', meaning: '鞦韆' },
      { ko: '과자', roman: 'gwaja', meaning: '餅乾（菓子）', hanja: '菓子' },
      { ko: '사과', roman: 'sagwa', meaning: '蘋果', hanja: '沙果' },
      { ko: '새', roman: 'sae', meaning: '鳥' },
      { ko: '의자', roman: 'uija', meaning: '椅子', hanja: '椅子' },
      { ko: '주사위', roman: 'jusawi', meaning: '骰子' },
      { ko: '시계', roman: 'sigye', meaning: '時鐘（時計）', hanja: '時計' },
      // 意思不能和第 4 週的 고기（肉）混在一起，所以用 물고기
      { ko: '물고기', roman: 'mulgogi', meaning: '魚' },
      { ko: '공', roman: 'gong', meaning: '球' },
      { ko: '친구', roman: 'chingu', meaning: '朋友', hanja: '親舊' },
      { ko: '안경', roman: 'angyeong', meaning: '眼鏡', hanja: '眼鏡' },
      { ko: '가방', roman: 'gabang', meaning: '包包' },
      { ko: '눈', roman: 'nun', meaning: '眼睛' },
      { ko: '김치', roman: 'gimchi', meaning: '泡菜（辛奇）' },
      { ko: '달', roman: 'dal', meaning: '月亮' },
      { ko: '해', roman: 'hae', meaning: '太陽' },
      { ko: '별', roman: 'byeol', meaning: '星星' },
      { ko: '서예', roman: 'seoye', meaning: '書法', hanja: '書藝' },
      { ko: '무례', roman: 'murye', meaning: '沒禮貌（無禮）', hanja: '無禮' },
      { ko: '지혜', roman: 'jihye', meaning: '智慧', hanja: '智慧' },
      { ko: '폐', roman: 'pye', meaning: '肺', hanja: '肺' },
    ],
  },
  // 第 8 週：期中考
  { week: 8, words: [] },
  {
    week: 9,
    note: '複合母音 ㅢ（의사、의미、무늬、희망），還有 ㅟ ㅝ ㅙ（귀、뭐、왜、훠궈）和疑問詞。',
    // 課本這週還有 어디（哪裡），但第 4 週已經有了，ko 不能重複所以沒放
    words: [
      { ko: '훠궈', roman: 'hwogwo', meaning: '火鍋', en: 'huoguo' },
      { ko: '의사', roman: 'uisa', meaning: '醫師', hanja: '醫師' },
      // 意思不能和下面的 의의（意義）太像，所以標出中文的說法
      { ko: '의미', roman: 'uimi', meaning: '意思（意味）', hanja: '意味' },
      { ko: '이의', roman: 'iui', meaning: '異議', hanja: '異議' },
      { ko: '의의', roman: 'uiui', meaning: '意義', hanja: '意義' },
      { ko: '예의', roman: 'yeui', meaning: '禮儀', hanja: '禮儀' },
      { ko: '조사', roman: 'josa', meaning: '助詞', hanja: '助詞' },
      { ko: '무늬', roman: 'munui', meaning: '花紋' },
      { ko: '희다', roman: 'huida', meaning: '雪白' },
      { ko: '희망', roman: 'huimang', meaning: '希望', hanja: '希望' },
      { ko: '함께 해요', roman: 'hamkke haeyo', meaning: '一起做吧' },
      { ko: '귀', roman: 'gwi', meaning: '耳朵' },
      { ko: '배', roman: 'bae', meaning: '船' },
      { ko: '과', roman: 'gwa', meaning: '課', hanja: '課' },
      { ko: '왜', roman: 'wae', meaning: '為什麼' },
      { ko: '누구', roman: 'nugu', meaning: '誰' },
      { ko: '언제', roman: 'eonje', meaning: '何時' },
      { ko: '뭐', roman: 'mwo', meaning: '什麼' },
      { ko: '그렇게', roman: 'geureoke', meaning: '那樣地' },
      { ko: '시제', roman: 'sije', meaning: '時制', hanja: '時制' },
      { ko: '남녀', roman: 'namnyeo', meaning: '男女', hanja: '男女' },
      { ko: '남자', roman: 'namja', meaning: '男子', hanja: '男子' },
      { ko: '컵', roman: 'keop', meaning: '杯子', en: 'cup' },
      { ko: '부엌', roman: 'bueok', meaning: '廚房' },
      { ko: '결혼', roman: 'gyeolhon', meaning: '結婚', hanja: '結婚' },
      { ko: '졸업', roman: 'joreop', meaning: '畢業（卒業）', hanja: '卒業' },
    ],
  },
  // 第 10～16 週：課上到了再把單字填進來
  ...Array.from({ length: TOTAL_WEEKS - 9 }, (_, i) => ({ week: i + 10, words: [] })),
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
