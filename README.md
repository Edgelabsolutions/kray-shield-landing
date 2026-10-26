# Kray Shield landing page

The public marketing page for **Kray Shield**: disk encryption and split-key unlock for drone fleets
and other CM5-based edge devices, for defence and civil customers. English at `/`, Ukrainian at
`/uk/`, dark (default) and light themes.

## Stack

| | |
|---|---|
| Framework | [Astro](https://astro.build) 7 (static output) with React 19 islands (`@astrojs/react`) |
| Styling | Plain CSS with custom properties — **no Tailwind** (owner's decision). Tokens ported from `kray-portal` |
| Motion | [GSAP](https://gsap.com) 3.15 + ScrollTrigger, [Lenis](https://lenis.darkroom.engineering) 1.3 (smooth scroll), [Motion](https://motion.dev) 14 (`motion/react`, via `LazyMotion`), and three components adapted from [React Bits](https://reactbits.dev) (vendored in `src/components/reactbits/`) |
| Icons | `lucide-react` (rendered statically in `.astro` files, so they cost no JS there) |
| Fonts | Chakra Petch (display, Latin), Exo 2 (Cyrillic fallback, the operator app's face), JetBrains Mono — self-hosted by Astro's Fonts API |
| Tooling | TypeScript (strict), `astro check`, oxlint, Prettier |

## Commands

Node **24** (`.nvmrc`; Astro 7.4 needs ≥ 22.23.4). From this folder:

```bash
nvm use               # Node 24
npm ci
npm run dev           # http://localhost:4321
npm run build         # static site in dist/
npm run preview       # serve dist/ locally
npm run check         # astro check: types in .astro, .ts and .tsx
npm run lint          # oxlint
npm run format        # Prettier
```

Set the public origin at build time so canonical, hreflang and Open Graph URLs are absolute and a
sitemap is generated:

```bash
SITE_URL=https://example.kray.in.ua npm run build
```

Without `SITE_URL` the page uses relative URLs and skips the sitemap. To serve the site from a
sub-path (a GitHub project page), also set `BASE_PATH`, e.g. `BASE_PATH=/kray-shield-landing`.
Internal links must go through `withBase()` (`src/lib/url.ts`), never start with `/`.

## Layout

```
src/
  pages/            index.astro (EN), uk/index.astro (UA), 404.astro
  components/
    Landing.astro   the page, composed from the sections below
    Header.astro    sticky nav, language + theme switches (vanilla script, no React)
    Footer.astro
    SectionIntro.astro
    sections/       Hero, Statement, HowItWorks (+ HowDiagram), Security, UseCasesSection,
                    Field, Console, Faq, Contact
    islands/        React islands: KeySplit (hero), UseCases (Defence/Civil), PhoneDemo
    reactbits/      DecryptedText, PixelTransition, TextType — adapted from React Bits (see its README)
    brand/          CamoShield (the portal's pixel-camo mark), KrayWordmark
  content/          types.ts (the copy's shape), en.ts, uk.ts — ALL user-facing text lives here
  styles/           tokens.css, base.css, atoms.css
  scripts/motion.ts Lenis + GSAP ScrollTrigger bootstrap and page-level scroll effects
  lib/              camo.ts (mark geometry), keysplit.ts (the hero's real XOR maths), tone.ts
  config/site.ts    contact links (Signal), company and privacy URLs
```

## Design system

The landing reuses the admin console's design system so the two read as one product
(`kray-portal/src/index.css`, `.claude/skills/style-tactical-ui`):

- **Tokens** (`src/styles/tokens.css`): the portal's names and values, dark on `:root`, light on
  `:root[data-theme='light']`. Never hard-code a colour that must change with the theme.
- **Tones by meaning, not hue**: `accent` brand/primary action · `ok` healthy/done · `attn` needs a
  human or mid-flight · `err` fault/terminal · `info` informational · `org` tenant label ·
  `secondary` routine. Set `data-tone="…"` on an element; atoms read `var(--tone, default)`.
- **Atoms** (`src/styles/atoms.css`): `.card`, `.label`, `.lozenge`, `.chip`, `.stat__*`, `.meter`,
  `.btn` + `--primary/--secondary/--ghost/--lg` — the portal's `ui.tsx`/`Button.tsx` as CSS classes,
  usable from Astro and React alike.
- **Type**: display Chakra Petch (Exo 2 fills in Cyrillic glyph by glyph), mono JetBrains Mono for
  labels, ids and statuses. Uppercase mono only for real product statuses (lozenges).
- **Brand mark**: the seeded ММ-14 pixel-camo shield, identical to the portal's. The Kray wordmark
  comes from kray.in.ua and is recoloured to `currentColor`.
- **Layout**: works from 320 px with no sideways scroll; containers are `.container` with a
  `--gutter`; sections are `.section`.

## Motion

One orchestrated moment and a few responses, not decoration everywhere:

| Where | Library | What |
|---|---|---|
| Whole page | Lenis (driven by GSAP's ticker) | Smooth scrolling and anchor links |
| Hero | Motion + CSS + React Bits `DecryptedText` | `KeySplit`: Share A ⊕ Share B scan into the key (the camo shield), then it's wiped; the key's label decrypts with it and scrambles when it's wiped. Pauses off-screen, has a pause button |
| Statement | GSAP ScrollTrigger | Words brighten as the sentence scrolls through (`[data-scrub-words]`) |
| How it works | GSAP ScrollTrigger + timelines | Steps activate on scroll; Share B travels drone → bench → cloud → phone → drone on the sticky diagram; a rail scrubs |
| Use cases | React Bits `PixelTransition` | Defence / Civil tabs; switching covers the grid in ММ-14 camo pixels and swaps the panel |
| In the field | Motion | Interactive operator-app demo (Confirm key share → Sending Share B… → Unlocked · booted) |
| FAQ | CSS | `::details-content` + `interpolate-size` where supported |
| Contact | React Bits `TextType` (GSAP) | The bracketed audience word types once — unit, crew, fleet — a nod to kray.in.ua's hero |

`prefers-reduced-motion` is honoured everywhere: Lenis disables smoothing, GSAP effects are
registered under `gsap.matchMedia()`, the islands render their end state, and `base.css` zeroes CSS
transitions as a safety net.

## Copy and claims

All text is in `src/content/en.ts` and `src/content/uk.ts`; `types.ts` makes the two languages
structurally identical. Rules:

- **Only Kray, only Kray Shield.** Never mention ESL / Edgelab or any other company, nor any other
  Kray product. No prices anywhere.
- **Every claim must be true of the shipped code.** The table below lists what the page says and
  where it comes from. Check it before changing a claim; when the product changes, update both.
- Sample data in the mock-ups (DRN-07, org "Alpha", fleet "North") is invented; never use real
  device ids, organisation or people's names.

### Claims the page makes (verified against the repos, 2026-10-24)

| Claim (as worded on the page) | Source |
|---|---|
| Full-disk encryption, LUKS2, AES-256 | `kray-shield-docs` DOC-00, DOC-08 (`aes-xts-plain64`) |
| 2-of-2 key split, 256-bit shares, per device; either half alone is noise | DOC-00 "Crypto Dependency Summary"; `kray-boot/src/boot/luks_key.cpp` |
| Keys are generated inside each module; nothing on the bench or in the cloud | DOC-08 provisioning stages; DOC-06 |
| Storage bound to its chip (sealed under the chip's OTP key + storage CID) | `kray-boot/src/crypto/kray_seal.h` |
| Boots only signed firmware (RSA-2048 secure boot) | DOC-00; `kray-vault-service` `ImageSigner` |
| The cloud never sees an unlock key or a plaintext share; stores only wrapped Share B | DOC-00; `Device.java` (`share_b_wrapped`) |
| No role can view plaintext keys; console shows only "key enrolled" | DOC-01; `DeviceResponse.keyEnrolled` |
| Unlock needs no internet; the phone hotspot is the whole field setup | DOC-09; Android integration plan; kray-boot |
| One tap per drone unless batch approval is armed (biometric or screen lock, one session) | Android `MainActivity` (BiometricPrompt), `RealUnlockSessionRepository` |
| About 8–10 drones at once, depending on the phone | DOC-05; 10 concurrent verified on a real phone |
| Hotspot range typically 10–30 m in open ground | DOC-05 |
| Org lease 1–90 days, set by the platform administrator; renews on every sync | `SuperadminController` (lease policy), `OperatorLease.java` |
| Revocation reaches a phone at its next check-in; offline phones stop serving shares when the lease ends | `RealVaultRepository`, `RealLeaseManager` (code wins over the docs' "~60 s") |
| Every boot request carries a fresh nonce; sessions single-use (replay rejected) | `kray-boot/src/boot/boot_nonce.cpp`; `SqlCipherNonceCache` |
| Phone app: screenshots blocked, no backups, encrypted DB under hardware-backed keys, redacted diagnostic log | Android `FLAG_SECURE`, `allowBackup=false`, SQLCipher + Keystore, `LogRedactor` |
| TLS 1.3 to the cloud; mutual TLS for provisioning stations | Vault gateway TLS 1.3; `ProvisionerCertificateAuthenticationFilter` |
| Audit log of admin actions, bench operations, image signatures, lease changes and phone-reported unlocks; filters by time, type and person | `AuditEventType.java`; `AuditService` |
| Move up to 500 devices at once | `DeviceService.java` |
| Bench enrolment: single-use token valid 24 h, own certificate, revocable | `ProvisionerInstallService`; `application.yml` |
| Licence spent only when encryption is confirmed; re-flashing is free | `Device.java`; `DeviceRegistrationService` |
| Organisations kept separate; one operator can serve several with separate keys | `OperatorKeyService` (orgId per sync), schema FKs |
| Android 10+, English and Ukrainian, day and night themes, glove-size controls | Android `build.gradle.kts` (minSdk 29), `Dimens.kt` (56 dp) |
| Availability: "onboarding pilot partners" | Positioning; the product is pre-release (DOC-06 OD-39 blocks field release) |

### Claims the page must NOT make (untrue today)

Protection for a drone that is still powered (it's data at rest) · protection of autopilot /
flight-controller software or the boot partition (only the CM5's root storage is encrypted) ·
"revoke a phone" (revocation is per operator) · re-provisioning a revoked drone (revoked is
terminal) · the platform administrator seeing "aggregates only" (it sees org and fleet names) ·
per-operator lease shortening and the 30th audit event type (on `develop` only — add back after
the next Vault/portal release) · Instant or real-time revocation · tamper-proof / immutable / forensic audit log · air-gapped or
on-premises deployment · authenticated or rogue-AP-proof drone link (pinning is disabled) · clone
detection · the drone proving its identity to the phone · HSM / FIPS / any certification (SOC 2,
ISO…) · MFA · debug ports permanently disabled · OTA updates · iOS app · EU hosting / data
residency / SLA · "field-proven", "combat-proven", "in service" · EW or jamming resistance ·
keys "self-destruct offline" (the physical wipe happens at the next check-in) · any price.

## React Bits and licences

Three components come from [React Bits](https://reactbits.dev) (TypeScript + plain-CSS variants),
adapted to this project's rules — see `src/components/reactbits/README.md` for provenance, the
changes made and the adaptation rules to follow when adding more. React Bits is
**MIT + Commons Clause**: free to use in this site, but the components themselves may not be sold
or redistributed (don't publish that folder as a kit or package).

The build ships the required notices:

- `vite.build.license` writes every bundled npm package's licence to `dist/licenses/third-party.md`;
- `public/licenses/react-bits.txt` carries React Bits' full notice (it's vendored source, so Vite
  doesn't list it);
- `rolldownOptions.output.comments.legal` keeps `/*! … */` credits in the minified JS.

The footer links to the licence file.

## Deploying

The site deploys to **GitHub Pages** from `Edgelabsolutions/kray-shield-landing` with
`.github/workflows/deploy.yml`: every push to `main` runs `npm run check`, `npm run lint` and the
build, then publishes `dist/`. The workflow takes the origin and sub-path from
`actions/configure-pages` (`SITE_URL`, `BASE_PATH`), so the same build works on the default
`https://edgelabsolutions.github.io/kray-shield-landing/` address and on a custom domain.

One-time setup (a repo admin): Settings → Pages → Source: **GitHub Actions**. Pages needs either a
public repository or a paid GitHub plan (Team / Enterprise) for a private one. For a domain without
the organisation's name, add it under Settings → Pages → Custom domain; the build adapts on its own.

`npm run build` also produces a fully static `dist/` for any other static host.
