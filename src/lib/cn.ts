import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class lists: later utilities win, conditional values stay readable.
 * `clsx` + `tailwind-merge` are already project dependencies — this is the single
 * entry point for composing the styling-pass class sets.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
