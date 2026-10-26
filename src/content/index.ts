import type { Lang } from '../i18n/lang'
import type { Copy } from './types'
import { en } from './en'
import { uk } from './uk'

const COPY: Record<Lang, Copy> = { en, uk }

export function getCopy(lang: Lang): Copy {
  return COPY[lang]
}

export type { Copy } from './types'
