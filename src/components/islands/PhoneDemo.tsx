/**
 * An interactive stand-in for the operator app's field screen, built from the app's own strings and
 * states: a drone announces itself, the operator has about a minute to confirm, the share is sent,
 * the drone boots. Sample data only — no real organisation, fleet or device ids.
 *
 * The countdown is information, not decoration, so it ticks under reduced motion too (only while
 * the phone is on screen); the card transitions honour reduced motion via MotionConfig.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m, useInView } from 'motion/react'
import { ChevronDown, Drone, Loader2, RotateCcw, Wifi } from 'lucide-react'
import type { Copy } from '../../content/types'
import s from './PhoneDemo.module.css'

type State = 'awaiting' | 'sending' | 'unlocked' | 'timedOut'

/** The real operator window is about 60 s from announce. */
const WINDOW_S = 60

export default function PhoneDemo({ copy }: { copy: Copy['field']['phone'] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [state, setState] = useState<State>('awaiting')
  const [left, setLeft] = useState(WINDOW_S)
  const [run, setRun] = useState(0)

  // The confirm window counts down while the drone waits and the phone is visible.
  useEffect(() => {
    if (state !== 'awaiting' || !inView) return
    const id = window.setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          setState('timedOut')
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [state, inView, run])

  // Delivery takes a moment; then the drone reports it booted.
  useEffect(() => {
    if (state !== 'sending') return
    const id = window.setTimeout(() => setState('unlocked'), 1300)
    return () => window.clearTimeout(id)
  }, [state])

  const replay = () => {
    setState('awaiting')
    setLeft(WINDOW_S)
    setRun((r) => r + 1)
  }

  const unlockedCount = state === 'unlocked' ? 2 : 1
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
  const urgent = left <= 15

  const stateLabel: Record<State, string> = {
    awaiting: copy.awaiting,
    sending: copy.sending,
    unlocked: copy.unlocked,
    timedOut: copy.timedOut,
  }
  const stateTone: Record<State, string> = {
    awaiting: 'attn',
    sending: 'info',
    unlocked: 'ok',
    timedOut: 'err',
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className={s.wrap} ref={ref}>
          <figure className={s.phone} aria-label={copy.label}>
            <div className={s.screen}>
              <div className={s.statusbar} aria-hidden="true">
                <span>KRAY Shield</span>
                <Wifi size={12} strokeWidth={2} />
              </div>

              <div className={s.selectors} aria-hidden="true">
                <span className={s.select}>
                  <span className={s.selectKey}>{copy.org}</span> {copy.orgName}
                  <ChevronDown size={12} />
                </span>
                <span className={s.select}>
                  {copy.fleet}
                  <ChevronDown size={12} />
                </span>
              </div>

              <div className={s.lease}>
                <div className={s.leaseRow}>
                  <span className={s.leaseTitle}>{copy.leaseTitle}</span>
                  <span className={s.leaseLeft}>{copy.leaseLeft}</span>
                </div>
                <div
                  className="meter"
                  data-tone="ok"
                  style={{ '--pct': '74%' } as React.CSSProperties}
                >
                  <span />
                </div>
                <div className={s.leaseSub}>{copy.synced}</div>
              </div>

              <div className={s.hotspot}>
                <span className={s.dot} aria-hidden="true" />
                {copy.hotspot}
              </div>

              <div className={s.counters} aria-hidden="true">
                <span>
                  {copy.present} <b>2</b>
                </span>
                <span>
                  {copy.unlockedCount} <b>{unlockedCount}</b>
                </span>
                <span>
                  {copy.inFleet} <b>12</b>
                </span>
              </div>

              <div className={s.cards}>
                <article className={s.card} data-state={state}>
                  <div className={s.cardHead}>
                    <Drone size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span className={s.deviceId}>DRN-07</span>
                    <AnimatePresence mode="wait" initial={false}>
                      <m.span
                        key={state}
                        className="lozenge"
                        data-tone={stateTone[state]}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.16 }}
                      >
                        {stateLabel[state]}
                      </m.span>
                    </AnimatePresence>
                  </div>
                  <div className={s.storage}>{copy.storage} · emmc 3f9a…c21e</div>

                  <AnimatePresence initial={false}>
                    {state === 'awaiting' && (
                      <m.div
                        key="confirm"
                        className={s.confirmBlock}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <div className={s.countdown} data-urgent={urgent || undefined}>
                          {copy.confirmWithin} <b>{mmss}</b>
                        </div>
                        <button
                          type="button"
                          className={`btn btn--primary ${s.confirm}`}
                          onClick={() => setState('sending')}
                        >
                          {copy.confirm}
                        </button>
                      </m.div>
                    )}
                    {state === 'sending' && (
                      <m.div
                        key="sending"
                        className={s.sending}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 size={16} className={s.spin} aria-hidden="true" />
                        {copy.sending}
                      </m.div>
                    )}
                  </AnimatePresence>
                </article>

                <article className={`${s.card} ${s.cardDone}`}>
                  <div className={s.cardHead}>
                    <Drone size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span className={s.deviceId}>DRN-04</span>
                    <span className="lozenge" data-tone="ok">
                      {copy.unlocked}
                    </span>
                  </div>
                  <div className={s.storage}>{copy.storage} · emmc 81d2…07b4</div>
                </article>
              </div>
            </div>
          </figure>

          <div className={s.under}>
            <p className={s.note}>{copy.note}</p>
            {(state === 'unlocked' || state === 'timedOut') && (
              <button type="button" className="btn btn--ghost" onClick={replay}>
                <RotateCcw size={14} aria-hidden="true" />
                {copy.replay}
              </button>
            )}
          </div>

          <p className="visually-hidden" aria-live="polite">
            {state === 'awaiting' ? '' : stateLabel[state]}
          </p>
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
