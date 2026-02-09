import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format basis points as percentage string */
export function formatBps(bps: number): string {
  const pct = bps / 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

/** Format basis points as PnL string */
export function formatPnl(bps: number): string {
  const sign = bps >= 0 ? '+' : '';
  return `${sign}${(bps / 100).toFixed(2)}%`;
}
