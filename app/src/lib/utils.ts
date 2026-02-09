import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format basis points as percentage string (capped at 10,000%) */
export function formatBps(bps: number): string {
  const pct = bps / 100;
  if (pct > 10000) return '+10,000%+';
  if (pct < -10000) return '-10,000%+';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

/** Format basis points as percentage string (uncapped, for leaderboard) */
export function formatBpsUncapped(bps: number): string {
  const pct = bps / 100;
  const sign = pct >= 0 ? '+' : '';
  if (Math.abs(pct) >= 1000) {
    return `${sign}${pct.toLocaleString('en-US', { maximumFractionDigits: 0 })}%`;
  }
  return `${sign}${pct.toFixed(2)}%`;
}

/** Format basis points as PnL string (capped at 10,000%) */
export function formatPnl(bps: number): string {
  const pct = bps / 100;
  if (pct > 10000) return '+10,000%+';
  if (pct < -10000) return '-10,000%+';
  const sign = bps >= 0 ? '+' : '';
  return `${sign}${(bps / 100).toFixed(2)}%`;
}
