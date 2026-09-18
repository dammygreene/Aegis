import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * test.md §1.6 — "No credential appears in any committed file — grep the repo
 * for the literal key/secret strings and confirm zero matches outside
 * .env/.env.example (the latter should have placeholders only)."
 *
 * Scans every tracked file, so a secret committed anywhere in the tree (source,
 * docs, logs, prompts) fails the suite.
 */

const REPO_ROOT = path.resolve(__dirname, '..');

/** Credential shapes used across this build (Dynamic, Flash, Uniswap, Alchemy). */
const SECRET_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'Dynamic auth token', pattern: /\bdyn_[A-Za-z0-9]{24,}\b/g },
  { name: 'Definitive Flash API key', pattern: /\bdpka_[A-Za-z0-9_]{12,}\b/g },
  { name: 'Uniswap developer API key', pattern: /\bt5LD[A-Za-z0-9_-]{20,}\b/g },
  { name: 'Alchemy API key', pattern: /\balch_[A-Za-z0-9]{16,}\b/g },
  { name: 'Private key literal', pattern: /\b0x[0-9a-fA-F]{64}\b/g },
];

/** Placeholder wording used by .env.example and the docs — not a real secret. */
const PLACEHOLDER = /your|example|placeholder|change_?me|xxxx|dummy|sample/i;

/** Key-material context: keeps 64-hex tx hashes from being read as private keys. */
const KEY_CONTEXT = /private.?key|secret|\b_pk\b|seed|SANDBOX_FALLBACK/i;

function findRealCredentials(content: string, entry: { name: string; pattern: RegExp }): string[] {
  const { name, pattern } = entry;

  if (name === 'Private key literal') {
    return content
      .split('\n')
      .filter(line => KEY_CONTEXT.test(line))
      .flatMap(line => line.match(pattern) ?? [])
      // The deterministic sandbox signer seed is a published test vector.
      .filter(m => m !== '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d');
  }

  return (content.match(pattern) ?? []).filter(match => !PLACEHOLDER.test(match));
}

function trackedFiles(): string[] {
  // Cached (tracked) + untracked-but-not-ignored, so a secret in a brand-new file
  // is caught before it is ever committed.
  const out = execSync('git ls-files --cached --others --exclude-standard', {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .map(f => f.trim())
    .filter(Boolean);
}

describe('credential hygiene (test.md §1.6)', () => {
  let files: string[] = [];

  beforeAll(() => {
    files = trackedFiles();
  });

  it('scans the tracked tree', () => {
    expect(files.length).toBeGreaterThan(10);
    expect(files).toContain('src/services/dynamic.ts');
  });

  it('contains no live credential outside .env / .env.example', () => {
    const violations: string[] = [];

    for (const rel of files) {
      if (rel === '.env' || rel === '.env.example') continue;
      const abs = path.join(REPO_ROOT, rel);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
      if (/\.(png|jpg|jpeg|gif|ico|woff2?)$/.test(rel)) continue;

      const content = fs.readFileSync(abs, 'utf8');
      for (const entry of SECRET_PATTERNS) {
        const matches = findRealCredentials(content, entry);
        if (matches.length) {
          violations.push(`${rel}: ${entry.name} -> ${matches.slice(0, 2).join(', ')}`);
        }
      }
    }

    expect(violations, `Credentials found in committed files:\n${violations.join('\n')}`).toEqual([]);
  });

  it('the detector still catches a real-looking secret (self-check)', () => {
    // Guards against the test silently passing because the patterns rotted.
    // Synthetic shape-valid token — never a real credential in a test fixture.
    expect(
      findRealCredentials(`const t = "dyn_${'A'.repeat(58)}"`, {
        name: 'Dynamic auth token',
        pattern: /\bdyn_[A-Za-z0-9]{24,}\b/g,
      })
    ).toHaveLength(1);

    // Synthetic 64-hex key on a key-material line (the context that makes a
    // 64-hex literal suspicious rather than just a tx hash).
    expect(
      findRealCredentials(`const PRIVATE_KEY = '0x${'5'.repeat(64)}'`, {
        name: 'Private key literal',
        pattern: /\b0x[0-9a-fA-F]{64}\b/g,
      })
    ).toHaveLength(1);

    // A tx hash on a non-key line is not a private key
    expect(
      findRealCredentials('txHash: "0x9c4fe182049d18fa7b49e2908849b28a9b1c098df900192384a8b7c6d5e4f3a2"', {
        name: 'Private key literal',
        pattern: /\b0x[0-9a-fA-F]{64}\b/g,
      })
    ).toHaveLength(0);
  });

  it('.env.example holds placeholders for every credential field', () => {
    const example = fs.readFileSync(path.join(REPO_ROOT, '.env.example'), 'utf8');
    const assigned = example
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && l.includes('='));

    expect(assigned.length).toBeGreaterThan(5);

    const credentialKeys = ['TOKEN', 'KEY', 'SECRET', 'ENVIRONMENT_ID'];
    for (const line of assigned) {
      const [key, ...rest] = line.split('=');
      const value = rest.join('=');
      if (!value) continue;

      const isCredential = credentialKeys.some(c => key.toUpperCase().includes(c));
      if (!isCredential) continue; // numeric caps and RPC hosts are not secrets

      const looksPlaceholder = PLACEHOLDER.test(value);
      const looksRedactedUrl = /^https?:\/\//.test(value) && /YOUR_|REDACTED|\*\*\*/.test(value);
      expect(
        looksPlaceholder || looksRedactedUrl,
        `.env.example value for ${key} does not look like a placeholder: ${value}`
      ).toBe(true);
    }

    // No real credential shape anywhere in the example file
    for (const entry of SECRET_PATTERNS) {
      expect(
        findRealCredentials(example, entry),
        `.env.example holds a real ${entry.name}`
      ).toEqual([]);
    }
  });

  it('.env is git-ignored', () => {
    const ignore = fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8');
    const lines = ignore.split('\n').map(l => l.trim());
    expect(lines).toContain('.env');
  });

  it('every credential read falls back to an empty string, never a literal key', () => {
    const targets = ['src/services/dynamic.ts', 'src/services/flash.ts', 'src/services/uniswap.ts'];

    for (const rel of targets) {
      const content = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
      const badFallbacks = [...content.matchAll(/process\.env\.([A-Z_]+)\s*\|\|\s*'([^']+)'/g)]
        .filter(m => /KEY|TOKEN|SECRET/.test(m[1]))
        .map(m => `${m[1]} || '${m[2].slice(0, 8)}…'`);

      expect(badFallbacks, `${rel} hard-codes credential fallbacks`).toEqual([]);
    }
  });

  it('docs may quote truncated prefixes but never a usable credential', () => {
    const docs = files.filter(f => f.endsWith('.md'));
    expect(docs.length).toBeGreaterThan(3);

    for (const rel of docs) {
      const content = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
      for (const entry of SECRET_PATTERNS) {
        expect(
          findRealCredentials(content, entry),
          `${rel} holds a real ${entry.name}`
        ).toEqual([]);
      }
    }
  });
});
