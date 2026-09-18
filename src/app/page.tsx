'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Play,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  CreditCard,
  Sliders,
  DollarSign,
  Cpu
} from 'lucide-react';
import type { FeedCycle, SystemStatus } from '@/types';

export default function AegisFeedPage() {
  const [feed, setFeed] = useState<FeedCycle[]>([
    {
      id: 'cycle-001',
      cycleNumber: 1,
      timestamp: '2026-09-18T12:00:00.000Z',
      scenarioName: 'System Bootstrap & Baseline Allocation',
      signal: {
        triggerType: 'manual_operator',
        triggerCondition: 'Operator Bootstrap Trigger: Initial Pool Range Set [2,500 - 2,800]',
        reasoning: 'Initializing initial liquidity bounds and setting up downside risk protection via Flash bracket order.',
        metric: 'ETH Reference Price',
        metricValue: '$2,642.50',
        threshold: '$2,500.00 - $2,800.00',
        timestamp: '12:00:00 PM',
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
        walletAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        spendCapUsd: 50,
        currentSpendUsd: 10.00,
        actionCostUsd: 10.00,
        remainingSpendUsd: 40.00,
        isAuthorized: true,
        signatureScheme: 'ECDSA secp256k1 (MPC 2-of-2 Threshold)',
        authLog: '[Dynamic:Server-Wallet-MPC] Authorized "Baseline Allocation" for $10.00. Session total: $10.00 / $50.00.',
        authTxHash: '0xauth829104fa8291',
      },
    },
  ]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('volatility_spike');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [spend, setSpend] = useState<{ spendCapUsd: number; currentSpendUsd: number; remainingUsd: number }>({
    spendCapUsd: 50,
    currentSpendUsd: 10,
    remainingUsd: 40,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial feed and status
  const loadData = async () => {
    try {
      const [feedRes, statusRes] = await Promise.all([
        fetch('/api/feed'),
        fetch('/api/status'),
      ]);

      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setFeed(feedData.feed || []);
        if (feedData.spend) setSpend(feedData.spend);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
    } catch (err) {
      console.error('Failed to load feed data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAgent = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/agent/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selectedScenario }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Agent trigger failed');
      } else {
        setFeed(prev => [data.cycle, ...prev]);
        if (data.spend) setSpend(data.spend);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFeed = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/agent/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFeed(data.feed);
        if (data.spend) setSpend(data.spend);
      }
    } catch (err) {
      console.error('Failed to reset:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const spendPercentage = Math.min(100, (spend.currentSpendUsd / spend.spendCapUsd) * 100);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Banner & Control Deck */}
      <header className="border-b border-slate-800 bg-[#0c1220]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Pitch */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Shield className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-mono">AEGIS</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                  Autonomous Agent
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Live Base + Sepolia
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Causal Execution: Agent Signal → Multi-Venue Execution (Uniswap + Flash) → Dynamic Authorized
              </p>
            </div>
          </div>

          {/* Spend Cap Gauge & Hard Safety Stop */}
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end text-xs text-slate-400 font-mono">
                <Lock className="h-3 w-3 text-sky-400" />
                <span>DYNAMIC SPEND CAP</span>
              </div>
              <div className="text-sm font-bold font-mono text-white">
                <span className="text-sky-400">${spend.currentSpendUsd.toFixed(2)}</span>
                <span className="text-slate-500"> / </span>
                <span>${spend.spendCapUsd.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Spend Progress Bar */}
            <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-500 ${
                  spendPercentage > 80
                    ? 'bg-rose-500 shadow-rose-500/50'
                    : spendPercentage > 50
                    ? 'bg-amber-400 shadow-amber-400/50'
                    : 'bg-sky-400 shadow-sky-400/50'
                }`}
                style={{ width: `${spendPercentage}%` }}
              />
            </div>

            <div className="border-l border-slate-800 pl-3">
              <div className="text-[10px] text-slate-500 font-mono">SAFETY CEILING</div>
              <div className="text-xs font-mono text-emerald-400 font-medium">Flash &lt; $20.00</div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="border-t border-slate-800/80 bg-slate-950/60 px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Trigger Scenario:</span>
              <select
                value={selectedScenario}
                onChange={e => setSelectedScenario(e.target.value)}
                disabled={loading}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              >
                <option value="volatility_spike">Volatility Spike (Tighten LP + Flash Bracket)</option>
                <option value="range_breakout">Range Breakout (Rebalance + Take Profit)</option>
                <option value="dex_arbitrage">Cross-Venue Arbitrage (Uniswap Swap)</option>
                <option value="x402_oracle_feed">x402 Volatility Oracle (HTTP 402 Flow)</option>
                <option value="manual_rebalance">Manual Operator Rebalance</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={triggerAgent}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition shadow-md shadow-sky-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
                <span>Run Agent Cycle</span>
              </button>

              <button
                onClick={resetFeed}
                disabled={loading}
                title="Reset feed to baseline"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Error Alert if Spend Cap or API abort happens */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 text-rose-200 text-sm font-mono animate-in fade-in duration-200">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Execution Safeguard Triggered</div>
              <div className="text-rose-300/80 text-xs mt-0.5">{errorMessage}</div>
            </div>
          </div>
        )}

        {/* 15-Second Judge Orientation Strip */}
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-sky-400 font-mono font-semibold mb-2">
            The Aegis Causal Chain (Three Connected Tracks)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">
                1
              </span>
              <div>
                <div className="font-semibold text-slate-200">Signal / Decision</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Autonomous agent senses price boundary / volatility triggers.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">
                2
              </span>
              <div>
                <div className="font-semibold text-slate-200">Multi-Venue Execution</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Uniswap AMM rebalance (<span className="text-amber-400">Sepolia</span>) + Definitive Flash Bracket (<span className="text-emerald-400">Base Mainnet</span>).
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">
                3
              </span>
              <div>
                <div className="font-semibold text-slate-200">Dynamic Wallet Authorization</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Server Wallet (2-of-2 MPC) signs EIP-712 within strictly enforced spend caps.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Feed Container */}
        <div className="space-y-12">
          {feed.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
              <Cpu className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <div className="text-slate-400 text-sm font-mono">No cycles recorded yet.</div>
              <button
                onClick={triggerAgent}
                className="mt-3 px-4 py-2 bg-sky-500 text-slate-950 font-bold text-xs rounded-lg"
              >
                Run First Decision Cycle
              </button>
            </div>
          ) : (
            feed.map((cycle, cycleIdx) => {
              const isFirst = cycleIdx === 0;
              const detailsOpen = Boolean(expandedDetails[cycle.id]);

              return (
                <article
                  key={cycle.id}
                  className="relative pl-6 md:pl-8 border-l-2 border-sky-500/40 pb-2"
                >
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-sky-500 ring-4 ring-[#080c14] flex items-center justify-center shadow-md shadow-sky-500/50">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>

                  {/* Cycle Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono text-xs font-bold border border-sky-500/20">
                        CYCLE #{cycle.cycleNumber}
                      </span>
                      <h2 className="text-base font-bold text-white tracking-tight">
                        {cycle.scenarioName}
                      </h2>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {new Date(cycle.timestamp).toLocaleTimeString()} UTC
                    </div>
                  </div>

                  {/* Causal Chain Vertical Flow Cards */}
                  <div className="space-y-3.5">
                    {/* STEP 1: SIGNAL / DECISION CARD */}
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                            1
                          </span>
                          <span className="text-xs font-mono font-semibold uppercase text-slate-300">
                            Signal &amp; Agent Reasoning
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {cycle.signal.timestamp}
                        </span>
                      </div>

                      {/* Prominent Plain-Language Reasoning */}
                      <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/20 mb-3">
                        <div className="text-[11px] uppercase tracking-wider text-sky-400 font-mono font-semibold mb-1">
                          Agent Thesis
                        </div>
                        <p className="text-sm font-medium text-slate-100 leading-snug">
                          &ldquo;{cycle.signal.reasoning}&rdquo;
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 rounded bg-slate-950/50 border border-slate-800/80">
                          <span className="text-slate-500 block text-[10px]">CONDITION</span>
                          <span className="text-slate-300">{cycle.signal.triggerCondition}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-950/50 border border-slate-800/80">
                          <span className="text-slate-500 block text-[10px]">METRIC VS THRESHOLD</span>
                          <span className="text-emerald-400 font-bold">{cycle.signal.metricValue}</span>
                          <span className="text-slate-500 text-[10px] ml-1.5">(Target: {cycle.signal.threshold})</span>
                        </div>
                      </div>
                    </div>

                    {/* STEP 2: MULTI-VENUE EXECUTION (UNISWAP & FLASH) */}
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                            2
                          </span>
                          <span className="text-xs font-mono font-semibold uppercase text-slate-300">
                            Multi-Venue Execution
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {cycle.executions.length} Legs Dispatched
                        </span>
                      </div>

                      {/* Two Execution Legs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cycle.executions.map(leg => {
                          const isMainnet = leg.network === 'mainnet';
                          const isUniswap = leg.venue === 'Uniswap';

                          return (
                            <div
                              key={leg.id}
                              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                                isMainnet
                                  ? 'bg-[#0d1624] border-emerald-500/30'
                                  : 'bg-[#151320] border-amber-500/30'
                              }`}
                            >
                              <div>
                                {/* Header with Unmissable Network Badge */}
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                                    <Zap className="h-3.5 w-3.5 text-sky-400" />
                                    {leg.venue}
                                  </span>

                                  {/* CRITICAL NETWORK BADGE */}
                                  <span
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                      isMainnet
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    }`}
                                  >
                                    ● {leg.networkName}
                                  </span>
                                </div>

                                <div className="text-sm font-semibold text-slate-200 mb-2">
                                  {leg.orderType}
                                </div>

                                {/* Amounts */}
                                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-xs font-mono mb-2.5">
                                  <div className="flex justify-between text-slate-400 text-[11px]">
                                    <span>IN:</span>
                                    <span className="text-slate-200 font-semibold">{leg.amountIn}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400 text-[11px] mt-0.5">
                                    <span>OUT / TARGET:</span>
                                    <span className="text-emerald-400 font-semibold">{leg.amountOut}</span>
                                  </div>
                                </div>

                                {/* Advanced Bracket details if Flash */}
                                {leg.bracketDetails && (
                                  <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-[11px] font-mono mb-2.5 space-y-0.5">
                                    <div className="text-emerald-400 font-bold">Attached Bracket:</div>
                                    <div className="flex justify-between text-slate-300">
                                      <span>Take Profit:</span>
                                      <span className="text-emerald-300 font-bold">{leg.bracketDetails.takeProfitPrice}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                      <span>Stop Loss:</span>
                                      <span className="text-rose-300 font-bold">{leg.bracketDetails.stopLossPrice}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Explorer Link & Truncated Hash */}
                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                                <span className="text-slate-500">TX HASH:</span>
                                <a
                                  href={leg.explorerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition underline underline-offset-2"
                                >
                                  <span>{leg.txHash.substring(0, 10)}...{leg.txHash.substring(leg.txHash.length - 6)}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* STEP 3: WALLET AUTHORIZATION CARD */}
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs">
                            3
                          </span>
                          <span className="text-xs font-mono font-semibold uppercase text-slate-300">
                            Dynamic Wallet Authorization
                          </span>
                        </div>
                        {/* Pattern Label */}
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {cycle.authorization.walletPattern}
                        </span>
                      </div>

                      {/* Explicit Spend Cap Display */}
                      <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 font-mono text-xs">
                        <div>
                          <span className="text-slate-400">Authorized spend cap: </span>
                          <span className="text-white font-bold">${cycle.authorization.spendCapUsd.toFixed(2)}</span>
                          <span className="text-slate-500"> — This action: </span>
                          <span className="text-emerald-400 font-bold">${cycle.authorization.actionCostUsd.toFixed(2)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Remaining: <span className="text-sky-300 font-bold">${cycle.authorization.remainingSpendUsd.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Execution Log */}
                      <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                        <div className="truncate mr-2">
                          <span className="text-emerald-400 mr-1.5">✓</span>
                          <span>{cycle.authorization.authLog}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {cycle.authorization.signatureScheme.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* OPTIONAL STEP 4: TIER 2 DATA PURCHASE (X402) FLOURISH */}
                    {cycle.x402 && (
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-purple-500/30 hover:border-purple-500/50 transition">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-[10px]">
                              4
                            </span>
                            <span className="text-[11px] font-mono uppercase font-semibold text-purple-300">
                              Machine Payment (x402 HTTP 402 Flow)
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            PAYMENT-SIGNATURE Verified
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 font-mono flex flex-wrap items-center justify-between gap-2">
                          <span>
                            Resource: <strong className="text-white">{cycle.x402.resource}</strong> (${cycle.x402.costUsd.toFixed(2)} {cycle.x402.currency})
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Sig: {cycle.x402.paymentSignature}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Expandable Cryptographic & Raw Telemetry Drawer */}
                    <div className="pt-1">
                      <button
                        onClick={() => toggleDetails(cycle.id)}
                        className="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                      >
                        {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        <span>{detailsOpen ? 'Hide' : 'Inspect'} EIP-712 Payloads &amp; Wallet Signatures</span>
                      </button>

                      {detailsOpen && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-3 animate-in fade-in duration-150">
                          <div>
                            <div className="text-slate-400 text-[11px] mb-1 font-semibold text-sky-400">
                              Funder Wallet (Dynamic Server MPC):
                            </div>
                            <div className="p-2 rounded bg-slate-900 text-slate-300 break-all select-all">
                              {cycle.authorization.walletAddress}
                            </div>
                          </div>

                          {cycle.executions.find(e => e.rawEip712) && (
                            <div>
                              <div className="text-slate-400 text-[11px] mb-1 font-semibold text-emerald-400">
                                Definitive Flash EIP-712 Order Typed Data (Signed by Dynamic):
                              </div>
                              <pre className="p-2 rounded bg-slate-900 text-slate-300 overflow-x-auto text-[10px] leading-relaxed">
                                {JSON.stringify(cycle.executions.find(e => e.rawEip712)?.rawEip712, null, 2)}
                              </pre>
                            </div>
                          )}

                          {cycle.executions.find(e => e.userSignature) && (
                            <div>
                              <div className="text-slate-400 text-[11px] mb-1 font-semibold text-sky-400">
                                ECDSA User Signature (Flash Order Authentication):
                              </div>
                              <div className="p-2 rounded bg-slate-900 text-slate-300 break-all select-all text-[11px]">
                                {cycle.executions.find(e => e.userSignature)?.userSignature}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            Aegis — Built for Runtime Agent Week (Uniswap • Dynamic • Definitive Flash)
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">● Base Mainnet Live</span>
            <span className="text-amber-400">● Sepolia Testnet Live</span>
            <span className="text-sky-400">● Dynamic MPC Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
