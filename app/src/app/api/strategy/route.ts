import { NextResponse } from 'next/server';
import { getArenaState } from '@/lib/engine/arena';
import { decodeGenome } from '@/types';
import { runStrategy } from '@/lib/engine/strategy';
import { fetchCandles } from '@/lib/engine/market';

export async function GET() {
  const arena = getArenaState();

  if (!arena || arena.agents.length === 0) {
    return NextResponse.json({
      error: 'No evolution data. Run evolution first.',
      usage: 'POST /api/evolution with { action: "start" } then wait for completion.',
    }, { status: 404 });
  }

  // Find best alive agent
  const best = [...arena.agents]
    .filter(a => a.isAlive && a.totalTrades > 0)
    .sort((a, b) => b.totalPnl - a.totalPnl)[0];

  if (!best) {
    return NextResponse.json({ error: 'No viable agents found' }, { status: 404 });
  }

  const decoded = decodeGenome(best.genome);

  // Get fresh candles for current signal
  let currentSignal = 'UNKNOWN';
  let confidence = 0;
  try {
    const candles = await fetchCandles(arena.symbol, '4h', 500);
    const result = runStrategy(best.genome, candles);
    // Signal based on last trade direction
    if (result.trades.length > 0) {
      const lastTrade = result.trades[result.trades.length - 1];
      currentSignal = lastTrade.side === 'long' ? 'LONG' : 'SHORT';
      confidence = Math.min(0.95, Math.max(0.3, result.winRate / 100));
    }
  } catch {
    // Use cached data
  }

  const candleDays = arena.candles.length > 0
    ? Math.round((arena.candles[arena.candles.length - 1].time - arena.candles[0].time) / 86400)
    : 0;

  return NextResponse.json({
    pair: arena.symbol,
    agentId: best.id,
    generation: best.generation,
    genome: best.genome,
    decoded: {
      emaFast: decoded.emaFast,
      emaSlow: decoded.emaSlow,
      rsiPeriod: decoded.rsiPeriod,
      rsiOverbought: decoded.rsiOverbought,
      rsiOversold: decoded.rsiOversold,
      donchianPeriod: decoded.donchianPeriod,
      macdFast: decoded.macdFast,
      macdSlow: decoded.macdSlow,
      macdSignal: decoded.macdSignal,
      bbPeriod: decoded.bbPeriod,
      bbStd: decoded.bbStd,
      stochK: decoded.stochK,
      stochD: decoded.stochD,
      stopLossPct: decoded.stopLossPct,
      takeProfitPct: decoded.takeProfitPct,
      signalThreshold: decoded.signalThreshold,
      leverage: decoded.leverage,
      riskPerTrade: decoded.riskPerTrade,
      momentumWeight: decoded.momentumWeight,
      volatilityFilter: decoded.volatilityFilter,
      tradeCooldown: decoded.tradeCooldown,
    },
    performance: {
      pnl: best.totalPnl / 100, // convert from bps to %
      winRate: best.winRate / 100, // convert from bps to %
      trades: best.totalTrades,
      period: `${candleDays}d`,
    },
    signals: {
      currentSignal,
      confidence: Math.round(confidence * 100) / 100,
    },
    fees: '0.1% taker + 0.05% slippage per trade (0.30% round trip) — applied to all backtest results',
    usage: 'Import these parameters into any trading bot. See /api/paper-trade for live forward testing.',
  });
}
