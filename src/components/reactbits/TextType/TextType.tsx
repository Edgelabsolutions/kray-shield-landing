/*! TextType, adapted from React Bits (TS + CSS variant, registry item TextType-TS-CSS, fetched
 * 2026-10-24). https://reactbits.dev/text-animations/text-type
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md (full text in ../README.md) */

/**
 * Typewriter: types each sentence, pauses, deletes (backspace or select-all) and moves on, with a
 * GSAP-blinked cursor that glides to the caret.
 *
 * Kept from upstream: the typing state machine (variable speed, typos and corrections, reverse
 * mode, select-delete, per-character entrance effects), the visually hidden full text with the
 * typed copy `aria-hidden`, and grapheme-safe splitting (Cyrillic, emoji).
 *
 * Kray changes:
 * - Reduced motion shows ONE sentence, fully typed and still: `reducedMotionIndex`, by default the
 *   last sentence when `loop` is false (where the sequence would settle) or the first when it loops.
 *   Upstream kept swapping sentences every `pauseDuration` with hard cuts.
 * - Pauses while off-screen (IntersectionObserver), including the cursor blink timeline. Upstream
 *   only gated the first start (`startOnVisible`).
 * - `paused` lets a parent hold the sequence (e.g. until the hero visual has played).
 * - `srText` overrides the hidden copy (upstream read every sentence: "Efficiency Reliability
 *   Security").
 * - Class names prefixed `rb-text-type`, `cursorColor` defaults to `var(--accent)`, and select-delete
 *   uses the page's selection tint.
 *
 * SSR: no window/document during render. The server renders the hidden full text plus an empty
 * typed line and the cursor, which is the typewriter's natural first frame. `client:load` or
 * `client:visible` both work; no `client:only` needed.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { gsap } from 'gsap'
import { usePrefersReducedMotion } from '../shared/reducedMotion'
import './TextType.css'

export interface TextTypeProps extends HTMLAttributes<HTMLElement> {
  className?: string
  showCursor?: boolean
  hideCursorWhileTyping?: boolean
  cursorStyle?: 'character' | 'bar' | 'block' | 'underscore'
  cursorCharacter?: ReactNode
  cursorColor?: string
  cursorBlinkDuration?: number
  cursorClassName?: string
  cursorGlide?: boolean
  text: string | string[]
  as?: ElementType
  typingSpeed?: number
  initialDelay?: number
  pauseDuration?: number
  deletingSpeed?: number
  deleteMode?: 'backspace' | 'select'
  typeEffect?: 'none' | 'fade' | 'blur' | 'rise'
  mistakes?: number
  prefix?: string
  prefixColor?: string
  loop?: boolean
  textColors?: string[]
  variableSpeed?: { min: number; max: number }
  onSentenceComplete?: (sentence: string, index: number) => void
  startOnVisible?: boolean
  reverseMode?: boolean
  /** Hold the sequence where it is (timers stop; the cursor keeps blinking). */
  paused?: boolean
  /** The accessible text. Defaults to the prefix plus every sentence. */
  srText?: string
  /** Which sentence reduced motion shows. Defaults to the last (no loop) or the first (loop). */
  reducedMotionIndex?: number
}

type Effect = { keyframes: Keyframe[]; options: KeyframeAnimationOptions }
type Typo = { plan: string[]; tail: string[]; fixing: boolean }

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** Gives the zero-width caret a line box to measure. Escaped on purpose: keep it visible in source. */
const ZERO_WIDTH_SPACE = '\u200B'

const NEIGHBORS: Record<string, string> = {
  a: 'qwsz',
  b: 'vghn',
  c: 'xdfv',
  d: 'serfcx',
  e: 'wsdr',
  f: 'drtgvc',
  g: 'ftyhbv',
  h: 'gyujnb',
  i: 'ujko',
  j: 'huikmn',
  k: 'jiolm',
  l: 'kop',
  m: 'njk',
  n: 'bhjm',
  o: 'iklp',
  p: 'ol',
  q: 'wa',
  r: 'edft',
  s: 'awedxz',
  t: 'rfgy',
  u: 'yhji',
  v: 'cfgb',
  w: 'qase',
  x: 'zsdc',
  y: 'tghu',
  z: 'asx',
  0: '9p',
  1: '2q',
  2: '13w',
  3: '24e',
  4: '35r',
  5: '46t',
  6: '57y',
  7: '68u',
  8: '79i',
  9: '80o',
}

const EFFECTS: Record<'fade' | 'blur' | 'rise', Effect> = {
  fade: {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 360, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
  },
  blur: {
    keyframes: [
      { opacity: 0, filter: 'blur(0.3em)' },
      { opacity: 1, filter: 'blur(0em)' },
    ],
    options: { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  },
  rise: {
    keyframes: [
      { opacity: 0, top: '0.6em' },
      { opacity: 1, top: '0em' },
    ],
    options: { duration: 480, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' },
  },
}

const graphemes = (value: string): string[] => {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Array.from(
      new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value),
      (part) => part.segment,
    )
  }
  return Array.from(value)
}

const typoFor = (char: string): string | null => {
  const keys = NEIGHBORS[char.toLowerCase()]
  if (!keys) return null
  const pick = keys[Math.floor(Math.random() * keys.length)]
  return char === char.toLowerCase() ? pick : pick.toUpperCase()
}

const TextType = ({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  deleteMode = 'backspace',
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorStyle = 'character',
  cursorCharacter = '|',
  cursorColor = 'var(--accent)',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  cursorGlide = true,
  typeEffect = 'none',
  mistakes = 0,
  prefix = '',
  prefixColor = 'currentColor',
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  paused = false,
  srText,
  reducedMotionIndex,
  ...props
}: TextTypeProps) => {
  const [textIndex, setTextIndex] = useState(0)
  const [count, setCount] = useState(0)
  const [selected, setSelected] = useState(0)
  const [typo, setTypo] = useState<Typo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [started, setStarted] = useState(!startOnVisible)
  const [inView, setInView] = useState(true)
  const reduceMotion = usePrefersReducedMotion()
  const containerRef = useRef<HTMLElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const blinkRef = useRef<HTMLSpanElement>(null)
  const blinkTimeline = useRef<ReturnType<typeof gsap.timeline> | null>(null)
  const blinkResume = useRef<ReturnType<typeof gsap.delayedCall> | null>(null)
  const caretPosition = useRef<{ x: number; y: number } | null>(null)
  const placeCursor = useRef<(instant: boolean) => void>(() => {})
  const lastTypo = useRef(-1)
  const onSentenceCompleteRef = useRef(onSentenceComplete)

  const textKey = Array.isArray(text) ? text.join('\u0000') : String(text ?? '')
  const textArray = useMemo(() => textKey.split('\u0000'), [textKey])
  const staticIndex = Math.min(
    Math.max(0, reducedMotionIndex ?? (loop ? 0 : textArray.length - 1)),
    textArray.length - 1,
  )
  const index = reduceMotion ? staticIndex : textIndex % textArray.length
  const chars = useMemo(() => graphemes(textArray[index]), [textArray, index])
  const total = chars.length
  const shown = reduceMotion ? total : Math.min(count, total)
  const liveTypo = reduceMotion ? null : typo
  const minSpeed = variableSpeed?.min ?? typingSpeed
  const maxSpeed = variableSpeed?.max ?? typingSpeed
  const pace = (minSpeed + maxSpeed) / 2
  const glideTime = Math.min(0.18, Math.max(0.06, pace * 0.0016))

  useEffect(() => {
    onSentenceCompleteRef.current = onSentenceComplete
  }, [onSentenceComplete])

  // Visibility: the first sighting starts the sequence (startOnVisible); leaving pauses it.
  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting) setStarted(true)
      },
      { threshold: 0.1 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [Component])

  useEffect(() => {
    const blink = blinkRef.current
    if (!showCursor || !blink) return
    gsap.set(blink, { opacity: 1 })
    if (reduceMotion || cursorBlinkDuration <= 0 || !inView) return

    const hold = cursorBlinkDuration * 0.7
    const fade = cursorBlinkDuration * 0.45
    const timeline = gsap.timeline({ repeat: -1 })
    timeline
      .to(blink, { opacity: 0, duration: fade, ease: 'sine.inOut' }, hold)
      .to(
        blink,
        { opacity: 1, duration: fade, ease: 'sine.inOut' },
        hold + fade + cursorBlinkDuration * 0.4,
      )
    blinkTimeline.current = timeline

    return () => {
      timeline.kill()
      blinkResume.current?.kill()
      gsap.killTweensOf(blink)
      blinkTimeline.current = null
    }
  }, [showCursor, cursorBlinkDuration, reduceMotion, inView])

  // Unmount: stop any cursor glide still in flight.
  useEffect(() => {
    const cursor = cursorRef.current
    return () => {
      if (cursor) gsap.killTweensOf(cursor)
    }
  }, [showCursor])

  useIsomorphicLayoutEffect(() => {
    caretPosition.current = null
  }, [showCursor])

  useIsomorphicLayoutEffect(() => {
    placeCursor.current = (instant: boolean) => {
      const caret = caretRef.current
      const cursor = cursorRef.current
      if (!caret || !cursor) return

      const x = caret.offsetLeft
      const y = caret.offsetTop
      const last = caretPosition.current
      if (last && Math.abs(last.x - x) < 0.5 && Math.abs(last.y - y) < 0.5) return
      caretPosition.current = { x, y }

      if (instant || !last || !cursorGlide || reduceMotion || Math.abs(last.y - y) > 1) {
        gsap.killTweensOf(cursor)
        gsap.set(cursor, { x, y })
      } else {
        gsap.to(cursor, { x, y, duration: glideTime, ease: 'power3.out', overwrite: true })
      }

      const timeline = blinkTimeline.current
      const blink = blinkRef.current
      if (instant || !timeline || !blink) return
      timeline.pause()
      blinkResume.current?.kill()
      gsap.to(blink, { opacity: 1, duration: 0.12, ease: 'power1.out' })
      blinkResume.current = gsap.delayedCall(0.12, () => timeline.restart())
    }
    placeCursor.current(false)
  })

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => placeCursor.current(true))
    observer.observe(node)
    return () => observer.disconnect()
  }, [Component])

  useEffect(() => {
    if (!started || !inView || paused || reduceMotion) return

    let timeout: ReturnType<typeof setTimeout> | undefined
    const wait = (ms: number, next: () => void) => {
      timeout = setTimeout(next, ms)
    }
    const speed = () => minSpeed + Math.random() * (maxSpeed - minSpeed)

    if (!isDeleting) {
      if (typo) {
        if (!typo.fixing) {
          if (typo.tail.length < typo.plan.length) {
            wait(speed(), () =>
              setTypo({ ...typo, tail: typo.plan.slice(0, typo.tail.length + 1) }),
            )
          } else {
            wait(260 + Math.random() * 320, () => setTypo({ ...typo, fixing: true }))
          }
        } else if (typo.tail.length) {
          wait(Math.max(45, deletingSpeed), () =>
            setTypo({ ...typo, tail: typo.tail.slice(0, -1) }),
          )
        } else {
          wait(90 + Math.random() * 140, () => setTypo(null))
        }
      } else if (shown < total) {
        const lead = shown === 0 ? initialDelay : 0
        const next = reverseMode ? total - shown - 1 : shown
        const wrong =
          mistakes > 0 && shown > 0 && lastTypo.current !== next ? typoFor(chars[next]) : null

        if (wrong && Math.random() < Math.min(1, mistakes) * 0.16) {
          lastTypo.current = next
          const plan = [wrong]
          const follow = chars[reverseMode ? next - 1 : next + 1]
          if (follow && follow.trim() && Math.random() < 0.4) plan.push(follow)
          wait(lead + speed(), () => setTypo({ plan, tail: [wrong], fixing: false }))
        } else {
          wait(lead + speed(), () => setCount(shown + 1))
        }
      } else if (loop || index < textArray.length - 1) {
        wait(pauseDuration, () => setIsDeleting(true))
      }
    } else if (shown > 0) {
      if (deleteMode === 'select') {
        if (selected < shown) {
          wait(deletingSpeed, () => setSelected(selected + 1))
        } else {
          wait(Math.max(160, deletingSpeed * 8), () => {
            setSelected(0)
            setCount(0)
          })
        }
      } else {
        wait(deletingSpeed, () => setCount(shown - 1))
      }
    } else {
      // Deferred one tick (upstream ran this synchronously in the effect, so StrictMode reported
      // the sentence twice).
      wait(0, () => {
        onSentenceCompleteRef.current?.(textArray[index], index)
        lastTypo.current = -1
        setSelected(0)
        setIsDeleting(false)
        setTextIndex((index + 1) % textArray.length)
      })
    }

    return () => clearTimeout(timeout)
  }, [
    started,
    inView,
    paused,
    isDeleting,
    shown,
    total,
    chars,
    selected,
    typo,
    index,
    textArray,
    loop,
    deletingSpeed,
    deleteMode,
    pauseDuration,
    initialDelay,
    minSpeed,
    maxSpeed,
    mistakes,
    reverseMode,
    reduceMotion,
  ])

  const animateChar = useCallback(
    (node: HTMLSpanElement | null) => {
      const effect = typeEffect === 'none' ? undefined : EFFECTS[typeEffect]
      if (!node || !effect || reduceMotion || typeof node.animate !== 'function') return
      node.animate(effect.keyframes, effect.options)
    },
    [typeEffect, reduceMotion],
  )

  const start = reverseMode ? total - shown : 0
  const marked = reduceMotion ? 0 : Math.min(selected, shown)
  const correct = chars.slice(start, start + shown).map((char, i) => {
    const isMarked = reverseMode ? i < marked : i >= shown - marked
    return (
      <span
        key={start + i}
        ref={animateChar}
        className={
          isMarked ? 'rb-text-type__char rb-text-type__char--selected' : 'rb-text-type__char'
        }
      >
        {char}
      </span>
    )
  })
  const mistyped = (liveTypo?.tail ?? []).map((char, i) => (
    <span key={`typo-${i}`} ref={animateChar} className="rb-text-type__char">
      {char}
    </span>
  ))
  if (reverseMode) mistyped.reverse()

  const caret = (
    <span ref={caretRef} className="rb-text-type__caret">
      {ZERO_WIDTH_SPACE}
    </span>
  )
  const color = textColors.length ? textColors[index % textColors.length] : 'inherit'
  const typing = !reduceMotion && (shown < total || isDeleting || liveTypo !== null)
  const hideCursor = hideCursorWhileTyping && typing
  const customCursorColor =
    cursorColor && cursorColor !== 'currentColor' ? { color: cursorColor } : undefined

  return (
    <Component
      ref={containerRef}
      className={`rb-text-type${className ? ` ${className}` : ''}`}
      {...props}
    >
      <span className="rb-text-type__sr">{srText ?? prefix + textArray.join(' ')}</span>
      <span className="rb-text-type__content" aria-hidden="true">
        {prefix ? (
          <span className="rb-text-type__prefix" style={{ color: prefixColor }}>
            {prefix}
          </span>
        ) : null}
        {reverseMode && caret}
        <span style={{ color }}>
          {reverseMode ? [...mistyped, ...correct] : [...correct, ...mistyped]}
        </span>
        {!reverseMode && caret}
      </span>
      {showCursor && (
        <span
          ref={cursorRef}
          aria-hidden="true"
          className={`rb-text-type__cursor rb-text-type__cursor--${cursorStyle}${hideCursor ? ' rb-text-type__cursor--hidden' : ''}${cursorClassName ? ` ${cursorClassName}` : ''}`}
          style={customCursorColor}
        >
          <span ref={blinkRef} className="rb-text-type__blink">
            {cursorStyle === 'character' ? (
              cursorCharacter
            ) : (
              <span className="rb-text-type__shape" />
            )}
          </span>
        </span>
      )}
    </Component>
  )
}

export default TextType
