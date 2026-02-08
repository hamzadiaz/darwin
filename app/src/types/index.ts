/** 12-gene genome encoding a trading strategy */
export interface AgentGenome {
  id: number;
  generation: number;
  parentA: number | null;
  parentB: number | null;
  genome: number[]; // 12 genes, each 0-1000 (scaled)
  bornAt: number;
  diedAt: number | null;
  totalPnl: number; // basis points
  totalTrades: number;
  winRate: number; // basis points (0-10000)
  isAlive: boolean;
  owner: string;
}

/** Decoded genome with human-readable gene names */
export interface DecodedGenome {
  donchianPeriod: number;     // 10-50
  emaFast: number;            // 5-20
  emaSlow: number;            // 20-100
  rsiPeriod: number;          // 7-21
  rsiOversold: number;        // 20-40
  rsiOverbought: number;      // 60-80
  stopLossPct: number;        // 1-10%
  takeProfitPct: number;      // 2-30%
  positionSizePct: number;    // 5-25%
  tradeCooldown: number;      // 1-24 hours
  volatilityFilter: number;   // 0-1
  momentumWeight: number;     // 0-1
}

/** Gene metadata for display */
export const GENE_NAMES: readonly string[] = [
  'Donchian Period',
  'EMA Fast',
  'EMA Slow',
  'RSI Period',
  'RSI Oversold',
  'RSI Overbought',
  'Stop Loss %',
  'Take Profit %',
  'Position Size %',
  'Trade Cooldown',
  'Volatility Filter',
  'Momentum Weight',
] as const;

/** Decode raw genome (0-1000) to actual parameter ranges */
export function decodeGenome(raw: number[]): DecodedGenome {
  const scale = (val: number, min: number, max: number) =>
    min + (val / 1000) * (max - min);

  return {
    donchianPeriod: Math.round(scale(raw[0], 10, 50)),
    emaFast: Math.round(scale(raw[1], 5, 20)),
    emaSlow: Math.round(scale(raw[2], 20, 100)),
    rsiPeriod: Math.round(scale(raw[3], 7, 21)),
    rsiOversold: Math.round(scale(raw[4], 20, 40)),
    rsiOverbought: Math.round(scale(raw[5], 60, 80)),
    stopLossPct: scale(raw[6], 1, 10),
    takeProfitPct: scale(raw[7], 2, 30),
    positionSizePct: scale(raw[8], 5, 25),
    tradeCooldown: Math.round(scale(raw[9], 1, 24)),
    volatilityFilter: scale(raw[10], 0, 1),
    momentumWeight: scale(raw[11], 0, 1),
  };
}

/** Generation record */
export interface Generation {
  number: number;
  startedAt: number;
  endedAt: number | null;
  bestPnl: number;
  bestAgent: number;
  avgPnl: number;
  agentsBorn: number;
  agentsDied: number;
}

/** Protocol state */
export interface ProtocolState {
  authority: string;
  currentGeneration: number;
  totalAgentsEver: number;
  totalGenerations: number;
  bestAgentEver: number;
  bestPnlEver: number;
}

/** Individual trade result */
export interface TradeResult {
  agentId: number;
  entryPrice: number;
  exitPrice: number;
  side: 'long' | 'short';
  pnlBps: number;
  timestamp: number;
  exitReason: 'tp' | 'sl' | 'signal' | 'timeout';
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  agent: AgentGenome;
  rank: number;
  pnlFormatted: string;
  winRateFormatted: string;
}
