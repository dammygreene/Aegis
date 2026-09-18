import { NextResponse } from 'next/server';
import { dynamicWallet, MAX_AGENT_SPEND_CAP_USD } from '@/services/dynamic';
import { MAX_LIVE_ORDER_USD } from '@/services/flash';

export async function GET() {
  await dynamicWallet.initialize();
  const spendState = dynamicWallet.getSpendState();

  const status = {
    dynamic: {
      authenticated: true,
      environmentId: process.env.DYNAMIC_ENVIRONMENT_ID || '02d3c106-14a1-43f1-ac13-1bfe95efd62b',
      walletAddress: dynamicWallet.getWalletAddress(),
      walletPattern: 'Server Wallet (2-of-2 MPC)',
      spendCapUsd: MAX_AGENT_SPEND_CAP_USD,
      spentUsd: spendState.currentSpendUsd,
      remainingUsd: spendState.remainingUsd,
      mode: dynamicWallet.isSandboxed() ? 'sandboxed' : 'live',
    },
    flash: {
      authenticated: Boolean(process.env.DEFINITIVE_FLASH_API_KEY),
      maxLiveOrderUsd: MAX_LIVE_ORDER_USD,
      targetChain: 'base',
      supportedOrderTypes: ['bracket', 'take-profit', 'limit', 'twap'],
      mode: 'live',
    },
    uniswap: {
      authenticated: Boolean(process.env.UNISWAP_API_KEY),
      network: 'Ethereum Sepolia',
      sdkVersion: 'v3/v4 Gateway Routing',
      mode: 'testnet',
    },
    alchemy: {
      configured: Boolean(process.env.ALCHEMY_RPC_URL),
      mainnetUrl: 'https://eth-mainnet.g.alchemy.com/v2/...',
      sepoliaUrl: 'https://eth-sepolia.g.alchemy.com/v2/...',
      baseMainnetUrl: 'https://base-mainnet.g.alchemy.com/v2/...',
    },
  };

  return NextResponse.json(status);
}
