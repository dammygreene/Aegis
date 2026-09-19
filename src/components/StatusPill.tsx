import { cn } from '@/lib/cn';

/**
 * Secondary status chip — Vault palette styling.
 * Uses flat colors:
 *   signal: border #CBA135, text #CBA135
 *   live:   border #3E7A5B, text #3E7A5B
 *   staged: border #8A7B4E, text #8A7B4E
 *   neutral: border #2A2E35, text #9B9690
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
        'inline-flex items-center gap-1 border px-2 py-[2px] bg-[#14161A]',
        'label hash normal-case',
        'rounded-r-full rounded-l-[3px]',
        tone === 'signal' && 'border-[#CBA135]/40 text-[#CBA135]',
        tone === 'live' && 'border-[#3E7A5B]/50 text-[#3E7A5B]',
        tone === 'staged' && 'border-[#8A7B4E]/50 text-[#8A7B4E]',
        tone === 'neutral' && 'border-[#2A2E35] text-[#9B9690]',
        className
      )}
    >
      {children}
    </span>
  );
}
