import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * test.md §3.3 — "The repo is public, README points to the exact lines
 * implementing the integration, FEEDBACK.md exists" — plus a guard that every
 * relative link in the docs still resolves after refactors.
 */

const REPO_ROOT = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

describe('submission artifacts (test.md §3.3)', () => {
  it('ships the integration files the README cites', () => {
    for (const file of [
      'src/services/uniswap.ts',
      'src/services/dynamic.ts',
      'src/services/flash.ts',
      'src/services/x402.ts',
      'src/app/api/oracle/volatility/route.ts',
    ]) {
      expect(fs.existsSync(path.join(REPO_ROOT, file)), `${file} missing`).toBe(true);
    }
  });

  it('README documents the safety caps and their file locations', () => {
    const readme = read('README.md');
    expect(readme).toContain('MAX_AGENT_SPEND_CAP_USD');
    expect(readme).toContain('MAX_LIVE_ORDER_USD');
    expect(readme).toContain('src/services/dynamic.ts');
    expect(readme).toContain('src/services/flash.ts');
    expect(readme).toContain('src/services/uniswap.ts');
  });

  it('FEEDBACK.md exists and contains real developer feedback', () => {
    const feedback = read('FEEDBACK.md');
    expect(feedback.length).toBeGreaterThan(500);
    expect(feedback.toLowerCase()).toContain('uniswap');
  });

  it('documents how to run the test suite', () => {
    const readme = read('README.md');
    expect(readme).toMatch(/npm (run )?test/);
    expect(readme).toContain('TEST_LOG.md');
  });

  it('every relative markdown link in the docs resolves', () => {
    const docs = ['README.md', 'RUN_LOG.md', 'FEEDBACK.md', 'TEST_LOG.md'];
    const broken: string[] = [];

    for (const doc of docs) {
      const abs = path.join(REPO_ROOT, doc);
      if (!fs.existsSync(abs)) {
        broken.push(`${doc} is missing`);
        continue;
      }
      const content = read(doc);
      const links = [...content.matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)].map(m => m[1]);

      for (const link of links) {
        if (/^https?:|^mailto:/.test(link)) continue;
        const target = path.join(REPO_ROOT, link);
        if (!fs.existsSync(target)) broken.push(`${doc} -> ${link}`);
      }
    }

    expect(broken, `Broken doc links:\n${broken.join('\n')}`).toEqual([]);
  });
});
