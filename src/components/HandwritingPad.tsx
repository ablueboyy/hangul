import { useCallback, useEffect, useRef, useState } from 'react'

/** 筆畫的點用 0..1 的相對座標存，畫框大小變了（轉橫、換主題重畫）也不會跑位 */
type Point = [number, number]
type Stroke = Point[]

interface Props {
  /** 看答案之後鎖住，不能再偷改 */
  locked: boolean
}

/**
 * 手寫畫框：手指或觸控筆直接寫，底下有淡淡的十字格方便抓比例。
 * 只負責讓人寫，不做辨識 —— 對不對是看完答案自己判斷。
 * 換題時由外面換 key 重新掛載，就等於清空。
 */
export function HandwritingPad({ locked }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([])
  const drawing = useRef<Stroke | null>(null)
  // 只拿來讓「復原／清除」按鈕知道有沒有東西可以刪
  const [count, setCount] = useState(0)

  const context = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return null
    const ink = getComputedStyle(canvas).getPropertyValue('--color-ink').trim() || '#fff'
    ctx.strokeStyle = ink
    ctx.fillStyle = ink
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = Math.max(4, canvas.width / 70)
    return { canvas, ctx }
  }, [])

  const redraw = useCallback(() => {
    const c = context()
    if (!c) return
    const { canvas, ctx } = c
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of strokes.current) drawStroke(ctx, canvas, stroke)
  }, [context])

  // 畫布的實際像素跟著顯示大小和螢幕密度走，不然 Retina 上會糊
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      redraw()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [redraw])

  const pointAt = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height]
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (locked) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = [pointAt(e)]
    const c = context()
    if (c) drawStroke(c.ctx, c.canvas, drawing.current)
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = drawing.current
    if (!stroke) return
    const c = context()
    if (!c) return
    // 快速劃動時瀏覽器會把好幾個點合併成一次事件，全部拿出來畫線才會順
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    const rect = c.canvas.getBoundingClientRect()
    for (const ev of events) {
      const prev = stroke[stroke.length - 1]
      const next: Point = [(ev.clientX - rect.left) / rect.width, (ev.clientY - rect.top) / rect.height]
      stroke.push(next)
      drawStroke(c.ctx, c.canvas, [prev, next])
    }
  }

  const onUp = () => {
    if (!drawing.current) return
    strokes.current.push(drawing.current)
    drawing.current = null
    setCount(strokes.current.length)
  }

  const undo = () => {
    strokes.current.pop()
    setCount(strokes.current.length)
    redraw()
  }

  const clear = () => {
    strokes.current = []
    setCount(0)
    redraw()
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-line bg-surface">
        {/* 十字輔助線，只是幫忙抓大小和置中 */}
        <div className="pointer-events-none absolute inset-x-4 top-1/2 border-t border-dashed border-line" />
        <div className="pointer-events-none absolute inset-y-4 left-1/2 border-l border-dashed border-line" />
        {count === 0 && !locked && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink-4">
            在這裡寫
          </span>
        )}
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="absolute inset-0 h-full w-full touch-none"
          aria-label="手寫區"
        />
      </div>
      {!locked && (
        <div className="flex justify-end gap-4 text-sm">
          <button type="button" onClick={undo} disabled={count === 0} className="text-ink-3 disabled:text-ink-5">
            ↶ 復原
          </button>
          <button type="button" onClick={clear} disabled={count === 0} className="text-ink-3 disabled:text-ink-5">
            清除
          </button>
        </div>
      )}
    </div>
  )
}

function drawStroke(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, stroke: Stroke) {
  const [first, ...rest] = stroke
  if (!first) return
  const x = (p: Point) => p[0] * canvas.width
  const y = (p: Point) => p[1] * canvas.height
  if (rest.length === 0) {
    // 只點一下沒有線段可畫，補一個圓點才看得到
    ctx.beginPath()
    ctx.arc(x(first), y(first), ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(x(first), y(first))
  for (const p of rest) ctx.lineTo(x(p), y(p))
  ctx.stroke()
}
