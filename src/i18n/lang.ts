/**
 * Languages. English is the default and lives at `/`; Ukrainian lives at `/uk/` (BCP 47 `uk`). The
 * switch is labelled EN / UA, as in the portal and on kray.in.ua.
 */
import { withBase } from '../lib/url'

export const LANGS = ['en', 'uk'] as const
export type Lang = (typeof LANGS)[number]

export const DEFAULT_LANG: Lang = 'en'

/** The language toggle's labels. */
export const LANG_LABEL: Record<Lang, string> = { en: 'EN', uk: 'UA' }

/** Open Graph locale per language. */
export const OG_LOCALE: Record<Lang, string> = { en: 'en_US', uk: 'uk_UA' }

/** The page path for a language, with the base path and a trailing slash. */
export function pathFor(lang: Lang): string {
  return withBase(lang === DEFAULT_LANG ? '' : `${lang}/`)
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'uk' : 'en'
}
