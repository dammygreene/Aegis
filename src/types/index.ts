export type NetworkType = 'mainnet' | 'testnet';

export type StepType = 'signal' | 'execution' | 'authorization' | 'x402_payment';

export interface SignalStepData {
  triggerType: 'volatility_spike' | 'range_breakout' | 'price_divergence' | 'manual_operator' | 'x402_oracle';
  triggerCondition: string;
  reasoning: string;
  metric: string;
  metricValue: string;
  threshold: string;
  timestamp: string;
}

export interface ExecutionLeg {
  id: string;
  venue: 'Uniswap' | 'Definitive Flash';
  orderType: 'Uniswap Swap' | 'Liquidity Rebalance' | 'Bracket Order' | 'Take Profit';
  network: NetworkType;
  networkName: string; // e.g. "Base Mainnet" or "Sepolia Testnet"
  chainId: number;
  pair: string;
  side: 'buy' | 'sell';
  amountIn: string;
  amountOut: string;
  txHash: string;
  explorerUrl: string;
  status: 'filled' | 'pending' | 'active_bracket';
  bracketDetails?: {
    entryPrice: string;
    takeProfitPrice: string;
    stopLossPrice: string;
    salt: string;
    signedMaxFromAmount: string;
  };
  rawEip712?: any;
  userSignature?: string;
}

export interface AuthorizationStepData {
  walletPattern: 'Delegated Access' | 'Server Wallet (2-of-2 MPC)';
  walletAddress: string;
  spendCapUsd: number;
  currentSpendUsd: number;
  actionCostUsd: number;
  remainingSpendUsd: number;
  isAuthorized: boolean;
  signatureScheme: string;
  authLog: string;
  authTxHash?: string;
}

export interface X402StepData {
  resource: string;
  costUsd: number;
  currency: string;
  paymentRecipient: string;
  paymentSignature: string;
  status: 'HTTP 402 Required' | 'Paid & Verified';
  dataPayloadSummary: string;
}

export interface FeedCycle {
  id: string;
  cycleNumber: number;
  timestamp: string;
  scenarioName: string;
  signal: SignalStepData;
  executions: ExecutionLeg[];
  authorization: AuthorizationStepData;
  x402?: X402StepData;
}

export interface SystemStatus {
  dynamic: {
    authenticated: boolean;
    environmentId: string;
    walletAddress: string;
    walletPattern: string;
    spendCapUsd: number;
    spentUsd: number;
    mode: 'live' | 'sandboxed';
  };
  flash: {
    authenticated: boolean;
    maxLiveOrderUsd: number;
    targetChain: string;
    supportedOrderTypes: string[];
    mode: 'live' | 'sandboxed';
  };
  uniswap: {
    authenticated: boolean;
    network: string;
    sdkVersion: string;
    mode: 'live' | 'sandboxed';
  };
  alchemy: {
    configured: boolean;
    mainnetUrl: string;
    sepoliaUrl: string;
    baseMainnetUrl: string;
  };
}
