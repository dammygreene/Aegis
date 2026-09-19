'use client';

import React, { useState, useEffect } from 'react';
import {
  Broadcast,
  Lightning,
  ArrowSquareOut,
  CaretDown,
  CaretUp,
  ArrowClockwise,
  Warning,
  Play,
  ShieldCheck,
  LockSimple,
  Stack,
  SlidersHorizontal,
  Cpu,
  CheckCircle,
} from '@phosphor-icons/react';
import type { FeedCycle, SystemStatus } from '@/types';
import { cn } from '@/lib/cn';
import { CausalChainStrip } from '@/components/CausalChainStrip';
import { StatusPill } from '@/components/StatusPill';

/**
 * Aegis Feed Screen — Vault Palette (Gunmetal + Brass).
 * Zero multi-stop gradients. Flat color surfaces with Phosphor icons (bold weight).
 */

const CHAIN_STEPS = [
  {
    index: 1,
    title: 'Signal / Decision',
    tone: 'signal' as const,
    detail: 'Agent senses price boundary or volatility triggers and forms an actionable thesis.',
  },
  {
    index: 2,
    title: 'Multi-Venue Execution',
    tone: 'live' as const,
    detail: (
      <>
        Uniswap AMM rebalance (<span className="text-[#8A7B4E] font-mono">Sepolia Testnet</span>) + Definitive Flash
        Bracket (<span className="text-[#3E7A5B] font-mono font-semibold">Base Mainnet</span>).
      </>
    ),
  },
  {
    index: 3,
    title: 'Dynamic Wallet Authorization',
    tone: 'vault' as const,
    detail: 'Server Wallet (2-of-2 MPC) verifies spend policy and signs EIP-712 orders within caps.',
  },
];

/**
 * SVG Radial Arc Gauge for Dynamic Spend Cap
 * Uses flat Vault colors: track #2A2E35, active arc #CBA135 (or #9C3B2E if danger).
 * Zero linear/radial multi-stop gradients.
 */
function RadialSpendGauge({
  currentSpend,
  spendCap,
  percentage,
}: {
  currentSpend: number;
  spendCap: number;
  percentage: number;
}) {
  const radius = 46;
  const strokeWidth = 7;
  const totalArc = 2 * Math.PI * radius * 0.75; // ≈ 216.77
  const strokeDashoffset = totalArc * (1 - Math.min(100, Math.max(0, percentage)) / 100);

  const isDanger = percentage > 80;
  const arcColor = isDanger ? '#9C3B2E' : '#CBA135';

  return (
    <div className="relative flex flex-col items-center justify-center p-3">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full -rotate-90 transform"
        >
          {/* Track Background (270 deg flat arc) */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#2A2E35"
            strokeWidth={strokeWidth}
            strokeDasharray={`${totalArc} 999`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(-45 60 60)"
          />

          {/* Active Flat Color Arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${totalArc} 999`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-45 60 60)"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="label text-[9px] text-[#9B9690] uppercase tracking-widest">
            SPENT
          </div>
          <div className="num font-display text-2xl font-bold tracking-tight text-[#EDE7DD] mt-0.5">
            ${currentSpend.toFixed(2)}
          </div>
          <div className="num text-[11px] font-medium text-[#9B9690]">
            / ${spendCap.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#14161A] border border-[#2A2E35]">
        <LockSimple size={12} weight="bold" className="text-[#CBA135]" />
        <span className="num text-[10.5px] font-semibold text-[#EDE7DD]">
          {percentage.toFixed(0)}% Cap Utilized
        </span>
      </div>
    </div>
  );
}

export default function AegisFeedPage() {
  const [feed, setFeed] = useState<FeedCycle[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('volatility_spike');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [spend, setSpend] = useState<{ spendCapUsd: number; currentSpendUsd: number; remainingUsd: number }>({
    spendCapUsd: 50,
    currentSpendUsd: 0,
    remainingUsd: 50,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <div className="relative min-h-screen bg-[#14161A] text-[#EDE7DD] selection:bg-[#CBA135]/20 selection:text-[#CBA135]">
      {/* Background: single-color soft glow at low opacity + subtle texture */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[160px] left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-ambient-top" />
        <div className="ambient-grid absolute inset-0 opacity-30" />
      </div>

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-[#2A2E35] bg-[#14161A]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="Aegis Icon"
              width={22}
              height={22}
            />
            <span className="font-display text-sm font-bold tracking-wider text-[#EDE7DD]">
              AEGIS
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1C1F24] text-[#9B9690] border border-[#2A2E35]">
              VAULT-RUNTIME
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill tone="live">Base Mainnet</StatusPill>
            <StatusPill tone="staged">Sepolia</StatusPill>
            <StatusPill tone="signal">2-of-2 MPC</StatusPill>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION & TRUST COCKPIT ───────────────────────────── */}
      <section className="relative z-10 border-b border-[#2A2E35] bg-[#14161A] pt-8 pb-10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Column: Brand & Value Thesis (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="flex items-center gap-4 mb-4">
                <div className="aegis-shield-mark flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C1F24] border border-[#CBA135]/40 shadow-panel overflow-hidden shrink-0">
                  <img
                    src="/favicon.png"
                    alt="Aegis Emblem"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#EDE7DD]">
                      AEGIS
                    </h1>
                    <span className="px-2 py-0.5 rounded-md bg-[#1C1F24] border border-[#CBA135]/40 text-[10px] font-mono font-bold text-[#CBA135] uppercase">
                      Autonomous Risk Agent
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#9B9690] font-medium">
                    Autonomous Liquidity &amp; Risk Mitigation Architecture
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-[#EDE7DD]/90 max-w-xl">
                Senses volatility triggers, executes across{' '}
                <span className="text-[#3E7A5B] font-semibold">Base Mainnet (Flash)</span> and{' '}
                <span className="text-[#8A7B4E] font-semibold">Sepolia (Uniswap)</span>, strictly governed by{' '}
                <span className="text-[#CBA135] font-semibold">Dynamic 2-of-2 MPC Server Wallets</span>.
              </p>

              {/* Status Signals */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1C1F24] border border-[#2A2E35] text-xs text-[#9B9690]">
                  <span className="h-2 w-2 rounded-full bg-[#3E7A5B]" />
                  Dynamic MPC: <strong className="text-[#EDE7DD] font-mono">{status?.dynamic.mode || 'Active'}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1C1F24] border border-[#2A2E35] text-xs text-[#9B9690]">
                  <span className="h-2 w-2 rounded-full bg-[#3E7A5B]" />
                  Flash: <strong className="text-[#EDE7DD] font-mono">{status?.flash.mode || 'Live'}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1C1F24] border border-[#2A2E35] text-xs text-[#9B9690]">
                  <span className="h-2 w-2 rounded-full bg-[#8A7B4E]" />
                  Uniswap: <strong className="text-[#EDE7DD] font-mono">{status?.uniswap.mode || 'Sepolia'}</strong>
                </span>
              </div>
            </div>

            {/* Right Hero Column: THE TRUST COCKPIT (5 cols) */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-5">
              {/* Radial Arc Gauge Card */}
              <div className="relative w-full sm:w-auto flex-1 rounded-2xl border border-[#2A2E35] bg-[#1C1F24] p-4 shadow-panel-lg flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="label text-[#9B9690]">Dynamic Spend Cap</span>
                  <span className="label text-[#CBA135] font-mono">2-OF-2 MPC</span>
                </div>

                <RadialSpendGauge
                  currentSpend={spend.currentSpendUsd}
                  spendCap={spend.spendCapUsd}
                  percentage={spendPercentage}
                />

                <div className="mt-2 text-[10.5px] text-center text-[#9B9690] font-mono">
                  Enforced at cryptographic signing layer
                </div>
              </div>

              {/* Safety Ceiling Monument */}
              <div className="relative w-full sm:w-auto flex-1 rounded-2xl border border-[#3E7A5B] bg-[#1C1F24] p-4 shadow-panel-lg flex flex-col justify-between self-stretch">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="label text-[#3E7A5B] font-bold">Safety Ceiling</span>
                    <ShieldCheck size={18} weight="bold" className="text-[#3E7A5B]" />
                  </div>
                  
                  <div className="label text-[10px] text-[#9B9690] mb-1">HARD STOP GATE</div>
                  <div className="num font-display text-2xl sm:text-3xl font-bold text-[#EDE7DD] tracking-tight">
                    &lt; $20.00
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2A2E35] text-[11px] leading-snug text-[#9B9690]">
                  Definitive Flash orders hard-capped per cycle to safeguard treasury.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMAND DOCK (Interactive Controller) ────────────────────────────── */}
      <div className="sticky top-[49px] z-30 border-b border-[#2A2E35] bg-[#14161A]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex min-w-[260px] flex-1 items-center gap-2.5">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-[#9B9690]">
              <SlidersHorizontal size={15} weight="bold" className="text-[#CBA135]" />
              <span className="label text-[#EDE7DD] font-bold">Scenario</span>
            </span>
            <div className="relative flex-1">
              <select
                value={selectedScenario}
                onChange={e => setSelectedScenario(e.target.value)}
                disabled={loading}
                className={cn(
                  'aegis-select-trigger focus-ring w-full appearance-none rounded-xl border border-[#2A2E35] bg-[#1C1F24] py-2.5 pl-3 pr-9',
                  'text-xs font-medium text-[#EDE7DD] transition-colors duration-200 hover:border-[#CBA135]/40',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                <option value="volatility_spike">Volatility Spike (Tighten LP + Flash Bracket)</option>
                <option value="range_breakout">Range Breakout (Rebalance + Take Profit)</option>
                <option value="dex_arbitrage">Cross-Venue Arbitrage (Uniswap Swap)</option>
                <option value="x402_oracle_feed">x402 Volatility Oracle (HTTP 402 Flow)</option>
                <option value="manual_rebalance">Manual Operator Rebalance</option>
              </select>
              <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9690]" />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Primary Action Button — Flat Brass #CBA135 */}
            <button
              onClick={triggerAgent}
              disabled={loading}
              className={cn(
                'aegis-btn-trigger focus-ring flex items-center gap-2 rounded-xl px-5 py-2.5',
                'bg-[#CBA135] text-[#14161A] text-xs font-bold shadow-panel-sm',
                'transition-all duration-200 hover:bg-[#D8AF43] active:translate-y-0',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="chain-step-loading-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#14161A]" />
                  <span className="chain-step-loading-2 inline-flex h-2.5 w-2.5 rounded-full bg-[#14161A]" />
                  <span className="chain-step-loading-3 inline-flex h-2.5 w-2.5 rounded-full bg-[#14161A]" />
                </span>
              ) : (
                <Play size={14} weight="bold" />
              )}
              <span>{loading ? 'Executing Agent Cycle…' : 'Run Agent Cycle'}</span>
            </button>

            <button
              onClick={resetFeed}
              disabled={loading}
              title="Reset feed to baseline"
              className={cn(
                'focus-ring flex items-center gap-1.5 rounded-xl border border-[#2A2E35] bg-[#1C1F24] px-3.5 py-2.5',
                'text-xs text-[#9B9690] transition-all duration-200',
                'hover:border-[#CBA135]/40 hover:text-[#EDE7DD] disabled:opacity-50'
              )}
            >
              <ArrowClockwise size={14} weight="bold" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[#9C3B2E] bg-[#1C1F24] p-4 text-[#EDE7DD] shadow-panel">
            <Warning size={20} weight="bold" className="mt-0.5 shrink-0 text-[#9C3B2E]" />
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold tracking-tight text-[#EDE7DD]">
                Execution Safeguard Triggered
              </div>
              <div className="hash mt-1 text-xs leading-relaxed text-[#9B9690]">
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        {/* ── THE CAUSAL CHAIN: ASYMMETRICAL CHEVRON STAGE ──────────────────── */}
        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-[#EDE7DD]">
                The Aegis Causal Architecture
              </h2>
              <p className="text-xs text-[#9B9690] mt-0.5">
                Every trade is an unbroken, verifiable causal chain
              </p>
            </div>
            <span className="label text-[#9B9690] font-mono">15-Second Overview</span>
          </div>

          <CausalChainStrip steps={CHAIN_STEPS} />
        </section>

        {/* ── EDITORIAL CHRONOLOGY TIMELINE ──────────────────────────────────── */}
        <section className="space-y-12">
          <div className="border-b border-[#2A2E35] pb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight text-[#EDE7DD] flex items-center gap-2">
              <Broadcast size={18} weight="bold" className="text-[#CBA135]" />
              Autonomous Decision History
            </h2>
            <span className="label text-[#9B9690] font-mono">
              {feed.length} {feed.length === 1 ? 'Cycle' : 'Cycles'} Recorded
            </span>
          </div>

          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A2E35] p-16 text-center">
              <Cpu size={36} weight="bold" className="text-[#9B9690] mb-3" />
              <div className="text-sm font-medium text-[#9B9690]">No agent cycles recorded yet.</div>
              <button
                onClick={triggerAgent}
                className="mt-4 rounded-xl bg-[#CBA135] px-5 py-2.5 text-xs font-bold text-[#14161A] shadow-panel-sm"
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
                  className="relative pl-7 sm:pl-10 animate-card-in"
                  style={{ animationDelay: `${Math.min(cycleIdx, 4) * 60}ms` }}
                >
                  {/* Left-Rail Chronology Line with Flat Node Marker */}
                  <div
                    aria-hidden
                    className="absolute left-[13px] sm:left-[17px] top-4 bottom-0 w-[2px] bg-[#2A2E35]"
                  />
                  
                  {/* Chevron Node Marker */}
                  <div className="absolute left-[5px] sm:left-[9px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#CBA135] bg-[#14161A]">
                    <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                      <path d="M2 3L5 6L8 3" stroke="#CBA135" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Cycle Header: Display Typography */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="label font-mono px-2.5 py-1 rounded-md border border-[#CBA135]/40 bg-[#1C1F24] text-[#CBA135] font-bold">
                        CYCLE #{cycle.cycleNumber.toString().padStart(3, '0')}
                      </span>
                      <h3 className="font-display text-lg font-bold tracking-tight text-[#EDE7DD]">
                        {cycle.scenarioName}
                      </h3>
                    </div>
                    <div className="num font-mono text-xs text-[#9B9690] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#9B9690]" />
                      {new Date(cycle.timestamp).toLocaleTimeString()} UTC
                    </div>
                  </div>

                  {/* ── AGENT THESIS (Editorial Pull-Quote) ───────────────────── */}
                  <div className="mb-6 relative overflow-hidden rounded-2xl border border-[#2A2E35] bg-[#1C1F24] p-5 pl-6 shadow-panel">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#CBA135]" />
                    <div className="label text-[#CBA135] font-bold mb-1.5 flex items-center gap-1.5">
                      <Broadcast size={13} weight="bold" />
                      Agent Thesis &amp; Risk Assessment
                    </div>
                    <p className="font-display text-base sm:text-lg font-medium leading-snug tracking-tight text-[#EDE7DD] italic">
                      &ldquo;{cycle.signal.reasoning}&rdquo;
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#2A2E35] flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="label text-[#9B9690]">Condition:</span>{' '}
                        <span className="text-[#EDE7DD] font-medium">{cycle.signal.triggerCondition}</span>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="label text-[#9B9690]">Metric vs Target:</span>
                        <span className="num font-bold text-[#CBA135]">{cycle.signal.metricValue}</span>
                        <span className="text-[10px] text-[#9B9690] font-mono">({cycle.signal.threshold})</span>
                      </div>
                    </div>
                  </div>

                  {/* ── MULTI-VENUE EXECUTION DIVERGENCE ──────────────────────── */}
                  <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="label text-[#9B9690] font-bold flex items-center gap-1.5">
                        <Lightning size={14} weight="bold" className="text-[#3E7A5B]" />
                        Multi-Venue Dispatched Legs ({cycle.executions.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {cycle.executions.map(leg => {
                        const isLive = leg.network === 'mainnet';

                        if (isLive) {
                          // ── LIVE MAINNET: Definitive Flash (Flat Obsidian) ──
                          return (
                            <div
                              key={leg.id}
                              className="obsidian-panel rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-[#3E7A5B]" />
                                    <span className="font-display font-bold text-[#EDE7DD] tracking-tight text-sm">
                                      {leg.venue}
                                    </span>
                                  </div>
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#14161A] border border-[#3E7A5B] text-[10.5px] font-mono font-bold text-[#3E7A5B] flex items-center gap-1">
                                    LIVE MAINNET · REAL FUNDS
                                  </span>
                                </div>

                                <div className="text-xs font-semibold text-[#EDE7DD] mb-3 flex items-center justify-between">
                                  <span>{leg.orderType}</span>
                                  <span className="label text-[#9B9690]">{leg.pair}</span>
                                </div>

                                {/* Live Trade Values */}
                                <div className="rounded-xl bg-[#14161A] border border-[#2A2E35] p-3 mb-3">
                                  <div className="flex items-baseline justify-between text-xs">
                                    <span className="text-[#9B9690]">Order Input</span>
                                    <span className="num font-bold text-[#EDE7DD]">{leg.amountIn}</span>
                                  </div>
                                  <div className="mt-1.5 flex items-baseline justify-between text-xs border-t border-[#2A2E35] pt-1.5">
                                    <span className="text-[#9B9690]">Target Output</span>
                                    <span className="num font-bold text-[#3E7A5B] text-sm">{leg.amountOut}</span>
                                  </div>
                                </div>

                                {/* Visual Bracket Range Bar */}
                                {leg.bracketDetails && (
                                  <div className="rounded-xl border border-[#3E7A5B]/40 bg-[#14161A] p-3 mb-3">
                                    <div className="label text-[10px] text-[#3E7A5B] font-bold mb-2">
                                      Definitive Bracket Protection
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-center">
                                      <div className="p-1.5 rounded bg-[#181B20] border border-[#9C3B2E]/50">
                                        <div className="text-[9px] text-[#9C3B2E] font-mono">STOP LOSS</div>
                                        <div className="num text-xs font-bold text-[#9C3B2E]">
                                          {leg.bracketDetails.stopLossPrice}
                                        </div>
                                      </div>
                                      <div className="p-1.5 rounded bg-[#181B20] border border-[#2A2E35]">
                                        <div className="text-[9px] text-[#9B9690] font-mono">ENTRY</div>
                                        <div className="num text-xs font-bold text-[#EDE7DD]">
                                          {leg.bracketDetails.entryPrice}
                                        </div>
                                      </div>
                                      <div className="p-1.5 rounded bg-[#181B20] border border-[#3E7A5B]/50">
                                        <div className="text-[9px] text-[#3E7A5B] font-mono">TAKE PROFIT</div>
                                        <div className="num text-xs font-bold text-[#3E7A5B]">
                                          {leg.bracketDetails.takeProfitPrice}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="pt-3 border-t border-[#2A2E35] flex items-center justify-between text-xs">
                                <span className="label text-[#9B9690]">Tx Hash</span>
                                <a
                                  href={leg.explorerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hash flex items-center gap-1.5 text-[#3E7A5B] hover:text-[#EDE7DD] transition-colors"
                                >
                                  <span>
                                    {leg.txHash.slice(0, 8)}…{leg.txHash.slice(-6)}
                                  </span>
                                  <ArrowSquareOut size={13} weight="bold" />
                                </a>
                              </div>
                            </div>
                          );
                        } else {
                          // ── STAGED TESTNET: Uniswap (Blueprint Wireframe) ──
                          return (
                            <div
                              key={leg.id}
                              className="blueprint-grid rounded-2xl border border-dashed border-[#8A7B4E] bg-[#14161A] p-5 flex flex-col justify-between relative overflow-hidden"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-[#8A7B4E]" />
                                    <span className="font-display font-bold text-[#EDE7DD] tracking-tight text-sm">
                                      {leg.venue}
                                    </span>
                                  </div>
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#1C1F24] border border-[#8A7B4E] text-[10.5px] font-mono font-bold text-[#8A7B4E]">
                                    STAGED SANDBOX · SEPOLIA
                                  </span>
                                </div>

                                <div className="text-xs font-medium text-[#EDE7DD] mb-3 flex items-center justify-between">
                                  <span>{leg.orderType}</span>
                                  <span className="label text-[#9B9690]">{leg.pair}</span>
                                </div>

                                {/* Simulation Readout */}
                                <div className="rounded-xl bg-[#1C1F24] border border-dashed border-[#8A7B4E]/40 p-3 mb-3">
                                  <div className="flex items-baseline justify-between text-xs">
                                    <span className="text-[#9B9690]">Liquidity In</span>
                                    <span className="num font-bold text-[#EDE7DD]">{leg.amountIn}</span>
                                  </div>
                                  <div className="mt-1.5 flex items-baseline justify-between text-xs border-t border-[#2A2E35] pt-1.5">
                                    <span className="text-[#9B9690]">Liquidity Out</span>
                                    <span className="num font-bold text-[#8A7B4E]">{leg.amountOut}</span>
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl border border-[#2A2E35] bg-[#1C1F24] text-[11px] text-[#9B9690] leading-relaxed mb-3">
                                  Simulated AMM pool rebalance for range concentration without capital risk.
                                </div>
                              </div>

                              <div className="pt-3 border-t border-[#2A2E35] flex items-center justify-between text-xs">
                                <span className="label text-[#9B9690]">Sepolia Tx</span>
                                <a
                                  href={leg.explorerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hash flex items-center gap-1.5 text-[#8A7B4E] hover:text-[#EDE7DD] transition-colors"
                                >
                                  <span>
                                    {leg.txHash.slice(0, 8)}…{leg.txHash.slice(-6)}
                                  </span>
                                  <ArrowSquareOut size={13} weight="bold" />
                                </a>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>

                  {/* ── DYNAMIC WALLET AUTHORIZATION CARD ─────────────────────── */}
                  <div className="mb-4 rounded-2xl border border-[#8C5A2B] bg-[#1C1F24] p-5 shadow-panel">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <LockSimple size={16} weight="bold" className="text-[#CBA135]" />
                        <span className="label text-[#CBA135] font-bold">
                          Dynamic Wallet Authorization
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#14161A] border border-[#8C5A2B] text-[10px] font-mono text-[#CBA135]">
                        {cycle.authorization.walletPattern}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-[#14161A] border border-[#2A2E35]">
                        <div className="label text-[#9B9690]">Spend Cap</div>
                        <div className="num font-display text-lg font-bold text-[#EDE7DD] mt-0.5">
                          ${cycle.authorization.spendCapUsd.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#14161A] border border-[#2A2E35]">
                        <div className="label text-[#9B9690]">Action Cost</div>
                        <div className="num font-display text-lg font-bold text-[#CBA135] mt-0.5">
                          ${cycle.authorization.actionCostUsd.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#14161A] border border-[#2A2E35]">
                        <div className="label text-[#9B9690]">Remaining Policy</div>
                        <div className="num font-display text-lg font-bold text-[#8C5A2B] mt-0.5">
                          ${cycle.authorization.remainingSpendUsd.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl border border-[#2A2E35] bg-[#14161A] flex items-center justify-between text-xs">
                      <div className="hash text-[#9B9690] truncate flex items-center gap-1.5">
                        <CheckCircle size={14} weight="bold" className="text-[#3E7A5B] shrink-0" />
                        <span>{cycle.authorization.authLog}</span>
                      </div>
                      <span className="label font-mono text-[#CBA135] shrink-0 ml-2">
                        {cycle.authorization.signatureScheme.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* ── EXPANDABLE AUDIT LOG ─────────────────────────────────── */}
                  <div className="pt-1">
                    <button
                      onClick={() => toggleDetails(cycle.id)}
                      className="focus-ring flex items-center gap-1.5 text-xs text-[#9B9690] hover:text-[#EDE7DD] transition-colors"
                    >
                      {detailsOpen ? <CaretUp size={13} weight="bold" /> : <CaretDown size={13} weight="bold" />}
                      <Stack size={13} weight="bold" />
                      <span>{detailsOpen ? 'Hide' : 'Inspect'} EIP-712 typed order data &amp; cryptographic signatures</span>
                    </button>

                    {detailsOpen && (
                      <div className="mt-3 rounded-2xl border border-[#2A2E35] bg-[#1C1F24] p-4 space-y-3 animate-fade-in text-xs">
                        <div>
                          <div className="label text-[#CBA135] mb-1">Server Wallet Address</div>
                          <div className="hash select-all break-all rounded-lg border border-[#2A2E35] bg-[#14161A] p-2.5 text-[#EDE7DD]">
                            {cycle.authorization.walletAddress}
                          </div>
                        </div>

                        {cycle.executions.find(e => e.rawEip712) && (
                          <div>
                            <div className="label text-[#3E7A5B] mb-1">
                              Flash Order EIP-712 Payload (Signed by Dynamic)
                            </div>
                            <pre className="hash overflow-x-auto rounded-lg border border-[#2A2E35] bg-[#14161A] p-2.5 text-[11px] text-[#EDE7DD]">
                              {JSON.stringify(
                                cycle.executions.find(e => e.rawEip712)?.rawEip712,
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[#2A2E35] bg-[#14161A] py-8 text-xs text-[#9B9690]">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Aegis" width={18} height={18} />
            <span>Aegis — Autonomous Liquidity &amp; Risk Architecture</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#3E7A5B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3E7A5B]" />
              Base Mainnet
            </span>
            <span className="flex items-center gap-1.5 text-[#8A7B4E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8A7B4E]" />
              Sepolia Testnet
            </span>
            <span className="flex items-center gap-1.5 text-[#CBA135]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#CBA135]" />
              Dynamic 2-of-2 MPC
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
