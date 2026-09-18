import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Test runner config for the test.md checklist suite (see tests/ and TEST_LOG.md).
 * Mirrors the `@` -> `src` alias from next.config.mjs / tsconfig.json so tests
 * import exactly the modules the app ships.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
    // Each file gets a fresh module registry so module-level env reads
    // (MAX_AGENT_SPEND_CAP_USD / MAX_LIVE_ORDER_USD) can be re-evaluated.
    isolate: true,
    testTimeout: 20000,
  },
});
