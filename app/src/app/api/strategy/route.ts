import { NextRequest, NextResponse } from 'next/server';
import { getArenaState } from '@/lib/engine/arena';
import { decodeGenome } from '@/types';
import { runStrategy } from '@/lib/engine/strategy';
import { fetchCandles } from '@/lib/engine/market';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const arena = getArenaState();

  // Try genome from query param (client-side fallback when arena is reset)
  let genome: number[] | null = null;
  let agentId = 0;
  let agentGen = 0;
  const genomeParam = searchParams.get('genome');
  if (genomeParam) {
    try { genome = JSON.parse(genomeParam); } catch { /* ignore */ }
  }

  if (!genome) {
    if (!arena || arena.agents.length === 0) {
      return NextResponse.json({
        error: 'No evolution data. Run evolution first.',
        usage: 'POST /api/evolution with { action: "start" } then wait for completion.',
      }, { status: 404 });
    }
    const best = [...arena.agents]
      .filter(a => a.isAlive && a.totalTrades > 0)
      .sort((a, b) => b.totalPnl - a.totalPnl)[0];
    if (!best) {
      return NextResponse.json({ error: 'No viable agents found' }, { status: 404 });
    }
    genome = best.genome;
    agentId = best.id;
    agentGen = best.generation;
  }

  const decoded = decodeGenome(genome);

  // Get fresh candles for current signal
  let currentSignal = 'UNKNOWN';
  let confidence = 0;
  let stratResult: { totalPnlPct: number; winRate: number; trades: { side: string }[] } | null = null;
  try {
    const symbol = arena?.symbol || 'SOLUSDT';
    const candles = await fetchCandles(symbol, '4h', 500);
    stratResult = runStrategy(genome, candles);
    if (stratResult.trades.length > 0) {
      const lastTrade = stratResult.trades[stratResult.trades.length - 1];
      currentSignal = lastTrade.side === 'long' ? 'LONG' : 'SHORT';
      confidence = Math.min(0.95, Math.max(0.3, stratResult.winRate / 100));
    }
  } catch {
    // Use cached data
  }

  const candleDays = arena?.candles?.length
    ? Math.round((arena.candles[arena.candles.length - 1].time - arena.candles[0].time) / 86400)
    : 0;

  return NextResponse.json({
    pair: arena?.symbol || 'SOLUSDT',
    agentId,
    generation: agentGen,
    genome,
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
      pnl: stratResult ? stratResult.totalPnlPct : 0,
      winRate: stratResult ? stratResult.winRate : 0,
      trades: stratResult ? stratResult.trades.length : 0,
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
