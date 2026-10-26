/**
 * Reduced-motion check shared by the adapted React Bits components (not React Bits code).
 *
 * Why not Motion's `useReducedMotion`: in motion 14.6 it is a `useState` snapshot. It returns `null`
 * on the server and the real value on the client's first render, so a component that branches on
 * it can mismatch during hydration, and it never updates when the OS setting changes.
 * `useSyncExternalStore` renders the server snapshot (`false`) during hydration, then re-renders
 * with the live value, and keeps listening.
 */
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

let media: MediaQueryList | null | undefined

function getMedia(): MediaQueryList | null {
  if (media !== undefined) return media
  media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(QUERY)
      : null
  return media
}

function subscribe(onChange: () => void): () => void {
  const list = getMedia()
  if (!list) return () => {}
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

const getServerSnapshot = (): boolean => false

/** For effects and event handlers: true when the visitor asked for reduced motion. */
export function prefersReducedMotion(): boolean {
  return getMedia()?.matches ?? false
}

/** For render: SSR-safe (false on the server and during hydration), then live. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, getServerSnapshot)
}
