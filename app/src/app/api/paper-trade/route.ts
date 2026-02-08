import { NextRequest, NextResponse } from 'next/server';
import { fetchCandles, TradingPair, SUPPORTED_PAIRS } from '@/lib/engine/market';
import { paperTrade } from '@/lib/engine/paper-trader';
import { getArenaState } from '@/lib/engine/arena';

// In-memory paper trade state
let paperTradeState: ReturnType<typeof paperTrade> | null = null;
let paperTradeGenome: number[] | null = null;
let paperTradeSymbol: TradingPair = 'SOLUSDT';

export async function GET() {
  if (!paperTradeState) {
    // Auto-start with best genome from arena if available
    const arena = getArenaState();
    if (arena && arena.agents.length > 0) {
      const best = [...arena.agents]
        .filter(a => a.isAlive && a.totalTrades > 0)
        .sort((a, b) => b.totalPnl - a.totalPnl)[0];
      if (best) {
        try {
          const candles = await fetchCandles(arena.symbol, '4h', 500);
          paperTradeGenome = best.genome;
          paperTradeSymbol = arena.symbol;
          paperTradeState = paperTrade(best.genome, candles);
        } catch (err) {
          return NextResponse.json({ error: 'Failed to fetch candles', detail: String(err) }, { status: 500 });
        }
      }
    }

    if (!paperTradeState) {
      return NextResponse.json({ status: 'idle', message: 'No paper trade running. POST a genome to start.' });
    }
  }

  // Refresh with latest candles
  try {
    const candles = await fetchCandles(paperTradeSymbol, '4h', 500);
    paperTradeState = paperTrade(paperTradeGenome!, candles);
  } catch {
    // Return stale state
  }

  return NextResponse.json({ status: 'running', symbol: paperTradeSymbol, ...paperTradeState });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const genome = body.genome as number[] | undefined;
  const symbol = (body.symbol && SUPPORTED_PAIRS.some(p => p.symbol === body.symbol))
    ? body.symbol as TradingPair : 'SOLUSDT';

  if (!genome || !Array.isArray(genome) || genome.length < 20) {
    return NextResponse.json({ error: 'Provide a valid genome array (20+ numbers)' }, { status: 400 });
  }

  try {
    const candles = await fetchCandles(symbol, '4h', 500);
    paperTradeGenome = genome;
    paperTradeSymbol = symbol;
    paperTradeState = paperTrade(genome, candles);
    return NextResponse.json({ status: 'started', symbol, ...paperTradeState });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch candles', detail: String(err) }, { status: 500 });
  }
}
