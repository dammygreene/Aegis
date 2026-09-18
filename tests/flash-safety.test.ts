import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  flashService,
  MAX_LIVE_ORDER_USD,
  MAX_QUOTE_RETRIES,
  FLASH_NON_EXPIRING_DEADLINE,
  toExpiryMs,
} from '@/services/flash';

/**
 * test.md §4 — Definitive Flash (live money, extra care)
 *   §4.1 a quote is produced for a trivial size
 *   §4.3 MAX_LIVE_ORDER_USD is an independent gate that blocks oversized orders
 *   §4.5 no retry loop can resubmit an order on a transient error
 *   §6.2 an expired quote is handled (re-quote or clear failure)
 *
 * A real live order (§4.4) requires funded mainnet capital and outbound egress;
 * it is logged as NOT RUN in TEST_LOG.md rather than faked.
 */

const FUNDER = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
const baseParams = {
  side: 'buy' as const,
  qtyUsd: 12.5,
  funderAddress: FUNDER,
  takeProfitPriceUsd: 3200,
  stopLossPriceUsd: 2400,
};

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

/** An API-shaped quote with a controllable deadline and signable typed data. */
function apiQuote(deadlineSeconds: number | string) {
  const orderTypes = {
    Order: [
      { name: 'funder', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
  };
  const bracketTypes = {
    BracketPair: [
      { name: 'entryQuoteId', type: 'string' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  return {
    quoteId: `q_test_${deadlineSeconds}`,
    evm: {
      orderTypedData: JSON.stringify({
        domain: { name: 'FlashSettlement', version: '1', chainId: 8453 },
        types: orderTypes,
        primaryType: 'Order',
        message: { funder: FUNDER, deadline: String(deadlineSeconds) },
      }),
    },
    attachedBracket: {
      evm: {
        orderTypedData: JSON.stringify({
          domain: { name: 'FlashBracketManager', version: '1', chainId: 8453 },
          types: bracketTypes,
          primaryType: 'BracketPair',
          message: { entryQuoteId: `q_test_${deadlineSeconds}`, deadline: String(deadlineSeconds) },
        }),
      },
      salt: '0x' + '11'.repeat(32),
      deadline: String(deadlineSeconds),
      signedMaxFromAmount: '0.0049',
    },
  };
}

describe('Definitive Flash safety gates (test.md §4, §6.2)', () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockReset();
    // Default: no egress. Services must degrade to their local fallback paths.
    fetchSpy.mockImplementation(async () => {
      throw new Error('ECONNRESET — egress blocked');
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('publishes the non-negotiable $20 live-order ceiling', () => {
    expect(MAX_LIVE_ORDER_USD).toBe(20);
  });

  it('§4.1 produces a usable bracket quote for a trivial size', async () => {
    const quote = await flashService.getBracketQuote(baseParams);

    expect(quote.quoteId).toBeTruthy();
    expect(quote.evm.orderTypedData).toBeTruthy();
    expect(quote.attachedBracket.evm.orderTypedData).toBeTruthy();

    const entry = JSON.parse(quote.evm.orderTypedData);
    expect(entry.domain.chainId).toBe(8453); // Base Mainnet
    expect(entry.message.funder.toLowerCase()).toBe(FUNDER.toLowerCase());
    expect(entry.message.amount).toBe('12500000');
  });

  it('§4.3 getBracketQuote blocks an oversized order before any network call', async () => {
    await expect(
      flashService.getBracketQuote({ ...baseParams, qtyUsd: MAX_LIVE_ORDER_USD + 0.01 })
    ).rejects.toThrow(/CRITICAL_SAFETY_ABORT/);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('§4.3 executeBracketOrder blocks an oversized order before any network call', async () => {
    await expect(
      flashService.executeBracketOrder({ ...baseParams, qtyUsd: 250 })
    ).rejects.toThrow(/CRITICAL_SAFETY_ABORT/);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('§4.3 the ceiling gate is independent of the agent decision path', async () => {
    // Even an order the agent "decided" to place is stopped by the dumb gate.
    const decided = { ...baseParams, qtyUsd: MAX_LIVE_ORDER_USD * 3 };
    await expect(flashService.executeBracketOrder(decided)).rejects.toThrow(
      /CRITICAL_SAFETY_ABORT/
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('accepts an order exactly at the ceiling (boundary)', async () => {
    const leg = await flashService.executeBracketOrder({
      ...baseParams,
      qtyUsd: MAX_LIVE_ORDER_USD,
    });

    expect(leg.venue).toBe('Definitive Flash');
    expect(leg.network).toBe('mainnet');
    expect(leg.chainId).toBe(8453);
    expect(leg.status).toBe('active_bracket');
  });

  it('§4.5 a transient network failure does not retry or resubmit the order', async () => {
    const leg = await flashService.executeBracketOrder(baseParams);

    const orderCalls = fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/order'));
    const quoteCalls = fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/quote'));

    expect(orderCalls.length).toBe(1); // submitted exactly once, never resubmitted
    expect(quoteCalls.length).toBe(1);
    expect(leg.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('§6.2 an expired quote is re-quoted, then fails loudly if still stale', async () => {
    const expired = Math.floor(Date.now() / 1000) - 3600; // one hour ago
    fetchSpy.mockImplementation(async (url: string) =>
      String(url).endsWith('/quote') ? jsonResponse(apiQuote(expired)) : jsonResponse({ orderId: 'ord_should_never_happen' })
    );

    await expect(flashService.executeBracketOrder(baseParams)).rejects.toThrow(
      /FLASH_QUOTE_EXPIRED/
    );

    const orderCalls = fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/order'));
    const quoteCalls = fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/quote'));
    expect(orderCalls.length).toBe(0); // never submitted on a dead quote
    expect(quoteCalls.length).toBe(1 + MAX_QUOTE_RETRIES);
  });

  it('§6.2 a stale-then-fresh quote sequence completes with a single submission', async () => {
    const expired = Math.floor(Date.now() / 1000) - 60;
    const fresh = Math.floor(Date.now() / 1000) + 300;
    let quoteCount = 0;

    fetchSpy.mockImplementation(async (url: string) => {
      if (String(url).endsWith('/quote')) {
        quoteCount += 1;
        return jsonResponse(apiQuote(quoteCount === 1 ? expired : fresh));
      }
      return jsonResponse({ orderId: 'ord_live_1' });
    });

    const leg = await flashService.executeBracketOrder(baseParams);

    const orderCalls = fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/order'));
    expect(orderCalls.length).toBe(1);
    expect(leg.id).toBe('ord_live_1');
    expect(leg.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('§6 a malformed quote payload fails clearly instead of inside the signer', async () => {
    fetchSpy.mockImplementation(async (url: string) =>
      String(url).endsWith('/quote')
        ? jsonResponse({
            quoteId: 'q_broken',
            attachedBracket: { deadline: String(FLASH_NON_EXPIRING_DEADLINE) },
            evm: { orderTypedData: JSON.stringify({ domain: {}, message: {} }) },
          })
        : jsonResponse({ orderId: 'ord_never' })
    );

    await expect(flashService.executeBracketOrder(baseParams)).rejects.toThrow(
      /FLASH_MALFORMED_QUOTE: entry order typed data is missing/
    );

    const orderCalls = fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/order'));
    expect(orderCalls.length).toBe(0);
  });

  it('treats the 2^48-1 sentinel as non-expiring', () => {
    expect(flashService.isQuoteExpired(apiQuote(FLASH_NON_EXPIRING_DEADLINE))).toBe(false);
    expect(toExpiryMs(FLASH_NON_EXPIRING_DEADLINE)).toBeNull();
  });

  it('§6.2 treats a quote dying inside the safety window as already expired', () => {
    const now = Date.now();
    const secondsSoon = Math.floor(now / 1000) + 2; // inside the 5s window

    expect(flashService.isQuoteExpired(apiQuote(secondsSoon), now)).toBe(true);
    expect(flashService.isQuoteExpired(apiQuote(Math.floor(now / 1000) + 600), now)).toBe(false);
    expect(flashService.isQuoteExpired(null)).toBe(true);
  });

  it('normalises the deadline formats Flash can return', () => {
    expect(toExpiryMs(1_758_200_000)).toBe(1_758_200_000_000); // unix seconds
    expect(toExpiryMs('1758200000')).toBe(1_758_200_000_000); // stringified seconds
    expect(toExpiryMs(1_758_200_000_000)).toBe(1_758_200_000_000); // already ms
    expect(toExpiryMs('2026-09-18T12:00:00.000Z')).toBe(Date.parse('2026-09-18T12:00:00.000Z'));
    expect(toExpiryMs('')).toBeNull();
    expect(toExpiryMs(undefined)).toBeNull();
    expect(toExpiryMs('not-a-date')).toBeNull();
  });
});
