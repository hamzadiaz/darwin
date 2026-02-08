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

/** Generate mock agents for demo */
export function generateMockAgents(count: number, generation: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    generation,
    parentA: generation > 0 ? Math.floor(Math.random() * count) + 1 : null,
    parentB: generation > 0 ? Math.floor(Math.random() * count) + 1 : null,
    genome: Array.from({ length: 20 }, () => Math.floor(Math.random() * 1000)),
    bornAt: Date.now() - Math.random() * 86400000,
    diedAt: Math.random() > 0.75 ? Date.now() : null,
    totalPnl: Math.floor((Math.random() - 0.4) * 5000), // skew slightly negative
    totalTrades: Math.floor(Math.random() * 200) + 10,
    winRate: Math.floor(Math.random() * 7000) + 2000,
    isAlive: Math.random() > 0.25,
    owner: '11111111111111111111111111111111',
  }));
}

/** Generate mock generations for demo */
export function generateMockGenerations(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    number: i,
    startedAt: Date.now() - (count - i) * 3600000,
    endedAt: i < count - 1 ? Date.now() - (count - i - 1) * 3600000 : null,
    bestPnl: Math.floor(Math.random() * 3000) - 500 + i * 50, // trend upward
    bestAgent: Math.floor(Math.random() * 20) + 1,
    avgPnl: Math.floor(Math.random() * 1000) - 500 + i * 20,
    agentsBorn: 20,
    agentsDied: 15,
  }));
}
