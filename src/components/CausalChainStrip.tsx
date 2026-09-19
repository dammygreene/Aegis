'use client';

import React from 'react';
import { Broadcast, Lightning, LockSimple, ShieldCheck } from '@phosphor-icons/react';

export type ChainStep = {
  index: number;
  title: string;
  detail: React.ReactNode;
  tone: 'signal' | 'live' | 'vault';
};

/**
 * BrandChevronConduit — Structural flow conduit shaped like the Aegis dual-chevron emblem.
 * Uses flat colors: primary brass (#CBA135) and secondary bronze (#8C5A2B). Zero gradients.
 */
function ChevronConduit({ orientation = 'horizontal' }: { orientation?: 'horizontal' | 'vertical' }) {
  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col items-center justify-center py-2 my-1">
        <svg
          viewBox="0 0 40 24"
          fill="none"
          className="w-9 h-5"
        >
          <path
            d="M6 4L20 18L34 4"
            stroke="#CBA135"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 4L20 12L28 4"
            stroke="#8C5A2B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col items-center justify-center self-center px-1 shrink-0">
      <svg
        viewBox="0 0 24 48"
        fill="none"
        className="w-6 h-11"
      >
        <path
          d="M4 6L18 24L4 42"
          stroke="#CBA135"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 14L14 24L4 34"
          stroke="#8C5A2B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Structural Causal Chain:
 * Asymmetrical chevron-interlocked flow rendered in flat Vault palette (gunmetal + brass).
 * - Node 1: Compact Sensory Trigger (Signal & Thesis)
 * - Node 2: Dominant Execution Engine (Centerpiece)
 * - Node 3: Cryptographic Trust Gate (Dynamic MPC 2-of-2)
 */
export function CausalChainStrip({ steps }: { steps: ChainStep[] }) {
  const signalStep = steps[0];
  const execStep = steps[1];
  const vaultStep = steps[2];

  return (
    <div className="w-full">
      {/* Desktop & Tablet: Asymmetric Chevron Cascade */}
      <div className="hidden lg:flex items-stretch gap-3 w-full">
        {/* ── Node 1: Sensory Trigger (Compact, Radar-Sensory) ── */}
        <div className="flex-[0.85] min-w-[240px] relative rounded-2xl border border-[#2A2E35] bg-[#1C1F24] p-5 shadow-panel flex flex-col justify-between group hover:border-[#CBA135]/40 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#14161A] text-[#CBA135] border border-[#2A2E35]">
                  <Broadcast size={15} weight="bold" />
                </span>
                <span className="label text-[#CBA135]">STAGE 01 · SENSORY</span>
              </div>
              <span className="num text-[11px] font-mono text-[#9B9690]">REALTIME</span>
            </div>

            <h3 className="font-display text-base font-bold text-[#EDE7DD] tracking-tight">
              {signalStep?.title || 'Signal & Thesis'}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#9B9690]">
              {signalStep?.detail}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2A2E35] flex items-center justify-between text-[11px]">
            <span className="text-[#9B9690] font-mono">Sensory Trigger</span>
            <span className="text-[#CBA135] font-mono font-medium">Auto-Triggered</span>
          </div>
        </div>

        {/* Chevron Conduit 1 */}
        <ChevronConduit orientation="horizontal" />

        {/* ── Node 2: Multi-Venue Execution (The Dominant Centerpiece) ── */}
        <div className="flex-[1.4] relative rounded-2xl border border-[#3E7A5B] bg-[#1C1F24] p-5 shadow-panel-lg flex flex-col justify-between group transition-all duration-200">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#14161A] text-[#3E7A5B] border border-[#3E7A5B]/50">
                  <Lightning size={15} weight="bold" />
                </span>
                <span className="label text-[#3E7A5B] tracking-wider">STAGE 02 · EXECUTION ENGINE</span>
              </div>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#14161A] border border-[#3E7A5B]/40 text-[10px] font-mono text-[#3E7A5B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3E7A5B]" />
                DUAL VENUE
              </span>
            </div>

            <h3 className="font-display text-lg font-bold text-[#EDE7DD] tracking-tight">
              {execStep?.title || 'Multi-Venue Execution'}
            </h3>
            <div className="mt-2 text-xs leading-relaxed text-[#EDE7DD]/90">
              {execStep?.detail}
            </div>
          </div>

          {/* Dual Venue Sub-channels */}
          <div className="mt-4 pt-3 border-t border-[#2A2E35] grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#14161A] border border-[#3E7A5B]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#3E7A5B] uppercase">Live Mainnet</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#3E7A5B]" />
              </div>
              <div className="mt-1 font-display font-semibold text-[#EDE7DD]">Definitive Flash</div>
              <div className="text-[10.5px] text-[#9B9690]">Base Mainnet · Real USD</div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#14161A] border border-dashed border-[#8A7B4E]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#8A7B4E] uppercase">Staged Sandbox</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#8A7B4E]" />
              </div>
              <div className="mt-1 font-display font-semibold text-[#EDE7DD]">Uniswap V4</div>
              <div className="text-[10.5px] text-[#9B9690]">Sepolia · Liquidity Pool</div>
            </div>
          </div>
        </div>

        {/* Chevron Conduit 2 */}
        <ChevronConduit orientation="horizontal" />

        {/* ── Node 3: Cryptographic Vault Capsule (Dynamic MPC 2-of-2) ── */}
        <div className="flex-[0.95] min-w-[260px] relative rounded-2xl border border-[#8C5A2B] bg-[#1C1F24] p-5 shadow-panel flex flex-col justify-between group hover:border-[#CBA135]/40 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#14161A] text-[#CBA135] border border-[#8C5A2B]">
                  <LockSimple size={15} weight="bold" />
                </span>
                <span className="label text-[#CBA135]">STAGE 03 · TRUST GATE</span>
              </div>
              <span className="label text-[#8C5A2B] font-mono">2-OF-2 MPC</span>
            </div>

            <h3 className="font-display text-base font-bold text-[#EDE7DD] tracking-tight">
              {vaultStep?.title || 'Dynamic Wallet Authorization'}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#9B9690]">
              {vaultStep?.detail}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2A2E35]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[#9B9690] font-medium flex items-center gap-1.5">
                <ShieldCheck size={14} weight="bold" className="text-[#CBA135]" />
                Dynamic Enforced Cap
              </span>
              <span className="num font-bold text-[#CBA135]">$50.00 Max</span>
            </div>
            <div className="text-[10px] text-[#9B9690]">EIP-712 Threshold Signature Gate</div>
          </div>
        </div>
      </div>

      {/* Mobile: Vertical Stack with Downward Conduits */}
      <div className="lg:hidden flex flex-col gap-1 w-full">
        {/* Mobile Step 1 */}
        <div className="relative rounded-2xl border border-[#2A2E35] bg-[#1C1F24] p-4 shadow-panel">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#14161A] text-[#CBA135] border border-[#2A2E35]">
                <Broadcast size={13} weight="bold" />
              </span>
              <span className="label text-[#CBA135]">STAGE 01 · SIGNAL</span>
            </div>
            <span className="num text-[10px] font-mono text-[#9B9690]">REALTIME</span>
          </div>
          <h3 className="font-display text-sm font-bold text-[#EDE7DD] tracking-tight">
            {signalStep?.title}
          </h3>
          <p className="mt-1.5 text-xs text-[#9B9690] leading-snug">
            {signalStep?.detail}
          </p>
        </div>

        <ChevronConduit orientation="vertical" />

        {/* Mobile Step 2 */}
        <div className="relative rounded-2xl border border-[#3E7A5B] bg-[#1C1F24] p-4 shadow-panel-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#14161A] text-[#3E7A5B] border border-[#3E7A5B]">
                <Lightning size={13} weight="bold" />
              </span>
              <span className="label text-[#3E7A5B]">STAGE 02 · MULTI-VENUE EXECUTION</span>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-[#3E7A5B]" />
          </div>
          <h3 className="font-display text-sm font-bold text-[#EDE7DD] tracking-tight">
            {execStep?.title}
          </h3>
          <div className="mt-1.5 text-xs text-[#EDE7DD] leading-snug">
            {execStep?.detail}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-[#2A2E35]">
            <div className="p-2 rounded-lg bg-[#14161A] border border-[#3E7A5B]">
              <div className="text-[9.5px] font-bold text-[#3E7A5B] uppercase">Base Mainnet</div>
              <div className="text-[11px] font-semibold text-[#EDE7DD]">Definitive Flash</div>
            </div>
            <div className="p-2 rounded-lg bg-[#14161A] border border-dashed border-[#8A7B4E]">
              <div className="text-[9.5px] font-bold text-[#8A7B4E] uppercase">Sepolia Sandbox</div>
              <div className="text-[11px] font-semibold text-[#EDE7DD]">Uniswap V4</div>
            </div>
          </div>
        </div>

        <ChevronConduit orientation="vertical" />

        {/* Mobile Step 3 */}
        <div className="relative rounded-2xl border border-[#8C5A2B] bg-[#1C1F24] p-4 shadow-panel">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#14161A] text-[#CBA135] border border-[#8C5A2B]">
                <LockSimple size={13} weight="bold" />
              </span>
              <span className="label text-[#CBA135]">STAGE 03 · DYNAMIC AUTHORIZATION</span>
            </div>
            <span className="label text-[#8C5A2B] font-mono">2-OF-2 MPC</span>
          </div>
          <h3 className="font-display text-sm font-bold text-[#EDE7DD] tracking-tight">
            {vaultStep?.title}
          </h3>
          <p className="mt-1.5 text-xs text-[#9B9690] leading-snug">
            {vaultStep?.detail}
          </p>
          <div className="mt-3 pt-2 border-t border-[#2A2E35] flex items-center justify-between text-[11px]">
            <span className="text-[#9B9690] font-medium">Dynamic Spend Limit</span>
            <span className="num font-bold text-[#CBA135]">$50.00 Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
