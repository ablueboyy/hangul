/**
 * 產生 PWA 用的 icon PNG。
 * 圖案是用純幾何長方形畫出來的「가」，所以不需要任何字型或繪圖套件 —
 * 直接手刻 PNG（zlib 是 Node 內建的）。
 *
 *   node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [15, 23, 42, 255] // slate-900
const FG = [56, 189, 248, 255] // sky-400

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = -1
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  // 10~12 保持 0：預設的壓縮 / 過濾 / 非交錯

  // 每條掃描線前面要加一個 filter type byte（0 = None）
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** 「가」的筆畫，全部用 [x, y, w, h] 的比例表示 */
const STROKES = [
  [0.14, 0.16, 0.36, 0.075], // ㄱ 的上橫
  [0.425, 0.16, 0.075, 0.45], // ㄱ 的右豎
  [0.62, 0.16, 0.075, 0.68], // ㅏ 的長豎
  [0.695, 0.42, 0.175, 0.075], // ㅏ 的右短橫
]

function render(size) {
  const px = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) px.set(BG, i * 4)

  for (const [rx, ry, rw, rh] of STROKES) {
    const x0 = Math.round(rx * size)
    const y0 = Math.round(ry * size)
    const x1 = Math.round((rx + rw) * size)
    const y1 = Math.round((ry + rh) * size)
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        px.set(FG, (y * size + x) * 4)
      }
    }
  }
  return px
}

mkdirSync(OUT_DIR, { recursive: true })
for (const size of [192, 512]) {
  const file = join(OUT_DIR, `icon-${size}.png`)
  writeFileSync(file, encodePng(size, render(size)))
  console.log('wrote', file)
}

// 瀏覽器分頁用的向量 icon，同一組筆畫直接轉成 SVG
const rects = STROKES.map(
  ([x, y, w, h]) =>
    `<rect x="${x * 512}" y="${y * 512}" width="${w * 512}" height="${h * 512}" rx="6" fill="#38bdf8"/>`,
).join('')
writeFileSync(
  join(OUT_DIR, 'icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#0f172a"/>${rects}</svg>\n`,
)
console.log('wrote', join(OUT_DIR, 'icon.svg'))
