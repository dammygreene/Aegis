import { cn } from '@/lib/cn';
import type { NetworkType } from '@/types';

/**
 * Network state badge — the live/staged distinction is a demo-credibility
 * requirement, so it is encoded three ways at once:
 *   1. color (emerald = live mainnet, amber = testnet/staged)
 *   2. a tinted border + glow on the host surface (`.state-live` / `.state-staged`)
 *   3. the text label
 * so it survives being read at a glance, out of focus, or in a screenshot.
 */
export function NetworkBadge({
  network,
  networkName,
  className,
}: {
  network: NetworkType;
  networkName: string;
  className?: string;
}) {
  const isLive = network === 'mainnet';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px]',
        'label hash normal-case tracking-badge',
        isLive
          ? 'border-live/40 bg-live-wash text-emerald-300'
          : 'border-staged/40 bg-staged-wash text-amber-300',
        className
      )}
      title={isLive ? 'Live mainnet execution — real capital' : 'Testnet execution — no real capital'}
    >
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        {isLive && (
          <span
            className={cn(
              'absolute inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400/70 animate-pulse-ring'
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            isLive ? 'bg-emerald-400' : 'bg-amber-400'
          )}
        />
      </span>
      <span>{networkName}</span>
      <span className="text-slate-500">{isLive ? '· LIVE' : '· STAGED'}</span>
    </span>
  );
}

/** Color tokens reused by any surface that needs to signal live vs staged. */
export const networkSurfaceClass = (network: NetworkType) =>
  network === 'mainnet' ? 'state-live' : 'state-staged';
