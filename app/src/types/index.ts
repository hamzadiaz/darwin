/** Expanded genome encoding a trading strategy (22 genes) */
export interface AgentGenome {
  id: number;
  generation: number;
  parentA: number | null;
  parentB: number | null;
  genome: number[]; // 22 genes, each 0-1000 (scaled)
  bornAt: number;
  diedAt: number | null;
  totalPnl: number; // basis points
  totalTrades: number;
  winRate: number; // basis points (0-10000)
  isAlive: boolean;
  owner: string;
  aiAnalysis?: string; // AI analyst commentary
  // Trading metrics (computed from trades)
  avgWin?: number;        // average win % per trade
  avgLoss?: number;       // average loss % per trade (positive number)
  profitFactor?: number;  // gross wins / gross losses
  riskReward?: string;    // formatted R:R like "1:3.2"
  expectedValue?: number; // EV per trade as %
}

/** Decoded genome with human-readable gene names */
export interface DecodedGenome {
  // Original genes
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
  // New genes
  macdFast: number;           // 8-16
  macdSlow: number;           // 20-32
  macdSignal: number;         // 6-12
  bbPeriod: number;           // 10-30
  bbStd: number;              // 1.5-3.0
  stochK: number;             // 5-21
  stochD: number;             // 3-9
  signalThreshold: number;    // 0.2-0.8 (aggressiveness)
  // Leverage genes (added for Donchian-style compounded returns)
  leverage: number;           // 1-15x
  riskPerTrade: number;       // 5-30% of balance risked per trade
}

/** Number of genes in the genome */
export const GENOME_SIZE = 22;

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
  'MACD Fast',
  'MACD Slow',
  'MACD Signal',
  'BB Period',
  'BB Std Dev',
  'Stoch K',
  'Stoch D',
  'Aggressiveness',
  'Leverage',
  'Risk Per Trade %',
] as const;

/** Decode raw genome (0-1000) to actual parameter ranges */
export function decodeGenome(raw: number[]): DecodedGenome {
  const scale = (val: number, min: number, max: number) =>
    min + ((val ?? 500) / 1000) * (max - min);

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
    macdFast: Math.round(scale(raw[12], 8, 16)),
    macdSlow: Math.round(scale(raw[13], 20, 32)),
    macdSignal: Math.round(scale(raw[14], 6, 12)),
    bbPeriod: Math.round(scale(raw[15], 10, 30)),
    bbStd: +scale(raw[16], 1.5, 3.0).toFixed(2),
    stochK: Math.round(scale(raw[17], 5, 21)),
    stochD: Math.round(scale(raw[18], 3, 9)),
    signalThreshold: +scale(raw[19], 0.2, 0.8).toFixed(2),
    leverage: +scale(raw[20] ?? 500, 1, 15).toFixed(1),
    riskPerTrade: +scale(raw[21] ?? 500, 5, 30).toFixed(1),
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
  aiAnalysis?: string;
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
