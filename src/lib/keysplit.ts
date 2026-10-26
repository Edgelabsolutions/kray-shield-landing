/**
 * The maths behind the hero's "A ⊕ B = key" picture. It is real XOR secret sharing, drawn small:
 *
 *  - MASK is the Kray Shield silhouette on a 16×16 grid: the "secret" we want to show.
 *  - A is seeded random noise: Share A.
 *  - B = A XOR MASK: Share B. Because A is uniformly random, B is too, so each grid on its own
 *    looks like (and is) noise. XOR them and the shield appears: that is the whole idea of the
 *    product's 2-of-2 split, where the disk key S = Share_A XOR Share_B.
 *
 * Everything is computed once at module load from fixed seeds, so the server render and the
 * hydrated island agree cell for cell.
 */
import { CAMO_PALETTE, SHIELD_POLYGON, lcg } from './camo'

export const GRID = 16

export interface KeyCell {
  /** Column, used to time the left-to-right "XOR scan". */
  col: number
  row: number
  inside: boolean
  fill: string
  /** Random wipe delay fraction, 0..1. */
  wipe: number
}

function pointInPolygon(x: number, y: number, poly: ReadonlyArray<readonly [number, number]>) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (crosses) inside = !inside
  }
  return inside
}

const cellSize = 24 / GRID

/** true where the shield covers the cell centre. */
export const MASK: boolean[] = Array.from({ length: GRID * GRID }, (_, i) => {
  const col = i % GRID
  const row = Math.floor(i / GRID)
  return pointInPolygon((col + 0.5) * cellSize, (row + 0.5) * cellSize, SHIELD_POLYGON)
})

const noise = lcg(1337)
/** Share A: seeded noise. */
export const SHARE_A: boolean[] = MASK.map(() => noise() < 0.5)
/** Share B = A XOR MASK. */
export const SHARE_B: boolean[] = SHARE_A.map((bit, i) => bit !== MASK[i])

const camo = lcg(7)
const wipe = lcg(42)
/** The key grid: camo pixels where the mask is set. */
export const KEY: KeyCell[] = MASK.map((inside, i) => ({
  col: i % GRID,
  row: Math.floor(i / GRID),
  inside,
  fill: CAMO_PALETTE[Math.floor(camo() * CAMO_PALETTE.length)],
  wipe: wipe(),
}))
