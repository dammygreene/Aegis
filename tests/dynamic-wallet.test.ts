import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { recoverMessageAddress, verifyTypedData, isAddress } from 'viem';
import { dynamicWallet, MAX_AGENT_SPEND_CAP_USD } from '@/services/dynamic';

/**
 * test.md §2 — Dynamic wallet (Phase 1)
 *   §2.1 wallet creation returns an address
 *   §2.3 the wallet can sign a test payload (and the signature verifies)
 *   §2.4 the spend cap is enforced in code, before anything reaches Flash/Uniswap
 *
 * Live dashboard confirmation (§2.2) needs a human/browser and is logged in
 * TEST_LOG.md instead.
 */

const ORDER_TYPED_DATA = {
  domain: {
    name: 'FlashSettlement',
    version: '1',
    chainId: 8453,
    verifyingContract: '0x1111111111111111111111111111111111111111',
  },
  types: {
    Order: [
      { name: 'funder', type: 'address' },
      { name: 'targetAsset', type: 'address' },
      { name: 'contraAsset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  primaryType: 'Order',
  message: {
    funder: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    targetAsset: '0x4200000000000000000000000000000000000006',
    contraAsset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount: '10000000',
    nonce: '1758200000000',
    deadline: '281474976710655',
  },
} as const;

describe('Dynamic server wallet + spend cap (test.md §2)', () => {
  const fetchSpy = vi.fn(async () => {
    throw new Error('network egress disabled in test');
  });

  beforeEach(() => {
    dynamicWallet.resetSpend();
    vi.stubGlobal('fetch', fetchSpy);
    fetchSpy.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('§2.1 initialize() returns a wallet address and a mode', async () => {
    const result = await dynamicWallet.initialize();

    expect(result.success).toBe(true);
    expect(['live', 'sandboxed']).toContain(result.mode);
    expect(isAddress(result.address)).toBe(true);
    expect(result.address).toBe(dynamicWallet.getWalletAddress());
  });

  it('spend cap defaults to the documented $50.00 policy', () => {
    expect(MAX_AGENT_SPEND_CAP_USD).toBe(50);
    expect(dynamicWallet.getSpendState().spendCapUsd).toBe(50);
  });

  it('§2.3 signMessage produces a signature that recovers to the wallet address', async () => {
    await dynamicWallet.initialize();
    const message = 'x402:pay:0x9999:0.05:USDC:nonce-1';
    const signature = await dynamicWallet.signMessage(message);

    expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);
    const recovered = await recoverMessageAddress({ message, signature });
    expect(recovered.toLowerCase()).toBe(dynamicWallet.getWalletAddress().toLowerCase());
  });

  it('§4.2 signTypedData produces an EIP-712 signature that verifies', async () => {
    await dynamicWallet.initialize();
    const signature = await dynamicWallet.signTypedData(ORDER_TYPED_DATA as any);

    expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);
    const valid = await verifyTypedData({
      address: dynamicWallet.getWalletAddress() as `0x${string}`,
      domain: ORDER_TYPED_DATA.domain,
      types: ORDER_TYPED_DATA.types,
      primaryType: 'Order',
      message: ORDER_TYPED_DATA.message,
      signature: signature as `0x${string}`,
    });
    expect(valid).toBe(true);
  });

  it('§2.4 checkSpendCap allows an action inside the cap', () => {
    const result = dynamicWallet.checkSpendCap(49.99);
    expect(result.allowed).toBe(true);
    expect(result.remainingUSD).toBeCloseTo(0.01, 2);
    expect(result.error).toBeUndefined();
  });

  it('§2.4 checkSpendCap rejects an action above the cap', () => {
    const result = dynamicWallet.checkSpendCap(50.01);
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/SPEND_CAP_EXCEEDED/);
  });

  it('§2.4 authorizeAction rejects once cumulative spend would cross the cap', async () => {
    await dynamicWallet.initialize();

    const first = await dynamicWallet.authorizeAction('First leg', 40);
    expect(first.currentSpendUsd).toBeCloseTo(40, 2);
    expect(first.remainingSpendUsd).toBeCloseTo(10, 2);

    await expect(dynamicWallet.authorizeAction('Oversized leg', 11)).rejects.toThrow(
      /SPEND_CAP_EXCEEDED/
    );

    // A rejected action must not consume budget
    expect(dynamicWallet.getSpendState().currentSpendUsd).toBeCloseTo(40, 2);

    // ...and the remaining budget is still usable
    const third = await dynamicWallet.authorizeAction('Right-sized leg', 10);
    expect(third.remainingSpendUsd).toBeCloseTo(0, 2);
  });

  it('§2.4 the cap is enforced before any outbound venue call', async () => {
    await dynamicWallet.initialize();
    await dynamicWallet.authorizeAction('Fill the budget', MAX_AGENT_SPEND_CAP_USD);

    fetchSpy.mockClear();
    await expect(dynamicWallet.authorizeAction('One dollar too many', 1)).rejects.toThrow(
      /SPEND_CAP_EXCEEDED/
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('resetSpend clears the session budget', async () => {
    await dynamicWallet.authorizeAction('Spend something', 12.5);
    expect(dynamicWallet.getSpendState().currentSpendUsd).toBeCloseTo(12.5, 2);

    dynamicWallet.resetSpend();
    const state = dynamicWallet.getSpendState();
    expect(state.currentSpendUsd).toBe(0);
    expect(state.remainingUsd).toBe(MAX_AGENT_SPEND_CAP_USD);
  });

  it('reports honestly whether real credentials are configured', () => {
    // In this sandbox no DYNAMIC_AUTH_TOKEN is present, so the service must say
    // so rather than claim a live authenticated session.
    expect(dynamicWallet.hasCredentials()).toBe(Boolean(process.env.DYNAMIC_AUTH_TOKEN));
  });
});
