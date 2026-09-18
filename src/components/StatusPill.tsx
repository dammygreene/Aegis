import { cn } from '@/lib/cn';

/**
 * Secondary status chip. Deliberately visually quiet: after the styling pass the
 * spend cap / safety ceiling numbers are the loudest things in the top bar, and
 * status chips sit a clear step below them in the hierarchy.
 */
export function StatusPill({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'signal' | 'live' | 'staged';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-[2px]',
        'label hash normal-case',
        tone === 'signal' && 'border-sky-500/25 bg-sky-500/[0.07] text-sky-300/90',
        tone === 'live' && 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300/90',
        tone === 'staged' && 'border-amber-500/25 bg-amber-500/[0.07] text-amber-300/90',
        tone === 'neutral' && 'border-hairline bg-ink-950/60 text-slate-400',
        className
      )}
    >
      {children}
    </span>
  );
}
