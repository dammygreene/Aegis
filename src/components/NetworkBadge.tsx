import { cn } from '@/lib/cn';
import type { NetworkType } from '@/types';

/**
 * Network state badge — Vault palette styling.
 * Live = #3E7A5B (subdued forest green)
 * Staged = #8A7B4E (subdued ochre/brass)
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
        'inline-flex items-center gap-1.5 border px-2.5 py-[3px]',
        'label hash normal-case tracking-badge bg-[#14161A]',
        'rounded-r-full rounded-l-[3px]',
        isLive
          ? 'border-[#3E7A5B] text-[#3E7A5B]'
          : 'border-[#8A7B4E] text-[#8A7B4E]',
        className
      )}
      title={isLive ? 'Live mainnet execution — real capital' : 'Testnet execution — no real capital'}
    >
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        {isLive && (
          <span className="absolute inline-flex h-1.5 w-1.5 rounded-full bg-[#3E7A5B]/50 animate-ping" />
        )}
        <span
          className={cn(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            isLive ? 'bg-[#3E7A5B]' : 'bg-[#8A7B4E]'
          )}
        />
      </span>
      <span className="font-semibold">{networkName}</span>
      <span className="text-[#9B9690]">{isLive ? '· LIVE' : '· STAGED'}</span>
    </span>
  );
}

export const networkSurfaceClass = (network: NetworkType) =>
  network === 'mainnet' ? 'state-live' : 'state-staged';
