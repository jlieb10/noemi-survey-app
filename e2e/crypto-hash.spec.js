import { test, expect } from '@playwright/test';
import { ensureCryptoHash } from '../scripts/ensureCryptoHash.js';

/**
 * Verify that ensureCryptoHash provides a fallback hash function.
 */
test('ensureCryptoHash polyfills hash when missing', async () => {
  const fake = {
    createHash: (algorithm) => ({
      data: '',
      update(d) {
        this.data += d;
        return this;
      },
      digest(enc) {
        return `${algorithm}:${this.data}:${enc}`;
      },
    }),
  };
  ensureCryptoHash(fake);
  expect(typeof fake.hash).toBe('function');
  expect(fake.hash('sha256', 'data', 'hex')).toBe('sha256:data:hex');
});
