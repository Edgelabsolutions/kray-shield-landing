// @ts-check
import { defineConfig, fontProviders } from 'astro/config'

import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

/*
 * The public origin, used for canonical/hreflang URLs, Open Graph and the sitemap. Set it at build
 * time (`SITE_URL=https://… npm run build`); without it the page uses relative URLs and no sitemap
 * is generated.
 */
const site = process.env.SITE_URL || undefined

/*
 * The path the site is served from. `/` locally and on a custom domain; `/<repo>` on a GitHub
 * project page (the Pages workflow passes it in). Internal links go through src/lib/url.ts.
 */
const base = process.env.BASE_PATH || '/'

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site,
  base,
  i18n: {
    locales: ['en', 'uk'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    build: {
      /*
       * Third-party licences. Vite writes every bundled npm dependency's licence to this file, and
       * `comments.legal` keeps `/*! … *\/` notices (GSAP's, and the React Bits credit headers) in
       * the minified JS, which Vite 8 would otherwise strip. React Bits is vendored source, not an
       * npm dependency, so its full notice ships separately as public/licenses/react-bits.txt;
       * public/licenses/index.html links both.
       */
      license: { fileName: 'licenses/third-party.txt' },
      rolldownOptions: { output: { comments: { legal: true } } },
    },
  },
  integrations: [
    react(),
    ...(site ? [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', uk: 'uk' } } })] : []),
  ],
  /*
   * Fonts are downloaded at build time and self-hosted (no third-party request at runtime).
   * Chakra Petch — the portal's display face — has no Cyrillic, so Exo 2 — the face the operator
   * app uses for its Ukrainian — is loaded for the Cyrillic ranges only and fills in glyph by glyph
   * on the Ukrainian page (see tokens.css).
   */
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Chakra Petch',
      cssVariable: '--font-chakra',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: [],
    },
    {
      provider: fontProviders.google(),
      name: 'Exo 2',
      cssVariable: '--font-exo',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['cyrillic', 'cyrillic-ext'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains',
      weights: [400, 500, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext', 'cyrillic'],
      fallbacks: ['monospace'],
    },
  ],
})
