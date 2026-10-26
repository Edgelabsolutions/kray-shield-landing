/**
 * Everything about the site that is not copy: where people reach Kray, and where the page lives.
 * Change contact details HERE only — every CTA reads from this file.
 */
export const site = {
  /** Product name as written in running text. The mark is set in two parts (see Header). */
  name: 'Kray Shield',
  /** Kray's public contact channel (the same Signal number as kray.in.ua). */
  signalUrl: 'https://signal.me/#p/+380962838234',
  /**
   * A privacy notice for this product, when there is one; empty hides the footer link. (The page
   * sets no cookies, runs no analytics and has no forms.) Don't point it at the company site: the
   * landing must not lead to other Kray products.
   */
  privacyUrl: '',
} as const
