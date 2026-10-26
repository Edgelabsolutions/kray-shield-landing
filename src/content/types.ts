/**
 * The shape of the page copy. `en.ts` and `uk.ts` both satisfy it, so a key added in one language
 * and forgotten in the other is a type error.
 *
 * COPY RULES (they protect the brand as much as the reader):
 *  - Every claim must be true of the shipped code. See README "Claims we make" for the list of
 *    wordings that were checked against the repos, and the ones that must never appear.
 *  - Only Kray and only Kray Shield. No other company, no other Kray product, no prices.
 *  - Short, plain and specific. A title, one lead, then facts.
 */
import type { Tone } from '../lib/tone'

export interface Spec {
  value: string
  label: string
}

export interface Step {
  title: string
  body: string
  points: string[]
}

export interface MatrixRow {
  what: string
  holds: string
  gets: string
  verdict: string
  tone: Tone
}

export interface Principle {
  title: string
  body: string
}

export interface UseCase {
  icon: UseCaseIcon
  title: string
  body: string
}

export type UseCaseIcon =
  | 'recon'
  | 'factory'
  | 'swarm'
  | 'phone-off'
  | 'signal-off'
  | 'robot'
  | 'power'
  | 'siren'
  | 'map'
  | 'chip'
  | 'clock'
  | 'lock'

export interface Fact {
  title: string
  body: string
}

export interface Faq {
  q: string
  a: string
}

export interface Copy {
  meta: { title: string; description: string }
  nav: {
    how: string
    security: string
    useCases: string
    field: string
    console: string
    faq: string
    contact: string
    menu: string
    close: string
    skip: string
    toLight: string
    toDark: string
    language: string
    home: string
    /** Landmark names for the navs. */
    primary: string
    mobile: string
    footer: string
  }
  hero: {
    title: string
    lead: string
    leadField: string
    ctaPrimary: string
    ctaSecondary: string
    specs: Spec[]
    visual: {
      title: string
      shareA: string
      shareAWhere: string
      shareB: string
      shareBWhere: string
      key: string
      keyWhere: string
      xor: string
      equals: string
      states: {
        locked: string
        approve: string
        assembled: string
        open: string
        wiped: string
      }
      pause: string
      play: string
      caption: string
      description: string
    }
  }
  statement: string
  how: {
    title: string
    lead: string
    steps: Step[]
    diagram: {
      label: string
      bench: string
      cloud: string
      console: string
      phone: string
      drone: string
      usb: string
      tls: string
      hotspot: string
      /** Short node and link labels, swapped in on narrow screens where the SVG is small. */
      short: {
        bench: string
        cloud: string
        console: string
        phone: string
        drone: string
        hotspot: string
      }
      shareA: string
      shareB: string
      lease: string
      key: string
      disk: string
    }
  }
  security: {
    title: string
    lead: string
    colWhat: string
    colHolds: string
    colGets: string
    rows: MatrixRow[]
    residualTitle: string
    residual: string
    principlesTitle: string
    principles: Principle[]
  }
  useCases: {
    title: string
    lead: string
    defence: string
    civil: string
    defenceCases: UseCase[]
    civilCases: UseCase[]
    alsoFits: string
  }
  field: {
    title: string
    lead: string
    facts: Fact[]
    phone: {
      label: string
      org: string
      orgName: string
      fleet: string
      leaseTitle: string
      leaseLeft: string
      synced: string
      hotspot: string
      waiting: string
      awaiting: string
      confirmWithin: string
      confirm: string
      sending: string
      unlocked: string
      timedOut: string
      present: string
      unlockedCount: string
      inFleet: string
      replay: string
      note: string
      storage: string
    }
  }
  console: {
    title: string
    lead: string
    points: Fact[]
    mock: {
      label: string
      nav: string[]
      fleet: string
      fleetSub: string
      colDevice: string
      colStatus: string
      colBoot: string
      statuses: { encrypted: string; unlocked: string; registered: string; revoked: string }
      never: string
      ago: { m2: string; m14: string; h1: string; h3: string; d1: string }
      auditTitle: string
      events: { unlock: string; lease: string; signed: string; revoked: string }
    }
  }
  faq: { title: string; items: Faq[] }
  contact: {
    /** The whole heading, as one sentence (used where the typed effect can't run). */
    title: string
    /** The heading before the typed word, and the words typed in turn (the last one stays). */
    titlePre: string
    titleTyped: string[]
    lead: string
    cta: string
    note: string
  }
  footer: {
    tagline: string
    rights: string
    privacy: string
    licences: string
  }
}
