# React Bits components (adapted)

Three components from [React Bits](https://reactbits.dev/) by David Haz, adapted for the Kray
Shield landing page. Everything in this folder is either React Bits code (adapted) or a small
helper written for it (`shared/`).

| Component | What it does | Runtime deps | Added JS (min / gzip) |
|---|---|---|---|
| [`DecryptedText`](DecryptedText/DecryptedText.tsx) | Glyphs cycle through random characters, then settle on the real text (and can scramble back). | none | 9.6 KB / 4.3 KB |
| [`TextType`](TextType/TextType.tsx) | Typewriter: types, pauses, deletes and moves on, with a blinking cursor that glides to the caret. | `gsap` (core only) | 6.7 KB / 3.2 KB, +0.65 KB CSS |
| [`PixelTransition`](PixelTransition/PixelTransition.tsx) | A pixel dissolve that covers a card, swaps the content underneath and clears; by default in ММ-14 camo. | none | 7.7 KB / 3.8 KB, +0.6 KB CSS |

Sizes are each component's own code, with React and GSAP left out. `gsap` is already on the page
(`src/scripts/motion.ts`), so TextType adds no new package.

## Provenance

- Source: <https://github.com/DavidHDev/react-bits> (`main` @ `e12c221`, 2026-10-19), taken from the
  live shadcn/jsrepo registry on 2026-10-24: `https://reactbits.dev/r/<Name>-TS-CSS.json`. That is
  the **TypeScript + plain CSS** variant; the other variants are `-JS-CSS`, `-JS-TW` and `-TS-TW`.
- Upstream pages: [DecryptedText](https://reactbits.dev/text-animations/decrypted-text) ·
  [TextType](https://reactbits.dev/text-animations/text-type) ·
  [PixelTransition](https://reactbits.dev/animations/pixel-transition).
- Each file starts with a `/*! … */` credit (source URL and licence line). Every change from upstream
  is listed in the doc comment under it, as "Kray changes".

## Licence

React Bits is **MIT + Commons Clause** (text copied verbatim below from
<https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md>, 2026-10-24).

In plain terms, for this site:

- **Allowed:** using, changing and shipping these components in a commercial company's marketing
  website, free of charge.
- **Not allowed:** selling, sublicensing or redistributing the components *themselves*, alone or
  bundled (for example, publishing this folder as a UI kit or an npm package).
- **Attribution:** keep the copyright and permission notice with copies. The source files carry it
  and this README holds the full text. Vite 8 strips `/*! */` comments from minified production
  JS by default, so the shipped bundle won't carry the notice unless
  `vite.build.rolldownOptions.output.comments.legal` is set to `true`. (That was checked against
  Vite 8.3.5 directly. Passing it through `astro.config.mjs` was not tested.) The other option is a
  third-party notices file.

```text
MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Adaptation rules (apply them to anything added here)

1. **Keep the algorithm and the credit.** Each file keeps upstream's maths and state machine, plus a
   `/*! */` header with the source URL and licence line. List every change in the file's doc
   comment.
2. **TypeScript strict-clean.** No `any`. Types come from `react`, not the global `React`
   namespace.
3. **SSR-safe.** No `window`, `document` or canvas access during render, only in effects and
   handlers. Server and client markup must match. None of these needs `client:only`.
4. **Reduced motion means the final, static, legible state** with no loops. Use
   `usePrefersReducedMotion()` (render) or `prefersReducedMotion()` (effects and handlers) from
   [`shared/reducedMotion.ts`](shared/reducedMotion.ts), not Motion's `useReducedMotion`. In
   motion 14.6 that hook is `null` on the server and never updates, so branching on it can break
   hydration.
5. **Accessibility.** If an effect garbles text, the real text is exposed once (visually hidden) and
   the animated glyphs are `aria-hidden`. Anything clickable is also keyboard-operable with the
   right role and state.
6. **Theme tokens, not colours.** Colours follow `tokens.css`, either as defaults like
   `var(--dim)` or `var(--accent)` or as props that accept any CSS colour, including `var(…)`.
   Never use Tailwind classes. Class names are prefixed `rb-`.
7. **Cost.** Pause loops while off-screen (IntersectionObserver). Clean up rAF, timers, observers
   and GSAP tweens on unmount. Effects must survive StrictMode's double mount.

## The components

### DecryptedText

`animateOn`: `'view' | 'hover' | 'inViewHover' | 'click' | 'manual'`. The Kray addition is
`manual`: `revealed` decrypts (`true`) or scrambles back (`false`), and `onComplete(revealed)` fires
when a run settles. Click mode is keyboard-operable (`role="button"`, Enter/Space, `aria-pressed`
in toggle mode). `scrambleColor` defaults to `var(--dim)`.

```tsx
// In the KeySplit island: the key's label is readable only while the key exists.
<DecryptedText
  text={copy.key}
  animateOn="manual"
  revealed={shown === 'assembled' || shown === 'open'}
  sequential
  speed={35}
  characters="0123456789ABCDEF"
/>
```

It renders three nested spans per character, so keep it to short labels, not paragraphs.

### TextType

The homage to kray.in.ua's hero, which uses typed.js with `[Efficiency|Reliability|Security]`,
`typeSpeed 60`, `backSpeed 30`, `startDelay 1000` and `backDelay 2000`. Kray additions:
`paused`, `srText`, and `reducedMotionIndex`, the sentence reduced motion shows (by default the last
one when `loop={false}`). It also pauses while off-screen.

```astro
[<TextType client:visible as="span" text={['Efficiency', 'Reliability', 'Security']}
  loop={false} typingSpeed={60} deletingSpeed={30} initialDelay={1000} pauseDuration={2000}
  startOnVisible srText="Security" cursorColor="currentColor" />]
```

The Ukrainian strings are `['Ефективність', 'Надійність', 'Безпека']`. On the inverted contact band,
pass `cursorColor="currentColor"` or `var(--accent-deep)`, because `--accent` on `--invert-bg` is
low-contrast.

### PixelTransition

Kray additions:

- `pixelColors`: defaults to the camo tokens `--camo-1…6`. `pixelColor` on its own gives upstream's
  single colour plus `mosaic`.
- `trigger="none"`: purely controlled through `active`, with no tab stop or role.
- `ariaLabel` and `aria-pressed` for `trigger="click"`.
- `aspectRatio="auto"`: the card is as tall as the taller face, so there's no layout shift.

```tsx
// Defence / Civil toggle: the toggle owns the state and the panel just dissolves.
<PixelTransition
  trigger="none"
  active={mode === 'civil'}
  aspectRatio="auto"
  gridSize={14}
  pattern="dither"
  animationStepDuration={0.3}
  firstContent={<UseCases mode="defence" />}
  secondContent={<UseCases mode="civil" />}
/>
```

## Checks

These files are covered by `npm run check` (`astro check`), `npm run lint` (oxlint) and Prettier,
like the rest of `src/`. They were also tested in headless Chrome, server-rendered and then
hydrated, with and without StrictMode and reduced motion. Those tests covered decrypt and scramble
runs, keyboard operation, off-screen pausing, the camo colours resolving from tokens, no rAF or
timers left running once settled, and no hydration warnings.
