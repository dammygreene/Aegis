import { NextResponse } from 'next/server';
import { dynamicWallet, MAX_AGENT_SPEND_CAP_USD } from '@/services/dynamic';
import { MAX_LIVE_ORDER_USD, flashService } from '@/services/flash';
import { uniswapService } from '@/services/uniswap';
import { probeConfiguredRpcEndpoints } from '@/services/rpc';

// Read current in-memory state on every request. Without this the route is
// prerendered at build time and the UI shows build-time data after a reload
// (test.md §5.3).
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  await dynamicWallet.initialize();
  const spendState = dynamicWallet.getSpendState();

  const status = {
    dynamic: {
      authenticated: true,
      environmentId: process.env.DYNAMIC_ENVIRONMENT_ID || 'not-configured',
      credentialsPresent: dynamicWallet.hasCredentials(),
      walletAddress: dynamicWallet.getWalletAddress(),
      walletPattern: 'Server Wallet (2-of-2 MPC)',
      spendCapUsd: MAX_AGENT_SPEND_CAP_USD,
      spentUsd: spendState.currentSpendUsd,
      remainingUsd: spendState.remainingUsd,
      mode: dynamicWallet.isSandboxed() ? 'sandboxed' : 'live',
    },
    flash: {
      authenticated: flashService.hasCredentials(),
      maxLiveOrderUsd: MAX_LIVE_ORDER_USD,
      targetChain: 'base',
      supportedOrderTypes: ['bracket', 'take-profit', 'limit', 'twap'],
      mode: flashService.hasCredentials() ? 'live' : 'sandboxed',
    },
    uniswap: {
      authenticated: uniswapService.hasCredentials(),
      network: 'Ethereum Sepolia',
      sdkVersion: 'v3/v4 Gateway Routing',
      mode: uniswapService.hasCredentials() ? 'live' : 'sandboxed',
    },
    alchemy: {
      configured: Boolean(process.env.ALCHEMY_RPC_URL),
      mainnetUrl: 'https://eth-mainnet.g.alchemy.com/v2/...',
      sepoliaUrl: 'https://eth-sepolia.g.alchemy.com/v2/...',
      baseMainnetUrl: 'https://base-mainnet.g.alchemy.com/v2/...',
    },
  };

  // Opt-in liveness probe so the default page load is never slowed by RPC
  // round-trips: GET /api/status?probe=rpc  (test.md §1.4 / §1.5 / §6.3)
  const probe = new URL(req.url).searchParams.get('probe');
  if (probe === 'rpc') {
    return NextResponse.json({
      ...status,
      rpcProbe: await probeConfiguredRpcEndpoints(),
    });
  }

  return NextResponse.json(status);
}
