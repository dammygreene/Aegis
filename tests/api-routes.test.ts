import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST as triggerCycle } from '@/app/api/agent/trigger/route';
import { POST as resetFeed } from '@/app/api/agent/reset/route';
import { GET as getFeed } from '@/app/api/feed/route';
import { GET as getStatus } from '@/app/api/status/route';
import { dynamicWallet, MAX_AGENT_SPEND_CAP_USD } from '@/services/dynamic';
import { MAX_LIVE_ORDER_USD } from '@/services/flash';

/**
 * Route-level coverage for the UI's data contract (test.md §5) plus the
 * safeguard error path the UI renders as "Execution Safeguard Triggered".
 */

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/agent/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API routes backing the feed UI', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNRESET — egress blocked');
      })
    );
    agentReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function agentReset() {
    dynamicWallet.resetSpend();
  }

  it('POST /api/agent/trigger runs a cycle and returns the updated budget', async () => {
    await resetFeed();
    const res = await triggerCycle(jsonRequest({ scenario: 'volatility_spike' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cycle.executions).toHaveLength(2);
    expect(body.spend.currentSpendUsd).toBeGreaterThan(0);
    expect(body.spend.spendCapUsd).toBe(MAX_AGENT_SPEND_CAP_USD);
  });

  it('POST /api/agent/trigger surfaces a spend-cap breach as a 400, not a hang', async () => {
    await resetFeed();
    await dynamicWallet.authorizeAction('Exhaust the budget', MAX_AGENT_SPEND_CAP_USD);

    const res = await triggerCycle(jsonRequest({ scenario: 'volatility_spike' }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/SPEND_CAP_EXCEEDED/);
    expect(body.spend.remainingUsd).toBe(0);
  });

  it('GET /api/feed returns the feed and the live spend state', async () => {
    const res = await getFeed();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.feed)).toBe(true);
    expect(body.feed.length).toBeGreaterThan(0);
    expect(body.spend).toMatchObject({
      spendCapUsd: MAX_AGENT_SPEND_CAP_USD,
    });
  });

  it('POST /api/agent/reset restores the baseline cycle', async () => {
    const res = await resetFeed();

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.feed).toHaveLength(1);
    expect(body.spend.currentSpendUsd).toBe(0);
  });

  it('GET /api/status publishes both hard caps', async () => {
    const res = await getStatus(new Request('http://localhost/api/status'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dynamic.spendCapUsd).toBe(MAX_AGENT_SPEND_CAP_USD);
    expect(body.flash.maxLiveOrderUsd).toBe(MAX_LIVE_ORDER_USD);
    expect(body.flash.targetChain).toBe('base');
    expect(['live', 'sandboxed']).toContain(body.dynamic.mode);
  });

  it('GET /api/status?probe=rpc reports per-endpoint reachability without hanging', async () => {
    const res = await getStatus(new Request('http://localhost/api/status?probe=rpc'));
    const body = await res.json();

    expect(body.rpcProbe).toBeTruthy();
    expect(Object.keys(body.rpcProbe).sort()).toEqual(['baseMainnet', 'ethMainnet', 'sepolia']);

    for (const probe of Object.values(body.rpcProbe) as any[]) {
      expect(typeof probe.ok).toBe('boolean');
      expect(probe.url).not.toMatch(/[A-Za-z0-9_-]{24,}/); // never leaks a key
    }
  });

  it('does not report authenticated venues it has no credentials for', async () => {
    const res = await getStatus(new Request('http://localhost/api/status'));
    const body = await res.json();

    // In this sandbox no keys are configured, so every venue must say so.
    expect(body.flash.authenticated).toBe(Boolean(process.env.DEFINITIVE_FLASH_API_KEY));
    expect(body.uniswap.authenticated).toBe(Boolean(process.env.UNISWAP_API_KEY));
    expect(body.dynamic.credentialsPresent).toBe(Boolean(process.env.DYNAMIC_AUTH_TOKEN));
  });
});
