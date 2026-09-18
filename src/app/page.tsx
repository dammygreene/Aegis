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
  Cpu,
} from 'lucide-react';
import type { FeedCycle, SystemStatus } from '@/types';
import { cn } from '@/lib/cn';
import { CausalChainStrip } from '@/components/CausalChainStrip';
import { NetworkBadge, networkSurfaceClass } from '@/components/NetworkBadge';
import { StatusPill } from '@/components/StatusPill';

/**
 * Aegis feed screen — styling pass per aegis-ui-styling-prompt.md.
 *
 * Layout/visual changes only. The data flow (feed + status fetch, trigger,
 * reset, detail drawer) and every rendered value are unchanged from the
 * functional build; nothing here calls an API the page did not already call.
 */

const CHAIN_STEPS = [
  {
    index: 1,
    title: 'Signal / Decision',
    tone: 'signal' as const,
    detail: 'Agent senses a price boundary or volatility trigger and forms a thesis.',
  },
  {
    index: 2,
    title: 'Multi-Venue Execution',
    tone: 'live' as const,
    detail: (
      <>
        Uniswap AMM rebalance (<span className="text-amber-300">Sepolia</span>) + Definitive Flash
        Bracket (<span className="text-emerald-300">Base Mainnet</span>).
      </>
    ),
  },
  {
    index: 3,
    title: 'Dynamic Wallet Authorization',
    tone: 'vault' as const,
    detail: 'Server Wallet (2-of-2 MPC) signs EIP-712 strictly inside the enforced spend cap.',
  },
];

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
          explorerUrl: 'https://basescan.org/tx/0x3a7e5892ac192837bc940817290bca81928374619284759182374619',
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
        currentSpendUsd: 10.0,
        actionCostUsd: 10.0,
        remainingSpendUsd: 40.0,
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
  const capTone =
    spendPercentage > 80 ? 'alarm' : spendPercentage > 50 ? 'warn' : 'nominal';
  const capToneClass =
    capTone === 'alarm'
      ? 'from-rose-500 to-rose-400'
      : capTone === 'warn'
      ? 'from-amber-500 to-amber-400'
      : 'from-sky-500 to-emerald-400';
  const capValueClass =
    capTone === 'alarm'
      ? 'text-rose-300'
      : capTone === 'warn'
      ? 'text-amber-300'
      : 'text-sky-300';

  return (
    <div className="relative min-h-screen bg-ink-900 text-slate-100 selection:bg-sky-500/30 selection:text-sky-100">
      {/* Ambient depth: soft top glows + faint engineering grid, masked out low */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-ambient-top" />
        <div className="ambient-grid absolute inset-0 opacity-70" />
      </div>

      {/* ── Top banner & trust deck ───────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Brand — quiet. It is context, not the headline. */}
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/25 bg-gradient-to-br from-sky-400 to-indigo-600 shadow-glow-signal">
              <Shield className="h-5 w-5 stroke-[2.5] text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[22px] font-bold leading-none tracking-tight text-white">
                  AEGIS
                </h1>
                <StatusPill tone="signal">Autonomous Agent</StatusPill>
                <StatusPill tone="live">Base Mainnet</StatusPill>
                <StatusPill tone="staged">Sepolia</StatusPill>
              </div>
              <p className="mt-1.5 max-w-md text-[11.5px] leading-snug text-slate-500">
                Causal execution: agent signal → multi-venue execution (Uniswap + Flash) → Dynamic
                authorization
              </p>
              {status && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <StatusPill>
                    Dynamic MPC · {status.dynamic.mode}
                  </StatusPill>
                  <StatusPill>Flash · {status.flash.mode}</StatusPill>
                  <StatusPill>Uniswap · {status.uniswap.mode}</StatusPill>
                </div>
              )}
            </div>
          </div>

          {/* Trust deck — the spend cap and safety ceiling are the loudest things
              in the header: they are the whole "unattended but bounded" story. */}
          <div className="panel-raised flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Lock className="h-3 w-3 text-sky-400" />
                <span className="label">Dynamic spend cap</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={cn('num font-display text-3xl font-bold leading-none', capValueClass)}>
                  ${spend.currentSpendUsd.toFixed(2)}
                </span>
                <span className="num font-display text-lg font-semibold leading-none text-slate-500">
                  / ${spend.spendCapUsd.toFixed(2)}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="h-2 w-28 overflow-hidden rounded-full border border-hairline bg-ink-950 shadow-inset sm:w-32">
                  <div
                    className={cn(
                      'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-spring',
                      capToneClass
                    )}
                    style={{ width: `${spendPercentage}%` }}
                  />
                </div>
                <span className="num text-[11px] font-semibold text-slate-400">
                  {spendPercentage.toFixed(0)}% used
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-hairline sm:h-14 sm:w-px sm:min-w-[1px]" />

            <div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="label">Safety ceiling</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-sm text-slate-500">Flash &lt;</span>
                <span className="num font-display text-3xl font-bold leading-none text-emerald-300">
                  $20.00
                </span>
              </div>
              <div className="mt-2.5 text-[11px] leading-snug text-slate-500">
                Hard-coded gate, independent of agent logic
              </div>
            </div>
          </div>
        </div>

        {/* ── Command deck ────────────────────────────────────────────────── */}
        <div className="border-t border-hairline bg-ink-900/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex min-w-[280px] flex-1 items-center gap-2.5">
              <span className="flex items-center gap-1.5 whitespace-nowrap text-slate-500">
                <Sliders className="h-3.5 w-3.5 text-sky-400/80" />
                <span className="label">Trigger scenario</span>
              </span>
              <div className="relative flex-1">
                <select
                  value={selectedScenario}
                  onChange={e => setSelectedScenario(e.target.value)}
                  disabled={loading}
                  className={cn(
                    'focus-ring w-full appearance-none rounded-lg border border-hairlineStrong bg-ink-850 py-2 pl-3 pr-9',
                    'text-[12.5px] text-slate-200 transition-colors duration-200 hover:border-sky-400/40',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  <option value="volatility_spike">Volatility Spike (Tighten LP + Flash Bracket)</option>
                  <option value="range_breakout">Range Breakout (Rebalance + Take Profit)</option>
                  <option value="dex_arbitrage">Cross-Venue Arbitrage (Uniswap Swap)</option>
                  <option value="x402_oracle_feed">x402 Volatility Oracle (HTTP 402 Flow)</option>
                  <option value="manual_rebalance">Manual Operator Rebalance</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={triggerAgent}
                disabled={loading}
                className={cn(
                  'focus-ring flex items-center gap-2 rounded-lg bg-gradient-to-b from-sky-400 to-sky-500 px-5 py-2.5',
                  'text-[13px] font-semibold text-slate-950 shadow-key-primary',
                  'transition-all duration-300 ease-spring hover:from-sky-300 hover:to-sky-400 hover:-translate-y-[1px]',
                  'active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'
                )}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                <span>Run Agent Cycle</span>
              </button>

              <button
                onClick={resetFeed}
                disabled={loading}
                title="Reset feed to baseline"
                className={cn(
                  'focus-ring flex items-center gap-1.5 rounded-lg border border-hairlineStrong bg-ink-850 px-3.5 py-2.5',
                  'text-[12.5px] text-slate-400 transition-all duration-300 ease-spring',
                  'hover:border-slate-500/40 hover:text-slate-200 disabled:opacity-50'
                )}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main feed ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-5xl px-5 py-10">
        {/* Execution safeguard alert */}
        {errorMessage && (
          <div className="panel-raised mb-8 flex items-start gap-3 border-rose-500/40 bg-rose-950/30 p-4 text-rose-100 shadow-glow-staged animate-fade-in">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold tracking-tight">
                Execution Safeguard Triggered
              </div>
              <div className="hash mt-1 text-[11.5px] leading-relaxed text-rose-200/80">
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        {/* 15-second judge orientation strip — one connected chain */}
        <section className="panel mb-10 p-5">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-sm font-semibold tracking-tight text-slate-100">
              The Aegis Causal Chain
            </h2>
            <span className="label whitespace-nowrap text-slate-500">Three connected tracks</span>
          </div>
          <CausalChainStrip steps={CHAIN_STEPS} />
        </section>

        {/* Timeline feed */}
        <div className="space-y-14">
          {feed.length === 0 ? (
            <div className="panel flex flex-col items-center border-dashed py-20 text-center">
              <Cpu className="mb-3 h-8 w-8 text-slate-600" />
              <div className="text-sm text-slate-400">No cycles recorded yet.</div>
              <button
                onClick={triggerAgent}
                className="focus-ring mt-5 rounded-lg bg-gradient-to-b from-sky-400 to-sky-500 px-5 py-2.5 text-[13px] font-semibold text-slate-950 shadow-key-primary transition-all duration-300 ease-spring hover:-translate-y-[1px]"
              >
                Run First Decision Cycle
              </button>
            </div>
          ) : (
            feed.map((cycle, cycleIdx) => {
              const detailsOpen = Boolean(expandedDetails[cycle.id]);

              return (
                <article
                  key={cycle.id}
                  className="relative pl-7 md:pl-9 animate-card-in"
                  style={{ animationDelay: `${Math.min(cycleIdx, 4) * 60}ms` }}
                >
                  {/* Feed-level chronology rail (distinct from the causal rail below) */}
                  <div aria-hidden className="absolute left-[7px] top-2 bottom-0 w-px bg-hairlineStrong md:left-[11px]" />
                  <div className="absolute -left-[1px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-sky-400/50 bg-ink-900 shadow-glow-signal md:-left-[1px]">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  </div>

                  {/* Cycle header */}
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="label hash rounded-md border border-sky-500/25 bg-sky-500/[0.08] px-2 py-[3px] text-sky-300">
                        Cycle #{cycle.cycleNumber}
                      </span>
                      <h2 className="font-display text-lg font-semibold tracking-tight text-white">
                        {cycle.scenarioName}
                      </h2>
                    </div>
                    <div className="hash text-[11px] text-slate-500">
                      {new Date(cycle.timestamp).toLocaleTimeString()} UTC
                    </div>
                  </div>

                  {/* Causal chain: one rail threading steps 1 → 2 → 3 (→ 4) */}
                  <div className="relative space-y-4">
                    <div
                      aria-hidden
                      className="absolute bottom-12 left-[19px] top-7 w-[2px] rounded-full bg-rail-signal opacity-80"
                    />

                    {/* ── Step 1 · Signal & agent reasoning ───────────────── */}
                    <div className="relative flex gap-3.5">
                      <span className="chain-node z-10 h-10 w-10 shrink-0 border border-sky-400/50 bg-sky-500/15 text-[13px] text-sky-300 shadow-glow-signal">
                        1
                      </span>
                      <div className="panel flex-1 p-4 transition-colors duration-300 ease-spring hover:border-sky-400/25">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="label flex items-center gap-1.5 text-slate-300">
                            <Activity className="h-3.5 w-3.5 text-sky-400" />
                            Signal &amp; agent reasoning
                          </span>
                          <span className="hash text-[11px] text-slate-500">
                            {cycle.signal.timestamp}
                          </span>
                        </div>

                        {/* Agent Thesis — the distinctive feature, given real presence */}
                        <blockquote className="relative mb-4 overflow-hidden rounded-xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.10] via-ink-850/60 to-ink-850/60 px-4 py-3.5 pl-5 shadow-panel">
                          <span
                            aria-hidden
                            className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-sky-400 to-indigo-500"
                          />
                          <span
                            aria-hidden
                            className="pointer-events-none absolute -right-1 -top-4 select-none font-display text-6xl leading-none text-sky-400/10"
                          >
                            &rdquo;
                          </span>
                          <div className="label mb-1.5 text-sky-400">Agent thesis</div>
                          <p className="font-display text-[15px] font-medium leading-snug tracking-tight text-slate-50">
                            &ldquo;{cycle.signal.reasoning}&rdquo;
                          </p>
                        </blockquote>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <div className="well px-3 py-2.5">
                            <div className="label text-slate-500">Condition</div>
                            <div className="mt-1 text-[12px] leading-snug text-slate-300">
                              {cycle.signal.triggerCondition}
                            </div>
                          </div>
                          <div className="well px-3 py-2.5">
                            <div className="label text-slate-500">Metric vs threshold</div>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="num font-display text-lg font-bold text-emerald-300">
                                {cycle.signal.metricValue}
                              </span>
                              <span className="hash text-[10.5px] text-slate-500">
                                target {cycle.signal.threshold}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Step 2 · Multi-venue execution ──────────────────── */}
                    <div className="relative flex gap-3.5">
                      <span className="chain-node z-10 h-10 w-10 shrink-0 border border-emerald-400/50 bg-emerald-500/15 text-[13px] text-emerald-300 shadow-glow-live">
                        2
                      </span>
                      <div className="panel flex-1 p-4 transition-colors duration-300 ease-spring hover:border-emerald-400/25">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                          <span className="label flex items-center gap-1.5 text-slate-300">
                            <Zap className="h-3.5 w-3.5 text-emerald-400" />
                            Multi-venue execution
                          </span>
                          <span className="hash text-[11px] text-slate-500">
                            {cycle.executions.length} legs dispatched
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                          {cycle.executions.map(leg => {
                            const isLive = leg.network === 'mainnet';

                            return (
                              <div
                                key={leg.id}
                                className={cn(
                                  'flex flex-col justify-between rounded-xl border bg-panel-raise p-4 transition-all duration-300 ease-spring',
                                  'hover:-translate-y-[2px]',
                                  networkSurfaceClass(leg.network)
                                )}
                              >
                                <div>
                                  <div className="mb-3 flex items-start justify-between gap-2">
                                    <span className="font-display text-[13px] font-semibold tracking-tight text-white">
                                      {leg.venue}
                                    </span>
                                    <NetworkBadge network={leg.network} networkName={leg.networkName} />
                                  </div>

                                  <div className="mb-3 flex items-center gap-2">
                                    <span className="text-[13px] font-medium text-slate-200">
                                      {leg.orderType}
                                    </span>
                                    <span className="label text-slate-600">{leg.pair}</span>
                                  </div>

                                  <div className="well mb-3 px-3 py-2.5">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="label text-slate-500">In</span>
                                      <span className="num text-[13px] font-semibold text-slate-200">
                                        {leg.amountIn}
                                      </span>
                                    </div>
                                    <div className="mt-1.5 flex items-baseline justify-between gap-2">
                                      <span className="label text-slate-500">Out / target</span>
                                      <span
                                        className={cn(
                                          'num text-[13px] font-semibold',
                                          isLive ? 'text-emerald-300' : 'text-sky-300'
                                        )}
                                      >
                                        {leg.amountOut}
                                      </span>
                                    </div>
                                  </div>

                                  {leg.bracketDetails && (
                                    <div className="mb-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5">
                                      <div className="label mb-1.5 text-emerald-300">
                                        Attached bracket
                                      </div>
                                      <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-[11.5px] text-slate-400">Take profit</span>
                                        <span className="num text-[12.5px] font-semibold text-emerald-300">
                                          {leg.bracketDetails.takeProfitPrice}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex items-baseline justify-between gap-2">
                                        <span className="text-[11.5px] text-slate-400">Stop loss</span>
                                        <span className="num text-[12.5px] font-semibold text-rose-300">
                                          {leg.bracketDetails.stopLossPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2 border-t border-hairline pt-2.5">
                                  <span className="label text-slate-600">Tx hash</span>
                                  <a
                                    href={leg.explorerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={cn(
                                      'focus-ring hash flex items-center gap-1.5 rounded text-[11px] underline decoration-dotted underline-offset-4 transition-colors',
                                      isLive
                                        ? 'text-emerald-300 hover:text-emerald-200'
                                        : 'text-sky-300 hover:text-sky-200'
                                    )}
                                  >
                                    <span>
                                      {leg.txHash.substring(0, 10)}…
                                      {leg.txHash.substring(leg.txHash.length - 6)}
                                    </span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ── Step 3 · Dynamic wallet authorization ───────────── */}
                    <div className="relative flex gap-3.5">
                      <span className="chain-node z-10 h-10 w-10 shrink-0 border border-indigo-400/50 bg-indigo-500/15 text-[13px] text-indigo-300 shadow-glow-vault">
                        3
                      </span>
                      <div className="panel flex-1 p-4 transition-colors duration-300 ease-spring hover:border-indigo-400/25">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="label flex items-center gap-1.5 text-slate-300">
                            <Lock className="h-3.5 w-3.5 text-indigo-300" />
                            Dynamic wallet authorization
                          </span>
                          <span className="label hash rounded-md border border-indigo-500/25 bg-indigo-500/[0.08] px-2 py-[3px] text-indigo-300">
                            {cycle.authorization.walletPattern}
                          </span>
                        </div>

                        {/* Spend cap is the trust signal — key numbers in the display face */}
                        <div className="mb-3 grid grid-cols-3 gap-2.5">
                          <div className="well px-3 py-2.5">
                            <div className="label text-slate-500">Authorized cap</div>
                            <div className="num mt-1 font-display text-xl font-bold text-slate-100">
                              ${cycle.authorization.spendCapUsd.toFixed(2)}
                            </div>
                          </div>
                          <div className="well px-3 py-2.5">
                            <div className="label text-slate-500">This action</div>
                            <div className="num mt-1 font-display text-xl font-bold text-emerald-300">
                              ${cycle.authorization.actionCostUsd.toFixed(2)}
                            </div>
                          </div>
                          <div className="well px-3 py-2.5">
                            <div className="label text-slate-500">Remaining</div>
                            <div className="num mt-1 font-display text-xl font-bold text-sky-300">
                              ${cycle.authorization.remainingSpendUsd.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-ink-950/70 px-3 py-2.5">
                          <div className="hash min-w-0 truncate text-[11px] text-slate-400">
                            <span className="mr-1.5 text-emerald-400">✓</span>
                            {cycle.authorization.authLog}
                          </div>
                          <span className="label hash shrink-0 text-slate-500">
                            {cycle.authorization.signatureScheme.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Step 4 (optional) · x402 machine payment ─────────── */}
                    {cycle.x402 && (
                      <div className="relative flex gap-3.5">
                        <span className="chain-node z-10 h-10 w-10 shrink-0 border border-purple-400/45 bg-purple-500/12 text-[13px] text-purple-300">
                          4
                        </span>
                        <div className="flex-1 rounded-2xl border border-purple-500/25 bg-purple-500/[0.05] bg-panel-raise p-4 transition-colors duration-300 ease-spring hover:border-purple-400/40">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="label flex items-center gap-1.5 text-purple-200">
                              <CreditCard className="h-3.5 w-3.5 text-purple-300" />
                              Machine payment · x402 HTTP 402 flow
                            </span>
                            <span className="label hash rounded-md border border-purple-500/25 bg-purple-500/10 px-2 py-[3px] text-purple-300">
                              Payment-signature verified
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-300">
                            <span>
                              Resource:{' '}
                              <strong className="font-display font-semibold text-white">
                                {cycle.x402.resource}
                              </strong>{' '}
                              <span className="num text-purple-200">
                                (${cycle.x402.costUsd.toFixed(2)} {cycle.x402.currency})
                              </span>
                            </span>
                            <span className="hash text-[10.5px] text-slate-500">
                              sig {cycle.x402.paymentSignature}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Raw cryptographic evidence — behind an expand, never the headline */}
                    <div className="relative flex gap-3.5">
                      <span aria-hidden className="h-10 w-10 shrink-0" />
                      <div className="flex-1 pt-1">
                        <button
                          onClick={() => toggleDetails(cycle.id)}
                          className="focus-ring flex items-center gap-1.5 rounded-md px-1 py-1 text-[11.5px] text-slate-500 transition-colors duration-200 hover:text-slate-300"
                        >
                          {detailsOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          <Layers className="h-3.5 w-3.5" />
                          <span>
                            {detailsOpen ? 'Hide' : 'Inspect'} EIP-712 payloads &amp; wallet
                            signatures
                          </span>
                        </button>

                        {detailsOpen && (
                          <div className="panel mt-3 space-y-4 p-4 animate-fade-in">
                            <div>
                              <div className="label mb-1.5 text-sky-400">
                                Funder wallet (Dynamic Server MPC)
                              </div>
                              <div className="hash select-all break-all rounded-lg border border-hairline bg-ink-950/80 p-2.5 text-[11.5px] text-slate-300">
                                {cycle.authorization.walletAddress}
                              </div>
                            </div>

                            {cycle.executions.find(e => e.rawEip712) && (
                              <div>
                                <div className="label mb-1.5 text-emerald-400">
                                  Definitive Flash EIP-712 order typed data (signed by Dynamic)
                                </div>
                                <pre className="hash overflow-x-auto rounded-lg border border-hairline bg-ink-950/80 p-2.5 text-[10.5px] leading-relaxed text-slate-300">
                                  {JSON.stringify(
                                    cycle.executions.find(e => e.rawEip712)?.rawEip712,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            )}

                            {cycle.executions.find(e => e.userSignature) && (
                              <div>
                                <div className="label mb-1.5 text-sky-400">
                                  ECDSA user signature (Flash order authentication)
                                </div>
                                <div className="hash select-all break-all rounded-lg border border-hairline bg-ink-950/80 p-2.5 text-[11px] text-slate-300">
                                  {cycle.executions.find(e => e.userSignature)?.userSignature}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Direction of causality, restated between cycles */}
                  <div
                    aria-hidden
                    className="mt-5 flex items-center gap-2 pl-[19px] text-slate-700 md:pl-[23px]"
                  >
                    <ArrowRight className="h-3 w-3" />
                    <span className="label text-slate-700">Chain complete</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-hairline bg-ink-950/80 py-7">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 text-[11.5px] text-slate-500 md:flex-row">
          <div>Aegis — built for Runtime Agent Week (Uniswap · Dynamic · Definitive Flash)</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300/90">Base Mainnet · live</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-amber-300/90">Sepolia · staged</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span className="text-sky-300/90">Dynamic MPC</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
