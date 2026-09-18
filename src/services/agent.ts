import { dynamicWallet, MAX_AGENT_SPEND_CAP_USD } from './dynamic';
import { uniswapService } from './uniswap';
import { flashService, MAX_LIVE_ORDER_USD } from './flash';
import { x402Service } from './x402';
import type { FeedCycle, SignalStepData, ExecutionLeg, AuthorizationStepData, X402StepData } from '@/types';

export type ScenarioType =
  | 'volatility_spike'
  | 'range_breakout'
  | 'dex_arbitrage'
  | 'manual_rebalance'
  | 'x402_oracle_feed';

export class AutonomousAgentService {
  private static instance: AutonomousAgentService;
  private feedHistory: FeedCycle[] = [];
  private cycleCounter = 0;

  private constructor() {
    this.seedInitialHistory();
  }

  public static getInstance(): AutonomousAgentService {
    if (!AutonomousAgentService.instance) {
      AutonomousAgentService.instance = new AutonomousAgentService();
    }
    return AutonomousAgentService.instance;
  }

  /**
   * Pre-seeds demo history so the feed has rich initial evidence when loaded
   */
  private seedInitialHistory() {
    this.feedHistory = [
      {
        id: 'cycle-001',
        cycleNumber: 1,
        timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        scenarioName: 'System Bootstrap & Baseline Allocation',
        signal: {
          triggerType: 'manual_operator',
          triggerCondition: 'Operator Bootstrap Trigger: Initial Pool Range Set [2,500 - 2,800]',
          reasoning: 'Initializing initial liquidity bounds and setting up downside risk protection via Flash bracket order.',
          metric: 'ETH Reference Price',
          metricValue: '$2,642.50',
          threshold: '$2,500.00 - $2,800.00',
          timestamp: new Date(Date.now() - 1000 * 60 * 14).toLocaleTimeString(),
        },
        executions: [
          {
            id: 'uni-seed-1',
            venue: 'Uniswap',
            orderType: 'Liquidity Rebalance',
            network: 'testnet',
            networkName: 'Ethereum Sepolia',
            chainId: 11155111,
            pair: 'WETH/USDC',
            side: 'buy',
            amountIn: '0.005 WETH',
            amountOut: '13.25 USDC',
            txHash: '0x9c4fe182049d18fa7b49e2908849b28a9b1c098df900192384a8b7c6d5e4f3a2',
            explorerUrl: 'https://sepolia.etherscan.io/tx/0x9c4fe182049d18fa7b49e2908849b28a9b1c098df900192384a8b7c6d5e4f3a2',
            status: 'filled',
          },
          {
            id: 'flash-seed-1',
            venue: 'Definitive Flash',
            orderType: 'Bracket Order',
            network: 'mainnet',
            networkName: 'Base Mainnet',
            chainId: 8453,
            pair: 'ETH/USDC',
            side: 'buy',
            amountIn: '10.00 USDC',
            amountOut: '0.0037 WETH',
            txHash: '0x3a7e5892ac192837bc940817290bca8192837461928475918237461928374619',
            explorerUrl: 'https://basescan.org/tx/0x3a7e5892ac192837bc940817290bca8192837461928475918237461928374619',
            status: 'active_bracket',
            bracketDetails: {
              entryPrice: '$2,642.50',
              takeProfitPrice: '$3,150.00',
              stopLossPrice: '$2,350.00',
              salt: '0x7e819b1093847591028374619283746100000000000000000000000000000000',
              signedMaxFromAmount: '0.0041',
            },
          },
        ],
        authorization: {
          walletPattern: 'Server Wallet (2-of-2 MPC)',
          walletAddress: dynamicWallet.getWalletAddress(),
          spendCapUsd: 50,
          currentSpendUsd: 10.00,
          actionCostUsd: 10.00,
          remainingSpendUsd: 40.00,
          isAuthorized: true,
          signatureScheme: 'ECDSA secp256k1 (MPC 2-of-2 Threshold)',
          authLog: `[Dynamic:Server-Wallet-MPC] Authorized "Baseline Allocation" for $10.00. Session total: $10.00 / $50.00.`,
          authTxHash: '0xauth829104fa8291',
        },
      },
    ];
    this.cycleCounter = 1;
  }

  /**
   * Executes a full autonomous agent decision cycle
   */
  public async runCycle(scenario: ScenarioType = 'volatility_spike'): Promise<FeedCycle> {
    this.cycleCounter++;
    const now = new Date();
    const funderAddress = dynamicWallet.getWalletAddress();

    let signalData: SignalStepData;
    let flashAmountUsd = 12.50; // Strictly under MAX_LIVE_ORDER_USD (20)
    let takeProfitPrice = 3200;
    let stopLossPrice = 2400;
    let uniActionType: 'Uniswap Swap' | 'Liquidity Rebalance' = 'Liquidity Rebalance';
    let uniAmount = '0.004';
    let uniTokenIn = 'WETH';
    let uniTokenOut = 'USDC';
    let includeX402 = false;
    let scenarioTitle = 'Market Scenario';

    // 1. Evaluate scenario and form autonomous reasoning
    switch (scenario) {
      case 'volatility_spike':
        scenarioTitle = 'Volatility Spike Mitigation';
        signalData = {
          triggerType: 'volatility_spike',
          triggerCondition: 'Realized Volatility spiked above 58% annualized (Current: 64.2%)',
          reasoning: 'Volatility rising, rebalancing toward tighter range on Uniswap and hedging downside with Flash Bracket Order.',
          metric: 'Annualized Volatility (HV-30)',
          metricValue: '64.2%',
          threshold: '> 50.0%',
          timestamp: now.toLocaleTimeString(),
        };
        flashAmountUsd = 14.00;
        takeProfitPrice = 3000;
        stopLossPrice = 2500;
        uniActionType = 'Liquidity Rebalance';
        uniAmount = '0.005';
        break;

      case 'range_breakout':
        scenarioTitle = 'Upper Range Breakout';
        signalData = {
          triggerType: 'range_breakout',
          triggerCondition: 'Spot ETH crossed upper LP tick limit ($2,780 > $2,750 boundary)',
          reasoning: 'Spot price exceeding upper concentrated bin; reallocating idle USDC into dynamic take-profit on Base.',
          metric: 'Spot ETH Tick Offset',
          metricValue: '+32 ticks',
          threshold: '> +20 ticks',
          timestamp: now.toLocaleTimeString(),
        };
        flashAmountUsd = 15.00;
        takeProfitPrice = 3350;
        stopLossPrice = 2620;
        uniActionType = 'Uniswap Swap';
        uniAmount = '15.00';
        uniTokenIn = 'USDC';
        uniTokenOut = 'WETH';
        break;

      case 'dex_arbitrage':
        scenarioTitle = 'Cross-Venue Spread Arbitrage';
        signalData = {
          triggerType: 'price_divergence',
          triggerCondition: 'Pool divergence detected: Sepolia AMM ($2,682) vs Base Mainnet ($2,650)',
          reasoning: 'Arb delta at 1.2% exceeds gas hurdle. Rebalancing inventory via Uniswap while locking spread via Flash.',
          metric: 'Cross-Venue Price Spread',
          metricValue: '1.21%',
          threshold: '> 0.75%',
          timestamp: now.toLocaleTimeString(),
        };
        flashAmountUsd = 10.00;
        takeProfitPrice = 2950;
        stopLossPrice = 2550;
        uniActionType = 'Uniswap Swap';
        uniAmount = '0.003';
        uniTokenIn = 'WETH';
        uniTokenOut = 'USDC';
        break;

      case 'x402_oracle_feed':
        scenarioTitle = 'x402 Micro-Payment & Oracle Ingestion';
        includeX402 = true;
        signalData = {
          triggerType: 'x402_oracle',
          triggerCondition: 'Autonomous Ingestion of High-Frequency Volatility Oracle (HTTP 402)',
          reasoning: 'Premium volatility oracle queried: agent authorized $0.05 USDC x402 payment, verified high skew, triggered hedge.',
          metric: 'Oracle Signal Confidence',
          metricValue: '94.8%',
          threshold: '> 85.0%',
          timestamp: now.toLocaleTimeString(),
        };
        flashAmountUsd = 12.00;
        takeProfitPrice = 3100;
        stopLossPrice = 2480;
        uniActionType = 'Liquidity Rebalance';
        uniAmount = '0.004';
        break;

      case 'manual_rebalance':
      default:
        scenarioTitle = 'Manual Operator Rebalance';
        signalData = {
          triggerType: 'manual_operator',
          triggerCondition: 'Manual Operator Execution Trigger received from dashboard',
          reasoning: 'Manual rebalance commanded: syncing testnet pool state and deploying mainnet bracket order.',
          metric: 'Operator Action',
          metricValue: 'FORCE_REBALANCE',
          threshold: 'MANUAL',
          timestamp: now.toLocaleTimeString(),
        };
        flashAmountUsd = 11.50;
        takeProfitPrice = 3050;
        stopLossPrice = 2520;
        uniActionType = 'Liquidity Rebalance';
        uniAmount = '0.004';
        break;
    }

    // 2. Step 4 (if enabled): x402 Machine Payment
    let x402Step: X402StepData | undefined = undefined;
    if (includeX402) {
      x402Step = await x402Service.executePaymentFlow('eth-usdc-skew-hf');
    }

    // 3. Step 3: Dynamic Wallet Spend Cap Authorization
    const totalActionCost = flashAmountUsd; // Only real capital at risk is on Flash
    const authorization: AuthorizationStepData = await dynamicWallet.authorizeAction(
      `Rebalance Cycle #${this.cycleCounter} (${scenarioTitle})`,
      totalActionCost
    );

    // 4. Step 2a: Uniswap Execution Leg (Testnet)
    const uniLeg = await uniswapService.executeSwap({
      actionType: uniActionType,
      tokenInSymbol: uniTokenIn,
      tokenOutSymbol: uniTokenOut,
      amountIn: uniAmount,
      recipient: funderAddress,
    });

    // 5. Step 2b: Definitive Flash Bracket Order Leg (Base Mainnet)
    const flashLeg = await flashService.executeBracketOrder({
      side: 'buy',
      qtyUsd: flashAmountUsd,
      funderAddress,
      takeProfitPriceUsd: takeProfitPrice,
      stopLossPriceUsd: stopLossPrice,
    });

    const newCycle: FeedCycle = {
      id: `cycle-${Date.now()}`,
      cycleNumber: this.cycleCounter,
      timestamp: now.toISOString(),
      scenarioName: scenarioTitle,
      signal: signalData,
      executions: [uniLeg, flashLeg],
      authorization,
      x402: x402Step,
    };

    // Prepend to feed so most recent is first
    this.feedHistory.unshift(newCycle);

    return newCycle;
  }

  public getFeedHistory(): FeedCycle[] {
    return this.feedHistory;
  }

  public resetFeed() {
    dynamicWallet.resetSpend();
    this.seedInitialHistory();
  }
}

export const agentService = AutonomousAgentService.getInstance();
