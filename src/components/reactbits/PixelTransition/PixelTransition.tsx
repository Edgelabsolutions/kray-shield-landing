/*! PixelTransition, adapted from React Bits (TS + CSS variant, registry item
 * PixelTransition-TS-CSS, fetched 2026-10-24). https://reactbits.dev/animations/pixel-transition
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md (full text in ../README.md) */

/**
 * A pixel dissolve: solid pixels cover the card, the content underneath swaps, the pixels clear.
 * Canvas 2D, and it only draws while a transition runs. There is no idle loop.
 *
 * Kept from upstream: the algorithm (random / Bayer dither / ripple / edge-wipe patterns; pop,
 * grow and fade pixels; mosaic tones), hover, click and controlled (`active`) triggers, the
 * keyboard and touch handling, the inactive face hidden with `visibility` (so assistive tech only
 * reads the face on show), reduced motion swapping in a single frame, and DPR capped at 2.
 *
 * Kray changes:
 * - `pixelColors`: a palette, one colour per pixel picked by a stable hash. It defaults to the
 *   ММ-14 camo tokens (`--camo-1…6`), so the dissolve is drawn in the brand's pixel camo. Pass
 *   `pixelColor` alone for upstream's single colour plus `mosaic`. Any CSS colour works, including
 *   `var(--token)`, and colours are re-read at every transition start, so theme changes apply.
 * - `trigger="none"`: purely controlled through `active`, with no handlers, tab stop or role, for
 *   when a separate control (e.g. the Defence/Civil toggle) owns the state.
 * - `trigger="click"` exposes `aria-pressed`; `ariaLabel` names the control.
 * - `aspectRatio="auto"`: the two faces stack in one grid cell and the card takes the taller one's
 *   height, so text panels don't need a fixed ratio.
 * - Reduced motion is live (it follows the OS setting without a remount).
 * - Class names prefixed `rb-pixel-transition`; full width by default; radius and focus ring use
 *   the page tokens.
 *
 * SSR: nothing touches window/document during render; the server renders both faces (the first
 * visible) and an empty canvas. `client:visible` is enough when it's a standalone island.
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { usePrefersReducedMotion } from '../shared/reducedMotion'
import './PixelTransition.css'

export type PixelTransitionPattern = 'random' | 'dither' | 'ripple' | 'wipe'
export type PixelTransitionAnimation = 'pop' | 'grow' | 'fade'
export type PixelTransitionShape = 'square' | 'rounded' | 'circle'
export type PixelTransitionTrigger = 'hover' | 'click' | 'none'

export interface PixelTransitionProps {
  firstContent: ReactNode
  secondContent: ReactNode
  /** Pixels across the card. */
  gridSize?: number
  /** Single-colour mode (upstream). Ignored while `pixelColors` has entries. */
  pixelColor?: string
  /** Palette mode: each pixel takes one of these. Defaults to the camo tokens. */
  pixelColors?: string[]
  /** Single-colour mode only: spread of lighter/darker tones, 0–1. */
  mosaic?: number
  /** Seconds for each half (cover, then clear). */
  animationStepDuration?: number
  pattern?: PixelTransitionPattern
  randomness?: number
  pixelAnimation?: PixelTransitionAnimation
  pixelShape?: PixelTransitionShape
  gap?: number
  /** Cap the redraw rate (0 = every frame). */
  fps?: number
  trigger?: PixelTransitionTrigger
  /** Controlled state: `true` shows the second face. */
  active?: boolean
  once?: boolean
  onActiveChange?: (active: boolean) => void
  /** A CSS aspect ratio ('16 / 9'), a padding percentage ('100%'), or 'auto' (tallest face). */
  aspectRatio?: string
  /** Accessible name for `trigger="click"`. */
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

type Point = { x: number; y: number }

type Control = { go: (next: boolean, point: Point | null) => void; goal: () => number }

const PATTERNS: PixelTransitionPattern[] = ['random', 'dither', 'ripple', 'wipe']
const ANIMATIONS: PixelTransitionAnimation[] = ['pop', 'grow', 'fade']
const SHAPES: PixelTransitionShape[] = ['square', 'rounded', 'circle']
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const WINDOW = 0.35
const SEAL = 0.22
const TONES = 5
const LEVELS = 16

/** The ММ-14 camo palette from tokens.css (constant across themes, like the mark itself). */
const CAMO_PIXELS = [
  'var(--camo-1)',
  'var(--camo-2)',
  'var(--camo-3)',
  'var(--camo-4)',
  'var(--camo-5)',
  'var(--camo-6)',
]

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const smooth = (t: number) => t * t * (3 - 2 * t)

const hash = (x: number, y: number, seed: number) => {
  let h =
    Math.imul(x + 1, 0x27d4eb2d) ^ Math.imul(y + 1, 0x165667b1) ^ Math.imul(seed + 1, 0x2c1b3c6d)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function PixelTransition({
  firstContent,
  secondContent,
  gridSize = 10,
  pixelColor,
  pixelColors,
  mosaic = 0,
  animationStepDuration = 0.4,
  pattern = 'random',
  randomness = 0.3,
  pixelAnimation = 'pop',
  pixelShape = 'square',
  gap = 0,
  fps = 0,
  trigger = 'hover',
  active,
  once = false,
  onActiveChange,
  aspectRatio = '100%',
  ariaLabel,
  className = '',
  style,
}: PixelTransitionProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const firstRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLDivElement>(null)
  const controlRef = useRef<Control | null>(null)
  const pointRef = useRef<Point | null>(null)
  const hoverRef = useRef(false)
  const focusRef = useRef(false)
  const pointerRef = useRef<string>('mouse')
  // The face shown on mount (upstream kept it in a ref and read it during render).
  const [initial] = useState(active ? 1 : 0)
  const [pressed, setPressed] = useState(Boolean(active))
  const reduce = usePrefersReducedMotion()
  const palette = pixelColors && pixelColors.length ? pixelColors : pixelColor ? [] : CAMO_PIXELS
  const settings = {
    gridSize: clamp(Math.round(gridSize), 2, 80),
    pixelColor: pixelColor ?? '#ffffff',
    palette,
    mosaic: clamp(mosaic, 0, 1),
    duration: Math.max(0.05, animationStepDuration),
    pattern: PATTERNS.includes(pattern) ? pattern : ('random' as PixelTransitionPattern),
    randomness: clamp(randomness, 0, 1),
    animation: ANIMATIONS.includes(pixelAnimation)
      ? pixelAnimation
      : ('pop' as PixelTransitionAnimation),
    shape: SHAPES.includes(pixelShape) ? pixelShape : ('square' as PixelTransitionShape),
    gap: Math.max(0, gap),
    fps: clamp(fps, 0, 120),
    once,
    reduce,
  }
  const settingsRef = useRef(settings)
  useIsomorphicLayoutEffect(() => {
    settingsRef.current = settings
  })

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!root || !canvas || !ctx) return undefined

    const probe = document.createElement('canvas')
    probe.width = 1
    probe.height = 1
    const probeCtx = probe.getContext('2d', { willReadFrequently: true })
    const state = {
      progress: 0,
      base: initial,
      goal: initial,
      shown: initial,
      seed: 1,
      originX: 0.5,
      originY: 0.5,
      edge: 'left' as 'left' | 'right' | 'top' | 'bottom',
      tones: ['#ffffff'] as string[],
      toneKey: '',
      dpr: 1,
    }
    let raf = 0
    let last = 0
    let drawnAt = 0
    let alive = true

    const toneKeyOf = (s: typeof settings) => `${s.pixelColor}|${s.mosaic}|${s.palette.join(',')}`

    // Resolve any CSS colour (var(), color-mix(), names) through the cascade, then to RGBA.
    const toRgba = (value: string): number[] => {
      canvas.style.color = value
      const color = getComputedStyle(canvas).color
      canvas.style.color = ''
      if (!probeCtx) return [255, 255, 255, 1]
      probeCtx.clearRect(0, 0, 1, 1)
      probeCtx.fillStyle = color
      probeCtx.fillRect(0, 0, 1, 1)
      const data = probeCtx.getImageData(0, 0, 1, 1).data
      return [data[0], data[1], data[2], data[3] / 255]
    }

    const resolveTones = () => {
      const s = settingsRef.current
      if (s.palette.length) {
        state.tones = s.palette.map((value) => {
          const [r, g, b, a] = toRgba(value)
          return `rgba(${r}, ${g}, ${b}, ${a})`
        })
      } else {
        const rgba = toRgba(s.pixelColor)
        const target =
          (0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2]) / 255 > 0.5 ? 0 : 255
        state.tones = Array.from({ length: TONES }, (_, index) => {
          const mix = s.mosaic * 0.5 * (index / (TONES - 1))
          const [r, g, b] = rgba
            .slice(0, 3)
            .map((value) => Math.round(value + (target - value) * mix))
          return `rgba(${r}, ${g}, ${b}, ${rgba[3]})`
        })
      }
      state.toneKey = toneKeyOf(s)
    }

    const show = (index: number) => {
      state.shown = index
      if (firstRef.current) firstRef.current.style.visibility = index === 0 ? '' : 'hidden'
      if (secondRef.current) secondRef.current.style.visibility = index === 1 ? '' : 'hidden'
    }

    const draw = () => {
      const s = settingsRef.current
      const { width, height } = canvas
      ctx.globalAlpha = 1
      ctx.clearRect(0, 0, width, height)
      const progress = state.progress
      if (progress <= 0 || progress >= 1) return
      if (state.toneKey !== toneKeyOf(s)) resolveTones()

      const covering = progress < 0.5
      const local = covering ? progress * 2 : progress * 2 - 1
      const seal = covering
        ? smooth(clamp((local - 1 + SEAL) / SEAL, 0, 1))
        : 1 - smooth(clamp(local / SEAL, 0, 1))
      const cols = s.gridSize
      const cell = width / cols
      const rows = Math.ceil(height / cell)
      const top = (height - rows * cell) / 2
      const gap = Math.min(cell * 0.8, s.gap * state.dpr) * (1 - seal)
      const ox = state.originX * width
      const oy = state.originY * height
      const far = Math.max(
        Math.hypot(ox, oy),
        Math.hypot(width - ox, oy),
        Math.hypot(ox, height - oy),
        Math.hypot(width - ox, height - oy),
      )
      const paletteMode = s.palette.length > 0
      const toneCount = paletteMode ? state.tones.length : TONES
      const paths = new Map<number, Path2D>()

      for (let row = 0; row < rows; row++) {
        const y0 = top + row * cell
        const cy = y0 + cell / 2
        for (let col = 0; col < cols; col++) {
          const x0 = col * cell
          const cx = x0 + cell / 2
          const noise = hash(col, row, state.seed)
          let delay = noise
          if (s.pattern === 'dither') delay = (BAYER[(row & 3) * 4 + (col & 3)] + noise) / 16
          else if (s.pattern !== 'random') {
            let base
            if (s.pattern === 'ripple') base = Math.hypot(cx - ox, cy - oy) / Math.max(1, far)
            else if (state.edge === 'left') base = cx / width
            else if (state.edge === 'right') base = 1 - cx / width
            else if (state.edge === 'top') base = cy / height
            else base = 1 - cy / height
            delay = clamp(base, 0, 1) * (1 - s.randomness) + noise * s.randomness
          }

          let amount
          if (s.animation === 'pop') amount = local >= delay === covering ? 1 : 0
          else {
            const t = smooth(clamp((local - delay * (1 - WINDOW)) / WINDOW, 0, 1))
            amount = covering ? t : 1 - t
          }
          if (amount <= 0.002) continue

          const size = (s.animation === 'grow' ? cell * amount : cell) - gap
          if (size <= 0) continue
          const level = s.animation === 'fade' ? Math.max(1, Math.round(amount * LEVELS)) : LEVELS
          const tone = paletteMode || s.mosaic > 0 ? Math.floor(hash(col, row, 7) * toneCount) : 0
          const key = tone * (LEVELS + 1) + level
          let path = paths.get(key)
          if (!path) {
            path = new Path2D()
            paths.set(key, path)
          }

          if (s.shape === 'circle') {
            const radius = (size / 2) * (1 + 0.45 * seal)
            path.moveTo(cx + radius, cy)
            path.arc(cx, cy, radius, 0, Math.PI * 2)
          } else if (s.shape === 'rounded' && seal < 1 && path.roundRect) {
            path.roundRect(cx - size / 2, cy - size / 2, size, size, size * 0.3 * (1 - seal))
          } else if (size >= cell - 0.01) {
            const left = Math.round(x0)
            const upper = Math.round(y0)
            path.rect(left, upper, Math.round(x0 + cell) - left, Math.round(y0 + cell) - upper)
          } else {
            path.rect(cx - size / 2, cy - size / 2, size, size)
          }
        }
      }

      paths.forEach((path, key) => {
        ctx.globalAlpha = (key % (LEVELS + 1)) / LEVELS
        ctx.fillStyle = state.tones[Math.floor(key / (LEVELS + 1))] ?? state.tones[0]
        ctx.fill(path)
      })
      ctx.globalAlpha = 1
    }

    const paint = () => {
      const index = state.progress >= 0.5 ? 1 - state.base : state.base
      if (index !== state.shown) show(index)
      draw()
    }

    const frame = (now: number) => {
      raf = 0
      if (!alive) return
      const s = settingsRef.current
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60
      last = now
      const aim = state.goal === state.base ? 0 : 1
      const step = s.reduce ? 1 : dt / (2 * s.duration)
      state.progress =
        aim > state.progress
          ? Math.min(aim, state.progress + step)
          : Math.max(aim, state.progress - step)
      const settled = state.progress === aim
      if (settled && aim === 1) {
        state.base = 1 - state.base
        state.progress = 0
      }
      if (settled || !s.fps || now - drawnAt >= 1000 / s.fps - 2) {
        drawnAt = now
        paint()
      }
      if (!settled) raf = requestAnimationFrame(frame)
    }

    const start = (point: Point | null) => {
      const rect = root.getBoundingClientRect()
      const x = point ? clamp((point.x - rect.left) / Math.max(1, rect.width), 0, 1) : 0.5
      const y = point ? clamp((point.y - rect.top) / Math.max(1, rect.height), 0, 1) : 0.5
      state.originX = x
      state.originY = y
      state.seed = Math.floor(Math.random() * 65536)
      if (!point) state.edge = 'left'
      else {
        const sides: ['left' | 'right' | 'top' | 'bottom', number][] = [
          ['left', x * rect.width],
          ['right', (1 - x) * rect.width],
          ['top', y * rect.height],
          ['bottom', (1 - y) * rect.height],
        ]
        state.edge = sides.reduce((best, side) => (side[1] < best[1] ? side : best))[0]
      }
      resolveTones()
    }

    const go = (next: boolean, point: Point | null) => {
      const goal = next ? 1 : 0
      if (goal === state.goal) return
      if (!goal && settingsRef.current.once) return
      state.goal = goal
      if (state.progress === 0 && goal !== state.base) start(point)
      if (raf) return
      last = 0
      drawnAt = 0
      raf = requestAnimationFrame(frame)
    }

    controlRef.current = { go, goal: () => state.goal }

    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(root.clientWidth * state.dpr))
      canvas.height = Math.max(1, Math.round(root.clientHeight * state.dpr))
      draw()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    resize()

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      controlRef.current = null
      resizeObserver.disconnect()
    }
  }, [initial])

  useEffect(() => {
    if (active === undefined) return
    controlRef.current?.go(active, pointRef.current)
    pointRef.current = null
  }, [active])

  const hover = trigger === 'hover'
  const click = trigger === 'click'

  const request = (next: boolean, point: Point | null) => {
    const control = controlRef.current
    if (!control || (!next && once && control.goal() === 1)) return
    if (active === undefined) {
      control.go(next, point)
      setPressed(next)
    } else pointRef.current = point
    onActiveChange?.(next)
  }

  const pointOf = (event: PointerEvent | MouseEvent): Point => ({
    x: event.clientX,
    y: event.clientY,
  })

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    hoverRef.current = true
    if (hover) request(true, pointOf(event))
  }

  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    hoverRef.current = false
    if (hover && !focusRef.current) request(false, pointOf(event))
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerRef.current = event.pointerType
  }

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (hover && pointerRef.current !== 'touch') return
    request(controlRef.current?.goal() !== 1, pointOf(event))
  }

  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!hover || event.currentTarget.contains(event.relatedTarget as Node | null)) return
    if (!(event.target as HTMLElement).matches(':focus-visible')) return
    focusRef.current = true
    request(true, null)
  }

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!focusRef.current || event.currentTarget.contains(event.relatedTarget as Node | null))
      return
    focusRef.current = false
    if (!hoverRef.current) request(false, null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (hover || event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    request(controlRef.current?.goal() !== 1, null)
  }

  const interaction: HTMLAttributes<HTMLDivElement> =
    trigger === 'none'
      ? {}
      : {
          tabIndex: 0,
          role: click ? 'button' : undefined,
          'aria-pressed': click ? (active ?? pressed) : undefined,
          'aria-label': click ? ariaLabel : undefined,
          onPointerEnter,
          onPointerLeave,
          onPointerDown,
          onClick,
          onFocus,
          onBlur,
          onKeyDown,
        }

  const ratio = String(aspectRatio).trim()
  const auto = ratio === 'auto'
  const padded = !auto && ratio.endsWith('%')
  const classes = ['rb-pixel-transition', auto && 'rb-pixel-transition--auto', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={rootRef}
      className={classes}
      style={padded || auto ? style : { aspectRatio: ratio, ...style }}
      {...interaction}
    >
      {padded && <div style={{ paddingTop: ratio }} />}
      <div
        ref={firstRef}
        className="rb-pixel-transition__face rb-pixel-transition__face--first"
        style={{ visibility: initial === 0 ? undefined : 'hidden' }}
      >
        {firstContent}
      </div>
      <div
        ref={secondRef}
        className="rb-pixel-transition__face rb-pixel-transition__face--second"
        style={{ visibility: initial === 1 ? undefined : 'hidden' }}
      >
        {secondContent}
      </div>
      <canvas ref={canvasRef} className="rb-pixel-transition__pixels" aria-hidden="true" />
    </div>
  )
}

export default PixelTransition
