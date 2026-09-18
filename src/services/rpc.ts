/**
 * RPC connectivity helpers (test.md §1.4 / §1.5) with the timeout-and-fail
 * behaviour §6.3 asks for.
 *
 * There is deliberately no infinite wait and no unbounded retry here:
 *   - every request is aborted after `timeoutMs`
 *   - at most `MAX_RPC_RETRIES` extra attempts, with a short backoff
 *   - on total failure the caller gets a structured result, never a hang
 */

export const RPC_TIMEOUT_MS = 8_000;
export const MAX_RPC_RETRIES = 2;

export interface RpcProbeResult {
  url: string;
  ok: boolean;
  blockNumber?: number;
  latencyMs?: number;
  attempts: number;
  error?: string;
}

/** Mask the API key in an RPC URL so probe results can be logged/shown safely. */
export function maskRpcUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length) parts[parts.length - 1] = '***';
    u.pathname = `/${parts.join('/')}`;
    return u.toString();
  } catch {
    return url.replace(/[A-Za-z0-9_-]{16,}/g, '***');
  }
}

/**
 * Perform an `eth_blockNumber` JSON-RPC call against a single endpoint.
 */
export async function probeBlockNumber(
  url: string,
  options: { timeoutMs?: number; retries?: number; fetchImpl?: typeof fetch } = {}
): Promise<RpcProbeResult> {
  const timeoutMs = options.timeoutMs ?? RPC_TIMEOUT_MS;
  const retries = options.retries ?? MAX_RPC_RETRIES;
  const doFetch = options.fetchImpl ?? fetch;
  const masked = maskRpcUrl(url);

  if (!url) {
    return { url: masked, ok: false, attempts: 0, error: 'RPC_URL_NOT_CONFIGURED' };
  }

  let lastError = 'UNKNOWN';
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const started = Date.now();

    try {
      const res = await doFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
        signal: controller.signal,
      });

      if (!res.ok) {
        lastError = `HTTP_${res.status}`;
      } else {
        const json: any = await res.json();
        if (json?.error) {
          lastError = `RPC_ERROR_${json.error.code ?? 'unknown'}`;
        } else if (typeof json?.result === 'string') {
          return {
            url: masked,
            ok: true,
            blockNumber: parseInt(json.result, 16),
            latencyMs: Date.now() - started,
            attempts: attempt,
          };
        } else {
          lastError = 'MALFORMED_RESPONSE';
        }
      }
    } catch (err: any) {
      lastError = err?.name === 'AbortError' ? `TIMEOUT_AFTER_${timeoutMs}MS` : err?.message ?? 'FETCH_FAILED';
    } finally {
      clearTimeout(timer);
    }

    if (attempt <= retries) {
      await new Promise(r => setTimeout(r, 250 * attempt));
    }
  }

  return { url: masked, ok: false, attempts: retries + 1, error: lastError };
}

/** Probe every configured endpoint concurrently (never sequentially). */
export async function probeConfiguredRpcEndpoints(
  env: NodeJS.ProcessEnv = process.env,
  options: { timeoutMs?: number; retries?: number } = {}
): Promise<Record<string, RpcProbeResult>> {
  const endpoints: Record<string, string> = {
    ethMainnet: env.ALCHEMY_RPC_URL || '',
    baseMainnet: env.ALCHEMY_BASE_MAINNET_RPC_URL || '',
    sepolia: env.ALCHEMY_SEPOLIA_RPC_URL || '',
  };

  const results = await Promise.all(
    Object.values(endpoints).map(url => probeBlockNumber(url, options))
  );

  return Object.fromEntries(Object.keys(endpoints).map((key, i) => [key, results[i]]));
}
