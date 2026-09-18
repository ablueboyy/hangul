"""
產生離線發音音檔。

為什麼要這個：瀏覽器內建的語音合成在各裝置上差異太大 —— 有的系統根本沒有韓文
語音，就拿英文語音硬念韓文字，出來的東西完全不像韓語。所以改成事先用 edge-tts
（免費、不用帳號、不用 API key）把所有會用到的音一次產好，commit 進 repo，
App 執行時就只是播 mp3，每台裝置聽到的都一樣。

  pip install edge-tts lameenc     # lameenc 目前沒用到，純 mp3 幀裁切不需要解碼
  npm run audio                    # = python scripts/make_audio.py

edge-tts 回傳的每段音檔前後都有一大段靜音（0.6 秒的字會給你 1.87 秒的檔），
所以這裡用 WordBoundary 事件拿到實際說話的區間，再按 mp3 的幀邊界把多餘的
靜音切掉 —— 檔案大小因此少掉六成以上。
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
HANGUL_TS = ROOT / "src" / "data" / "hangul.ts"
VOCAB_TS = ROOT / "src" / "data" / "vocab.ts"
OUT_DIR = ROOT / "public" / "audio"
MANIFEST = ROOT / "src" / "data" / "audio-manifest.json"

DEFAULT_VOICE = "ko-KR-SunHiNeural"
DEFAULT_RATE = "-10%"
TICKS_PER_SECOND = 10_000_000

# ── 音節組合（和 src/lib/syllable.ts 同一套 Unicode 規則）────────────────
SYLLABLE_BASE = 0xAC00
INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
MEDIALS = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"


def compose(initial: str, medial: str) -> str:
    i, m = INITIALS.index(initial), MEDIALS.index(medial)
    return chr(SYLLABLE_BASE + (i * 21 + m) * 28)


def clip_key(text: str) -> str:
    """檔名用碼位十六進位接起來，避免非 ASCII 檔名在各種伺服器上出包。"""
    return "-".join(f"{ord(c):x}" for c in text)


# ── 要產哪些音 ────────────────────────────────────────────────────────
def collect_texts() -> list[str]:
    src = HANGUL_TS.read_text(encoding="utf-8")
    names = re.findall(r"name: '([^']+)'", src)
    words = re.findall(r"word: '([^']+)'", src)
    sounds = re.findall(r"sound: '([^']+)'", src)
    if len(names) != 40 or len(words) != 40:
        sys.exit(f"hangul.ts 解析結果不對：name={len(names)} word={len(words)}，預期各 40")

    # 每週單字庫。課上到哪就填到哪，所以這裡不檢查數量
    vocab = re.findall(r"ko: '([^']+)'", VOCAB_TS.read_text(encoding="utf-8"))
    print(f"字母 {len(names)} 個、例詞 {len(words)} 個、單字 {len(vocab)} 個")

    syllables = [compose(i, m) for i in INITIALS for m in MEDIALS]
    seen: dict[str, None] = {}
    for t in [*syllables, *names, *sounds, *words, *vocab]:
        seen.setdefault(t, None)
    return list(seen)


# ── mp3 幀裁切 ────────────────────────────────────────────────────────
_BITRATES = {
    1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],  # MPEG1 L3
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],  # MPEG2/2.5 L3
}
_RATES = {3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000]}


def _frames(data: bytes) -> list[tuple[int, int, float]]:
    """回傳 (起始位元組, 長度, 播放秒數) 的清單。"""
    out: list[tuple[int, int, float]] = []
    i, n = 0, len(data)
    while i + 4 <= n:
        if data[i] != 0xFF or (data[i + 1] & 0xE0) != 0xE0:
            i += 1
            continue
        h = data[i : i + 4]
        ver = (h[1] >> 3) & 0x03  # 3=MPEG1, 2=MPEG2, 0=MPEG2.5
        layer = (h[1] >> 1) & 0x03  # 1 = Layer III
        br_idx = (h[2] >> 4) & 0x0F
        sr_idx = (h[2] >> 2) & 0x03
        pad = (h[2] >> 1) & 0x01
        if layer != 1 or ver == 1 or sr_idx == 3 or br_idx in (0, 15):
            i += 1
            continue
        bitrate = _BITRATES[1 if ver == 3 else 2][br_idx] * 1000
        rate = _RATES[ver][sr_idx]
        samples = 1152 if ver == 3 else 576
        length = (samples // 8) * bitrate // rate + pad
        if length <= 4 or i + length > n:
            i += 1
            continue
        out.append((i, length, samples / rate))
        i += length
    return out


def trim(data: bytes, start_s: float, end_s: float, head: float = 0.08, tail: float = 0.16) -> bytes:
    """只留下說話區間前後各留一點餘裕的那些幀。"""
    frames = _frames(data)
    if not frames:
        return data
    lo, hi = max(0.0, start_s - head), end_s + tail
    kept, t = [], 0.0
    for off, length, dur in frames:
        if t + dur > lo and t < hi:
            kept.append(data[off : off + length])
        t += dur
    return b"".join(kept) if kept else data


# ── 產生 ──────────────────────────────────────────────────────────────
async def synth(text: str, voice: str, rate: str) -> bytes:
    audio = bytearray()
    first: float | None = None
    last = 0.0
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            start = chunk["offset"] / TICKS_PER_SECOND
            end = start + chunk["duration"] / TICKS_PER_SECOND
            first = start if first is None else min(first, start)
            last = max(last, end)
    if not audio:
        raise RuntimeError("沒有收到音訊")
    return trim(bytes(audio), first, last) if first is not None else bytes(audio)


async def one(text: str, voice: str, rate: str, force: bool, sem: asyncio.Semaphore) -> tuple[str, int]:
    path = OUT_DIR / f"{clip_key(text)}.mp3"
    if path.exists() and not force:
        return text, 0
    async with sem:
        for attempt in range(4):
            try:
                path.write_bytes(await synth(text, voice, rate))
                return text, path.stat().st_size
            except Exception as err:  # 連線偶爾會被伺服器切掉，retry 就好
                if attempt == 3:
                    raise RuntimeError(f"{text} 失敗：{err}") from err
                await asyncio.sleep(1.5 * (attempt + 1))
    return text, 0


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default=DEFAULT_VOICE)
    ap.add_argument("--rate", default=DEFAULT_RATE)
    ap.add_argument("--force", action="store_true", help="已存在的檔案也重產")
    ap.add_argument("--jobs", type=int, default=8)
    ap.add_argument("--limit", type=int, default=0, help="只產前 N 個，用來試跑")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    texts = collect_texts()
    if args.limit:
        texts = texts[: args.limit]

    sem = asyncio.Semaphore(args.jobs)
    done = 0
    tasks = [asyncio.create_task(one(t, args.voice, args.rate, args.force, sem)) for t in texts]
    for fut in asyncio.as_completed(tasks):
        _, size = await fut
        done += 1
        if done % 25 == 0 or done == len(texts):
            print(f"  {done}/{len(texts)}", flush=True)

    total = sum(f.stat().st_size for f in OUT_DIR.glob("*.mp3"))
    MANIFEST.write_text(
        json.dumps(
            {"voice": args.voice, "rate": args.rate, "keys": sorted(clip_key(t) for t in texts)},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"完成：{len(texts)} 個音檔，共 {total / 1024 / 1024:.2f} MB → {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
