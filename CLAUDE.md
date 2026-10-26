# CLAUDE.md — Kray Shield landing

Public marketing page for Kray Shield (Astro 7 + React 19 islands, plain CSS, GSAP/Lenis/Motion).
`README.md` has the stack, commands, design system, motion map and the **claims register** — read
it before changing copy or styling.

## Rules that must hold

- **No Tailwind.** Styling is plain CSS on the tokens in `src/styles/tokens.css` (the portal's
  palette and names). Component styles: Astro scoped `<style>` or `*.module.css` for islands.
- **Only Kray, only Kray Shield.** No ESL / Edgelab, no other company, no other Kray product, no
  prices. The portal's ESL-specific role is "platform administrator" here.
- **Every claim must be true of the shipped code** — check the claims register in `README.md`, and
  the "must NOT make" list. When unsure, ask or leave it out.
- **Every user-facing string lives in `src/content/{en,uk}.ts`.** Both languages ship together;
  `types.ts` keeps them in lockstep. Keep copy short and plain. Ukrainian follows the product's
  vocabulary (підрозділ, оренда ключа, частка, стенд).
- **Tones by meaning** (`accent`, `ok`, `attn`, `err`, `info`, `org`, `secondary`). Atoms read
  `var(--tone, default)`; never set `--tone` inside an atom's own rule.
- **Motion is earned**: one hero moment, one scroll story, responses to clicks. Everything honours
  `prefers-reduced-motion`. Anything auto-playing longer than 5 s must be pausable.
- **Islands must render the same HTML on the server and client** — never branch markup on
  `useReducedMotion()` or `window`; hide with CSS instead (React error #418 otherwise).
- Works from 320 px with no horizontal scroll, in both themes and both languages.
- **Internal links go through `withBase()`** (`src/lib/url.ts`) — the site is served from
  `/kray-shield-landing/` on GitHub Pages, so a link starting with `/` breaks there.
- **React Bits** (`src/components/reactbits/`) is MIT + Commons Clause: use it on the site, never
  publish or sell that folder. A new component must follow the adaptation rules in its README
  (TS + plain-CSS variant, credit header, SSR-safe, reduced motion, `rb-` classes) and earn its
  place — no decoration for its own sake. Keep the licence outputs working (`dist/licenses/`).

## Checks before calling a change done

```bash
nvm use && npm run check && npm run lint && npm run build
```

Then look at it: `npm run preview` and check EN/UA × dark/light at 1440 px and 390 px.

## Deploy

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`, repo
`Edgelabsolutions/kray-shield-landing`). README → Deploying has the setup.

## Don't

- Don't commit, push or deploy unless asked.
- Don't add a dependency for something a few lines of CSS can do.
