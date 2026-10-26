/**
 * The status tone vocabulary, split by MEANING, not hue (portal rule — see tokens.css):
 *   accent — brand / primary action · ok — healthy, done · attn — needs a human, mid-flight
 *   err — fault, terminal · info — informational · org — a tenant label · secondary — routine
 * Render with `data-tone={tone}` on an element that uses `--tone` (atoms.css).
 */
export type Tone = 'accent' | 'ok' | 'attn' | 'err' | 'info' | 'org' | 'secondary'

/** Device statuses as the console colours them (portal `DeviceStatus.tsx`). */
export const DEVICE_TONE = {
  registered: 'info',
  encrypted: 'ok',
  unlocked: 'attn',
  revoked: 'err',
} as const satisfies Record<string, Tone>
