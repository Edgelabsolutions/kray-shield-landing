/**
 * The Kray Shield mark — a shield filled with ММ-14 "digital" pixel camouflage — and the pixel maths
 * the hero reuses. Ported from the portal's `components/CamoShield.tsx`, so the landing and the admin
 * console draw the identical mark.
 *
 * The grid comes from a SEEDED generator (the portal's constants), so it is deterministic: the mark
 * looks the same on every render, in both languages and in a screenshot diff.
 */

/** The shield outline, in a 24×24 viewBox. */
export const SHIELD_PATH =
  'M12 1.6l-8.4 3.1v7.1c0 6.5 8.4 10.6 8.4 10.6s8.4-4.1 8.4-10.6V4.7L12 1.6z'

/**
 * SHIELD_PATH as a polygon (the two Bézier sides sampled), for point-in-shield tests.
 * Path: top (12,1.6) → (3.6,4.7) → (3.6,11.8) → curve to the tip (12,22.4) → curve to (20.4,11.8)
 * → (20.4,4.7) → back to the top.
 */
export const SHIELD_POLYGON: ReadonlyArray<readonly [number, number]> = (() => {
  const cubic = (
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
    t: number,
  ): [number, number] => {
    const u = 1 - t
    const a = u * u * u
    const b = 3 * u * u * t
    const c = 3 * u * t * t
    const d = t * t * t
    return [
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ]
  }
  const points: Array<[number, number]> = [
    [12, 1.6],
    [3.6, 4.7],
  ]
  for (let i = 0; i <= 12; i++) {
    points.push(cubic([3.6, 11.8], [3.6, 18.3], [12, 22.4], [12, 22.4], i / 12))
  }
  for (let i = 1; i <= 12; i++) {
    points.push(cubic([12, 22.4], [12, 22.4], [20.4, 18.3], [20.4, 11.8], i / 12))
  }
  points.push([20.4, 4.7])
  return points
})()

/** ММ-14 pixel-camo palette — UA military greens, tan and brown. */
export const CAMO_PALETTE = ['#5A6B3E', '#3E4A2A', '#7C7F55', '#4A3B29', '#8A8A63', '#2F3822']
export const CAMO_BASE = '#4A5636'
export const CAMO_EDGE = '#2A2418'
export const CAMO_EDGE_GLOW = '#C9B47A'

/** Linear congruential generator — the mockup's constants. Returns floats in [0, 1). */
export function lcg(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

export interface CamoCell {
  x: number
  y: number
  fill: string
}

/** The mark's 8×8 grid in the 24×24 viewBox (seed 7, as in the portal). */
export function camoCells(grid = 8, seed = 7): CamoCell[] {
  const next = lcg(seed)
  const cell = 24 / grid
  const cells: CamoCell[] = []
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      cells.push({
        x: col * cell,
        y: row * cell,
        fill: CAMO_PALETTE[Math.floor(next() * CAMO_PALETTE.length)],
      })
    }
  }
  return cells
}
