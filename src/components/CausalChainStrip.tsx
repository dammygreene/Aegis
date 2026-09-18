import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ChainStep = {
  index: number;
  title: string;
  detail: React.ReactNode;
  tone: 'signal' | 'live' | 'vault';
};

const toneClass = {
  signal: {
    node: 'border-sky-400/50 bg-sky-500/15 text-sky-300 shadow-glow-signal',
    card: 'hover:border-sky-400/30',
    kicker: 'text-sky-400',
  },
  live: {
    node: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300 shadow-glow-live',
    card: 'hover:border-emerald-400/30',
    kicker: 'text-emerald-400',
  },
  vault: {
    node: 'border-indigo-400/50 bg-indigo-500/15 text-indigo-300 shadow-glow-vault',
    card: 'hover:border-indigo-400/30',
    kicker: 'text-indigo-300',
  },
} as const;

/**
 * The 15-second judge orientation strip.
 *
 * The whole pitch is "one continuous chain", so the three steps are drawn on a
 * single visible rail with directional flow between them rather than as three
 * unrelated boxes: a horizontal rail + chevrons on desktop, a vertical rail on
 * mobile. Styling only — no data, state or behavior lives in here.
 */
export function CausalChainStrip({ steps }: { steps: ChainStep[] }) {
  return (
    <div className="relative pt-1">
      {/* Desktop rail: one thread running through all three nodes */}
      <div
        aria-hidden
        className="hidden md:block absolute left-[16.666%] right-[16.666%] top-[21px] h-[2px] overflow-visible rounded-full bg-rail-flow opacity-70"
      >
        <div className="flow-sheen absolute inset-0 animate-flow-x opacity-60" />
      </div>

      {/* Mobile rail: same thread, vertical */}
      <div
        aria-hidden
        className="md:hidden absolute left-[21px] top-3 bottom-8 w-[2px] rounded-full bg-rail-signal opacity-70"
      />

      {/* Direction of causality */}
      <div aria-hidden className="hidden md:block absolute inset-x-0 top-[13px]">
        <div className="mx-auto flex w-full justify-around px-[24%]">
          {steps.slice(0, -1).map(step => (
            <span
              key={`flow-${step.index}`}
              className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-hairline bg-ink-900 text-sky-400"
            >
              <ArrowRight className="h-3 w-3" />
            </span>
          ))}
        </div>
      </div>

      <ol className="relative grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-3 md:gap-5">
        {steps.map(step => {
          const tone = toneClass[step.tone];
          return (
            <li key={step.index} className="flex gap-3.5 md:flex-col md:items-center md:text-center">
              <span
                aria-hidden
                className={cn(
                  'chain-node h-10 w-10 shrink-0 border text-[13px] md:mb-3',
                  tone.node
                )}
              >
                {step.index}
              </span>

              <div
                className={cn(
                  'flex-1 rounded-xl border border-hairline bg-ink-950/60 px-3.5 py-3',
                  'bg-panel-raise shadow-panel transition-colors duration-300 ease-spring md:w-full',
                  tone.card
                )}
              >
                <div className="text-sm font-semibold tracking-tight text-slate-100 font-display">
                  {step.title}
                </div>
                <div className="mt-1 text-[11.5px] leading-relaxed text-slate-400">
                  {step.detail}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
