import crypto from 'node:crypto';

/**
 * Ensure crypto.hash is available for Node versions lacking it.
 * Adds a fallback using createHash when necessary.
 * @param {typeof import('node:crypto')} [c]
 * @returns {void}
 */
export function ensureCryptoHash(c = crypto) {
  if (typeof c.hash !== 'function') {
    c.hash = (algorithm, data, encoding) =>
      c.createHash(algorithm).update(data).digest(encoding);
  }
}

ensureCryptoHash();
