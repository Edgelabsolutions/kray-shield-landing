/**
 * The hero's signature visual: Share A ⊕ Share B = the disk key.
 *
 * Two grids of noise (the shares) and a third that only becomes the key — drawn as the Kray Shield
 * mark — while both are brought together at boot. A scan bar sweeps the same column across all
 * three grids, so you can watch each column of the key being XOR-ed into existence; then the key
 * is wiped and the disk is locked again. The maths is real (see lib/keysplit.ts).
 *
 * The loop is a small phase machine. CSS does the per-cell transitions (cheap for 768 rects: one
 * `data-phase` attribute flips and each cell's own delay does the rest); Motion animates the status
 * lozenge (LazyMotion + `m`, so only the animation features ship). It pauses when off-screen or the tab is hidden, has a pause button (an auto-playing loop
 * longer than 5 s must be pausable), and under reduced motion it renders the assembled key, still.
 *
 * The server render shows the assembled key, so the hero is complete before (and without) JS; the
 * first thing the live loop does is wipe it — a deliberate move rather than a hydration flash.
 */
import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useInView,
  useReducedMotion,
} from 'motion/react'
import { Lock, Pause, Play } from 'lucide-react'
import DecryptedText from '../reactbits/DecryptedText/DecryptedText'
import { GRID, KEY, SHARE_A, SHARE_B } from '../../lib/keysplit'
import type { Copy } from '../../content/types'
import type { Tone } from '../../lib/tone'
import s from './KeySplit.module.css'

type Phase = 'open' | 'wiped' | 'locked' | 'approve' | 'assembled'

const NEXT: Record<Phase, Phase> = {
  open: 'wiped',
  wiped: 'locked',
  locked: 'approve',
  approve: 'assembled',
  assembled: 'open',
}

/** How long each phase holds, in ms. One loop ≈ 8 s. */
const HOLD: Record<Phase, number> = {
  open: 2600,
  wiped: 1200,
  locked: 1300,
  approve: 1500,
  assembled: 1300,
}

const TONE: Record<Phase, Tone> = {
  open: 'ok',
  wiped: 'secondary',
  locked: 'secondary',
  approve: 'attn',
  assembled: 'info',
}

const STATUS_KEY: Record<Phase, keyof Copy['hero']['visual']['states']> = {
  open: 'open',
  wiped: 'wiped',
  locked: 'locked',
  approve: 'approve',
  assembled: 'assembled',
}

/** The XOR scan crosses the grid in this long; key cells resolve in step with it. */
const SCAN_MS = 900
const CELL_GAP = 0.12

function ShareGrid({ bits }: { bits: boolean[] }) {
  return (
    <svg viewBox={`0 0 ${GRID} ${GRID}`} className={s.svg} aria-hidden="true" focusable="false">
      {bits.map((on, i) => (
        <rect
          key={i}
          x={(i % GRID) + CELL_GAP / 2}
          y={Math.floor(i / GRID) + CELL_GAP / 2}
          width={1 - CELL_GAP}
          height={1 - CELL_GAP}
          className={on ? s.on : s.off}
        />
      ))}
    </svg>
  )
}

function KeyGrid() {
  return (
    <svg viewBox={`0 0 ${GRID} ${GRID}`} className={s.svg} aria-hidden="true" focusable="false">
      {KEY.map((cell, i) => (
        <rect
          key={i}
          x={cell.col + CELL_GAP / 2}
          y={cell.row + CELL_GAP / 2}
          width={1 - CELL_GAP}
          height={1 - CELL_GAP}
          className={cell.inside ? s.key : s.off}
          fill={cell.inside ? cell.fill : undefined}
          style={
            cell.inside
              ? ({
                  '--d': `${Math.round((cell.col * SCAN_MS) / GRID)}ms`,
                  '--w': `${Math.round(cell.wipe * 700)}ms`,
                } as React.CSSProperties)
              : undefined
          }
        />
      ))}
    </svg>
  )
}

export default function KeySplit({ copy }: { copy: Copy['hero']['visual'] }) {
  const rootRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(rootRef, { amount: 0.25 })
  const [phase, setPhase] = useState<Phase>('open')
  const [paused, setPaused] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const running = !reduce && !paused && inView && !tabHidden

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setPhase((p) => NEXT[p]), HOLD[phase])
    return () => window.clearTimeout(timer)
  }, [running, phase])

  // Reduced motion: hold the explanatory end state.
  const shown: Phase = reduce ? 'open' : phase
  const status = copy.states[STATUS_KEY[shown]]

  return (
    <LazyMotion features={domAnimation} strict>
      <figure ref={rootRef} className={s.root} data-phase={shown}>
        <div className={s.panel}>
          <div className={s.head}>
            <span className="label">{copy.title}</span>
            {/* Always rendered (the server can't know the motion preference, so leaving it out on
              the client would break hydration); CSS hides it under reduced motion. */}
            <button
              type="button"
              className={s.toggle}
              onClick={() => setPaused((v) => !v)}
              aria-label={paused ? copy.play : copy.pause}
              title={paused ? copy.play : copy.pause}
            >
              {paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
            </button>
          </div>

          {/* A two-row grid: the three frames and the operators on row 1 (so ⊕ and = centre on
            the grids at any width), the labels on row 2. */}
          <div className={s.equation} aria-hidden="true">
            <div className={`${s.frame} ${s.frameA}`}>
              <ShareGrid bits={SHARE_A} />
              <span className={s.scan} />
            </div>
            <span className={`${s.op} ${s.xor}`}>⊕</span>
            <div className={`${s.frame} ${s.frameB}`}>
              <ShareGrid bits={SHARE_B} />
              <span className={s.scan} />
              <span className={s.tap} />
            </div>
            <span className={`${s.op} ${s.eq}`}>=</span>
            <div className={`${s.frame} ${s.frameK}`}>
              <KeyGrid />
              <span className={s.scan} />
              <Lock className={s.lock} size={22} strokeWidth={1.6} aria-hidden />
            </div>

            <div className={`${s.legend} ${s.legendA}`}>
              <div className={s.name}>{copy.shareA}</div>
              <div className={s.where}>{copy.shareAWhere}</div>
            </div>
            <div className={`${s.legend} ${s.legendB}`}>
              <div className={s.name}>{copy.shareB}</div>
              <div className={s.where}>{copy.shareBWhere}</div>
            </div>
            <div className={`${s.legend} ${s.legendK}`}>
              <div className={s.name}>
                {/* React Bits DecryptedText: the key's name is legible only while the key
                    exists — it decrypts as the scan assembles it and scrambles when it's wiped. */}
                <DecryptedText
                  text={copy.key}
                  animateOn="manual"
                  revealed={shown === 'assembled' || shown === 'open'}
                  sequential
                  speed={35}
                  characters="0123456789ABCDEF"
                  scrambleColor="var(--dim)"
                />
              </div>
              <div className={s.where}>{copy.keyWhere}</div>
            </div>
          </div>

          <div className={s.status} aria-hidden="true">
            <AnimatePresence mode="wait" initial={false}>
              <m.span
                key={shown}
                className="lozenge"
                data-tone={TONE[shown]}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {status}
              </m.span>
            </AnimatePresence>
          </div>
        </div>
        <figcaption className={s.caption}>{copy.caption}</figcaption>
        <p className="visually-hidden">{copy.description}</p>
      </figure>
    </LazyMotion>
  )
}
