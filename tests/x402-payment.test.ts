import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { x402Service } from '@/services/x402';
import { dynamicWallet } from '@/services/dynamic';
import { GET } from '@/app/api/oracle/volatility/route';

/**
 * test.md §4 (machine payments flourish) + the HTTP 402 oracle contract
 * described in README §4.
 */

describe('x402 machine payment flow', () => {
  beforeEach(() => {
    dynamicWallet.resetSpend();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNRESET — egress blocked');
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('issues a well-formed HTTP 402 challenge', () => {
    const challenge = x402Service.generatePaymentChallenge('eth-usdc-skew-hf');

    expect(challenge.scheme).toBe('x402');
    expect(challenge.amountUsd).toBe(0.05);
    expect(challenge.currency).toBe('USDC');
    expect(challenge.recipient).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(challenge.nonce).toMatch(/^x402_/);
  });

  it('authorizes against the spend cap, signs, and records the payment', async () => {
    await dynamicWallet.initialize();
    const step = await x402Service.executePaymentFlow('eth-usdc-skew-hf');

    expect(step.status).toBe('Paid & Verified');
    expect(step.costUsd).toBe(0.05);
    expect(step.resource).toContain('eth-usdc-skew-hf');
    // Signature is truncated for display but keeps head and tail
    expect(step.paymentSignature).toMatch(/^0x[0-9a-fA-F]{12}\.\.\.[0-9a-fA-F]{8}$/);
    expect(dynamicWallet.getSpendState().currentSpendUsd).toBeCloseTo(0.05, 2);
  });
});

describe('volatility oracle route (HTTP 402)', () => {
  it('returns 402 with a machine-readable PAYMENT-REQUIRED header when unpaid', async () => {
    const res = await GET(new Request('http://localhost/api/oracle/volatility'));

    expect(res.status).toBe(402);
    const header = res.headers.get('PAYMENT-REQUIRED');
    expect(header).toBeTruthy();
    expect(header).toContain('scheme=x402');
    expect(header).toContain('amount=0.05');
    expect(header).toContain('currency=USDC');

    const body = await res.json();
    expect(body.error).toBe('Payment Required');
    expect(body.price).toBe('0.05 USDC');
  });

  it('grants access once a PAYMENT-SIGNATURE header is present', async () => {
    const res = await GET(
      new Request('http://localhost/api/oracle/volatility', {
        headers: { 'PAYMENT-SIGNATURE': '0xdeadbeef' },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('access_granted');
    expect(body.metrics.annualizedHV).toBeTruthy();
    expect(body.metrics.recommendedAction).toBe('TIGHTEN_RANGE_AND_HEDGE_BRACKET');
  });
});
