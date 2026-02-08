/**
 * Paper Trading — forward-test an evolved genome against live candles
 * Includes realistic fees (same as backtest)
 */

import { OHLCV } from './market';
import { runStrategy, StrategyResult, Trade, Signal } from './strategy';
import { DecodedGenome, decodeGenome } from '@/types';

export interface PaperTradeResult {
  startingBalance: number;
  currentBalance: number;
  pnlPct: number;
  pnlUsd: number;
  totalTrades: number;
  winRate: number;
  wins: number;
  losses: number;
  trades: Trade[];
  openPosition: {
    side: 'long' | 'short';
    entryPrice: number;
    entryIdx: number;
    unrealizedPnlPct: number;
  } | null;
  lastPrice: number;
  lastUpdate: number;
  candleCount: number;
  genomeSummary: DecodedGenome;
  feesNote: string;
}

const STARTING_BALANCE = 10000;

/**
 * Run paper trading: takes a genome and live candles, returns full state.
 * Uses the same runStrategy engine (with fees) for consistency.
 */
export function paperTrade(genome: number[], candles: OHLCV[]): PaperTradeResult {
  const decoded = decodeGenome(genome);
  const result = runStrategy(genome, candles);

  // Simulate balance with compounding (same logic as backtest)
  let balance = STARTING_BALANCE;
  const leverage = decoded.leverage;
  const riskPerTrade = decoded.riskPerTrade / 100;

  for (const t of result.trades) {
    const posSize = Math.min(balance, balance * riskPerTrade);
    const tradePnl = posSize * leverage * (t.pnlPct / 100);
    const cappedPnl = Math.max(tradePnl, -posSize);
    balance += cappedPnl;
    if (balance <= 0) { balance = 0; break; }
  }

  const wins = result.trades.filter(t => t.pnlPct > 0).length;
  const losses = result.trades.filter(t => t.pnlPct <= 0).length;
  const lastPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;

  // Check if there's an open position (last trade might not be closed)
  // The strategy always closes at end, so openPosition is null after full run
  // But we can detect if the last trade was a forced close
  let openPosition: PaperTradeResult['openPosition'] = null;

  return {
    startingBalance: STARTING_BALANCE,
    currentBalance: Math.round(balance * 100) / 100,
    pnlPct: Math.round(((balance - STARTING_BALANCE) / STARTING_BALANCE) * 10000) / 100,
    pnlUsd: Math.round((balance - STARTING_BALANCE) * 100) / 100,
    totalTrades: result.totalTrades,
    winRate: result.winRate,
    wins,
    losses,
    trades: result.trades.slice(-20), // last 20 trades
    openPosition,
    lastPrice,
    lastUpdate: Date.now(),
    candleCount: candles.length,
    genomeSummary: decoded,
    feesNote: 'Includes 0.1% taker fee + 0.05% slippage per trade (0.30% round trip)',
  };
}
