/**
 * The dual-use switch: one platform, Defence or Civil. A WAI-ARIA tabs widget (arrow keys, Home,
 * End; automatic activation) whose two tabpanels are the faces of a React Bits PixelTransition:
 * switching sides covers the grid in ММ-14 camo pixels, swaps the panel underneath and clears —
 * the brand's pixel motif, spent on a change the visitor asked for.
 *
 * Both panels are in the HTML (crawlers and no-JS readers get every use case). PixelTransition
 * hides the inactive face with `visibility: hidden`, which also takes it out of the accessibility
 * tree and the tab order, so the panels carry no `hidden` attribute of their own. The card is as
 * tall as the taller panel (`aspectRatio="auto"`), so switching never shifts the page. Reduced
 * motion swaps in a single frame. The selection pill slides on a CSS transform.
 */
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
  Bot,
  Clock,
  Cpu,
  Drone,
  Factory,
  Lock,
  MapPinned,
  PhoneOff,
  Radar,
  Siren,
  UtilityPole,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import PixelTransition from '../reactbits/PixelTransition/PixelTransition'
import type { Copy, UseCase, UseCaseIcon } from '../../content/types'
import s from './UseCases.module.css'

const ICONS: Record<UseCaseIcon, LucideIcon> = {
  recon: Radar,
  factory: Factory,
  swarm: Drone,
  'phone-off': PhoneOff,
  'signal-off': WifiOff,
  robot: Bot,
  power: UtilityPole,
  siren: Siren,
  map: MapPinned,
  chip: Cpu,
  clock: Clock,
  lock: Lock,
}

type Side = 'defence' | 'civil'
const SIDES: Side[] = ['defence', 'civil']

function Grid({ cases }: { cases: UseCase[] }) {
  return (
    <ul className={s.grid}>
      {cases.map((c) => {
        const Icon = ICONS[c.icon]
        return (
          <li key={c.title} className={s.cell}>
            <span className={s.icon} aria-hidden="true">
              <Icon size={20} strokeWidth={1.6} />
            </span>
            <h3 className={s.cellTitle}>{c.title}</h3>
            <p className={s.cellBody}>{c.body}</p>
          </li>
        )
      })}
    </ul>
  )
}

export default function UseCases({ copy }: { copy: Copy['useCases'] }) {
  const [side, setSide] = useState<Side>('defence')
  const tabRefs = useRef<Record<Side, HTMLButtonElement | null>>({ defence: null, civil: null })
  const base = useId()
  const tabId = (x: Side) => `${base}-tab-${x}`
  const panelId = (x: Side) => `${base}-panel-${x}`

  const select = (next: Side, focus = false) => {
    setSide(next)
    if (focus) tabRefs.current[next]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = SIDES.indexOf(side)
    const go: Record<string, number> = {
      ArrowRight: (i + 1) % SIDES.length,
      ArrowLeft: (i - 1 + SIDES.length) % SIDES.length,
      Home: 0,
      End: SIDES.length - 1,
    }
    if (e.key in go) {
      e.preventDefault()
      select(SIDES[go[e.key]], true)
    }
  }

  const cases = { defence: copy.defenceCases, civil: copy.civilCases }
  const label = { defence: copy.defence, civil: copy.civil }

  const panel = (x: Side) => (
    <div id={panelId(x)} role="tabpanel" aria-labelledby={tabId(x)} tabIndex={0}>
      <Grid cases={cases[x]} />
    </div>
  )

  return (
    <div className={s.root}>
      <div
        className={s.tabs}
        role="tablist"
        aria-label={copy.title}
        style={{ '--i': SIDES.indexOf(side) } as CSSProperties}
      >
        <span className={s.indicator} aria-hidden="true" />
        {SIDES.map((x) => {
          const active = x === side
          return (
            <button
              key={x}
              ref={(el) => {
                tabRefs.current[x] = el
              }}
              id={tabId(x)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId(x)}
              tabIndex={active ? 0 : -1}
              className={s.tab}
              onClick={() => select(x)}
              onKeyDown={onKeyDown}
            >
              {label[x]}
            </button>
          )
        })}
      </div>

      <div className={s.stage}>
        <PixelTransition
          trigger="none"
          active={side === 'civil'}
          aspectRatio="auto"
          gridSize={18}
          pattern="dither"
          animationStepDuration={0.3}
          firstContent={panel('defence')}
          secondContent={panel('civil')}
        />
      </div>

      <p className={s.also}>
        <Cpu size={16} strokeWidth={1.6} aria-hidden="true" />
        <span>{copy.alsoFits}</span>
      </p>
    </div>
  )
}
