/**
 * Site-relative URLs. The site may be served from a sub-path (a GitHub project page lives at
 * `/<repo>/`), so every internal link goes through `withBase` instead of starting with `/`.
 * `BASE` always ends in a slash: `/` locally, `/kray-shield-landing/` on GitHub Pages.
 */
const raw = import.meta.env.BASE_URL
export const BASE = raw.endsWith('/') ? raw : `${raw}/`

/** `withBase('uk/')` → `/kray-shield-landing/uk/` (or `/uk/` at the root). */
export function withBase(path = ''): string {
  return BASE + path.replace(/^\/+/, '')
}
