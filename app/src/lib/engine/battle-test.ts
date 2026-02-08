/**
 * Battle Test — tests a genome across multiple market regimes.
 * A genome that's profitable in bull AND bear is genuinely battle-tested.
 */

import { OHLCV, fetchCandlesForPeriod, TradingPair } from './market';
import { runStrategy } from './strategy';
import { MARKET_PERIODS, BATTLE_TEST_PERIODS, PeriodId } from './periods';

export interface BattleTestPeriodResult {
  periodId: string;
  label: string;
  totalPnlPct: number;
  totalTrades: number;
  winRate: number;
  candleCount: number;
  startDate: string;
  endDate: string;
  passed: boolean; // PnL > -20%
}

export interface BattleTestResult {
  genome: number[];
  periods: BattleTestPeriodResult[];
  averagePnl: number;
  passedCount: number;
  totalPeriods: number;
  battleTested: boolean; // passed majority of periods
  timestamp: number;
}

/**
 * Run a single genome against all battle test periods.
 */
export async function runBattleTest(
  genome: number[],
  symbol: TradingPair = 'SOLUSDT',
  periodIds?: PeriodId[],
): Promise<BattleTestResult> {
  const periods = periodIds ?? BATTLE_TEST_PERIODS;
  const results: BattleTestPeriodResult[] = [];

  for (const periodId of periods) {
    const period = MARKET_PERIODS[periodId];
    if (!period) continue;

    let candles: OHLCV[];
    try {
      candles = await fetchCandlesForPeriod(symbol, periodId, '4h');
    } catch (err) {
      console.warn(`Battle test: failed to fetch ${periodId}:`, (err as Error).message);
      continue;
    }

    if (candles.length < 10) {
      console.warn(`Battle test: insufficient candles for ${periodId} (${candles.length})`);
      continue;
    }

    const result = runStrategy(genome, candles);

    const pnlPct = result.totalPnlPct;
    results.push({
      periodId,
      label: period.label,
      totalPnlPct: Math.round(pnlPct * 100) / 100,
      totalTrades: result.totalTrades,
      winRate: Math.round(result.winRate * 100) / 100,
      candleCount: candles.length,
      startDate: new Date(candles[0].time * 1000).toISOString().slice(0, 10),
      endDate: new Date(candles[candles.length - 1].time * 1000).toISOString().slice(0, 10),
      passed: pnlPct > -20,
    });
  }

  const averagePnl = results.length > 0
    ? Math.round((results.reduce((s, r) => s + r.totalPnlPct, 0) / results.length) * 100) / 100
    : 0;

  const passedCount = results.filter(r => r.passed).length;
  const battleTested = results.length > 0 && passedCount >= Math.ceil(results.length * 0.6);

  return {
    genome,
    periods: results,
    averagePnl,
    passedCount,
    totalPeriods: results.length,
    battleTested,
    timestamp: Date.now(),
  };
}
