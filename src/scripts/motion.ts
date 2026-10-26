/**
 * Page-level motion: Lenis smooth scrolling driven by GSAP's ticker, plus the few scroll-driven
 * behaviours that are opted into with data attributes. React islands animate themselves (Motion).
 *
 * Motion budget, on purpose: one orchestrated hero sequence (React), one pinned scroll story
 * (How it works), one scroll-scrubbed statement. No blanket fade-ups on every section.
 *
 * Reduced motion: Lenis honours `prefers-reduced-motion` itself (`respectReducedMotion`, default on),
 * and every GSAP effect below is registered inside `gsap.matchMedia()` under a no-preference
 * condition, so with reduced motion the page simply renders its final state.
 */
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const HEADER_OFFSET = 84

const lenis = new Lenis({
  lerp: 0.12,
  anchors: { offset: -HEADER_OFFSET },
  stopInertiaOnNavigate: true,
})
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)

// Expose for islands that need to scroll programmatically (e.g. a CTA inside React).
;(window as unknown as { __lenis?: Lenis }).__lenis = lenis

const mm = gsap.matchMedia()

mm.add('(prefers-reduced-motion: no-preference)', () => {
  /*
   * [data-scrub-words] — a statement whose words brighten as it scrolls through the viewport
   * (a nod to kray.in.ua). The words are split at build time (ScrubStatement.astro), so the text is
   * complete in the HTML and readable without JS.
   */
  gsap.utils.toArray<HTMLElement>('[data-scrub-words]').forEach((el) => {
    const words = el.querySelectorAll<HTMLElement>('[data-word]')
    gsap.fromTo(
      words,
      { opacity: 0.22 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
      },
    )
  })
})

// Fonts change line lengths, which moves every trigger: measure again once they are in.
document.fonts?.ready.then(() => ScrollTrigger.refresh())

export { gsap, ScrollTrigger, lenis, mm }
