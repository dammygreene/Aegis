import { describe, it, expect, vi } from 'vitest';
import {
  probeBlockNumber,
  probeConfiguredRpcEndpoints,
  maskRpcUrl,
  MAX_RPC_RETRIES,
} from '@/services/rpc';

/**
 * test.md §1.4 / §1.5 (RPC endpoints respond to eth_blockNumber) and
 * §6.3 (an RPC timeout fails within a bounded time instead of hanging).
 */

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_key_1234567890abcdef';

describe('RPC probe (test.md §1.4, §1.5, §6.3)', () => {
  it('returns the block number and latency on success', async () => {
    const fetchImpl = vi.fn(async () =>
      ({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x12a05f2' }),
      }) as unknown as Response
    );

    const result = await probeBlockNumber(RPC, { fetchImpl: fetchImpl as any });

    expect(result.ok).toBe(true);
    expect(result.blockNumber).toBe(0x12a05f2);
    expect(result.attempts).toBe(1);
    expect(typeof result.latencyMs).toBe('number');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('§6.3 aborts on timeout and reports the timeout instead of hanging', async () => {
    const started = Date.now();
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        })
    );

    const result = await probeBlockNumber(RPC, {
      timeoutMs: 60,
      retries: 1,
      fetchImpl: fetchImpl as any,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('TIMEOUT_AFTER_60MS');
    expect(result.attempts).toBe(2);
    // Bounded: it gave up instead of hanging on the dead socket
    expect(Date.now() - started).toBeLessThan(5_000);
  });

  it('§6.3 retries a bounded number of times on transport errors', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNRESET');
    });

    const result = await probeBlockNumber(RPC, {
      timeoutMs: 100,
      retries: MAX_RPC_RETRIES,
      fetchImpl: fetchImpl as any,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('ECONNRESET');
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_RPC_RETRIES + 1);
    expect(result.attempts).toBe(MAX_RPC_RETRIES + 1);
  });

  it('surfaces HTTP and JSON-RPC error status', async () => {
    const http = await probeBlockNumber(RPC, {
      retries: 0,
      fetchImpl: vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }) as any),
    });
    expect(http.error).toBe('HTTP_401');

    const rpcErr = await probeBlockNumber(RPC, {
      retries: 0,
      fetchImpl: vi.fn(async () => ({
        ok: true,
        json: async () => ({ error: { code: -32602, message: 'invalid' } }),
      }) as any),
    });
    expect(rpcErr.error).toBe('RPC_ERROR_-32602');
  });

  it('reports an unconfigured endpoint without attempting a request', async () => {
    const fetchImpl = vi.fn();
    const result = await probeBlockNumber('', { fetchImpl: fetchImpl as any });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('RPC_URL_NOT_CONFIGURED');
    expect(result.attempts).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('probes all configured endpoints concurrently', async () => {
    const fetchImpl = vi.fn(async () =>
      ({ ok: true, json: async () => ({ result: '0x1' }) }) as unknown as Response
    );
    vi.stubGlobal('fetch', fetchImpl);

    try {
      const results = await probeConfiguredRpcEndpoints(
        {
          ALCHEMY_RPC_URL: RPC,
          ALCHEMY_BASE_MAINNET_RPC_URL: RPC,
          ALCHEMY_SEPOLIA_RPC_URL: RPC,
        },
        { retries: 0, timeoutMs: 100 }
      );

      expect(Object.keys(results).sort()).toEqual(['baseMainnet', 'ethMainnet', 'sepolia']);
      expect(fetchImpl).toHaveBeenCalledTimes(3); // one call each, in parallel
      for (const probe of Object.values(results)) {
        expect(probe.ok).toBe(true);
        expect(probe.blockNumber).toBe(1);
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('reports unconfigured endpoints rather than inventing a result', async () => {
    const results = await probeConfiguredRpcEndpoints({}, { retries: 0, timeoutMs: 100 });

    for (const probe of Object.values(results)) {
      expect(probe.ok).toBe(false);
      expect(probe.error).toBe('RPC_URL_NOT_CONFIGURED');
    }
  });

  it('masks API keys in any URL it reports', () => {
    expect(maskRpcUrl(RPC)).not.toContain('alch_key_1234567890abcdef');
    expect(maskRpcUrl(RPC)).toContain('***');
    expect(maskRpcUrl('not a url')).not.toContain('1234567890abcdef');
  });
});
