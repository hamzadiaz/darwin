import { NextRequest, NextResponse } from 'next/server';
import { startEvolution, stopEvolution, stepEvolution, getArenaSnapshot, getTopGenomes, breedAndTest, startBattleEvolution, stepBattleEvolution } from '@/lib/engine/arena';
import { TradingPair, SUPPORTED_PAIRS } from '@/lib/engine/market';
import { runBattleTest } from '@/lib/engine/battle-test';
import { MARKET_PERIODS } from '@/lib/engine/periods';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'status';

  if (action === 'status') {
    const snapshot = getArenaSnapshot();
    if (!snapshot) {
      return NextResponse.json({ status: 'idle', message: 'No evolution running' });
    }
    return NextResponse.json(snapshot);
  }

  if (action === 'history') {
    const snapshot = getArenaSnapshot();
    return NextResponse.json({
      generations: snapshot?.generations ?? [],
      bestEverPnl: snapshot?.bestEverPnl ?? 0,
      bestEverAgentId: snapshot?.bestEverAgentId ?? 0,
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action || 'start';

  if (action === 'start') {
    const populationSize = body.populationSize || 20;
    const generations = body.generations || 50;
    const seedGenomes = body.seedGenomes as number[][] | undefined;
    const symbol = (body.symbol && SUPPORTED_PAIRS.some(p => p.symbol === body.symbol))
      ? body.symbol as TradingPair : 'SOLUSDT';
    const period = (body.period && body.period in MARKET_PERIODS) ? body.period as string : null;

    try {
      await startEvolution(populationSize, generations, seedGenomes, symbol, period);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('startEvolution failed:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'started',
      populationSize,
      generations,
      symbol,
      period,
      seeded: seedGenomes ? seedGenomes.length : 0,
    });
  }

  if (action === 'continue') {
    // Continue evolution: seed new run with top genomes from current run
    const topGenomes = getTopGenomes(10);
    const populationSize = body.populationSize || 20;
    const generations = body.generations || 50;
    const symbol = (body.symbol && SUPPORTED_PAIRS.some(p => p.symbol === body.symbol))
      ? body.symbol as TradingPair : 'SOLUSDT';
    const period = (body.period && body.period in MARKET_PERIODS) ? body.period as string : null;

    try {
      await startEvolution(populationSize, generations, topGenomes, symbol, period);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'continued',
      seededFrom: topGenomes.length,
      populationSize,
      generations,
    });
  }

  if (action === 'breed') {
    const { parentA, parentB } = body;
    if (!parentA || !parentB) {
      return NextResponse.json({ error: 'parentA and parentB ids required' }, { status: 400 });
    }
    try {
      const child = await breedAndTest(parentA, parentB);
      if (!child) return NextResponse.json({ error: 'Breeding failed — no arena state or parents not found' }, { status: 400 });
      return NextResponse.json({ status: 'bred', child });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === 'step') {
    // Client calls this repeatedly to advance evolution one generation at a time
    // This avoids Vercel serverless timeout killing background promises
    const complete = await stepEvolution();
    const snapshot = getArenaSnapshot();
    return NextResponse.json({
      status: complete ? 'complete' : 'running',
      snapshot,
    });
  }

  if (action === 'battle-evolve') {
    const populationSize = body.populationSize ?? 20;
    const generations = body.generations ?? 50;
    const symbol = (body.symbol && SUPPORTED_PAIRS.some(p => p.symbol === body.symbol))
      ? body.symbol as TradingPair : 'SOLUSDT';
    await startBattleEvolution(populationSize, generations, symbol);
    return NextResponse.json({ status: 'started', mode: 'battle-evolve', populationSize, generations, symbol });
  }

  if (action === 'battle-step') {
    const complete = await stepBattleEvolution();
    const snapshot = getArenaSnapshot();
    return NextResponse.json({ status: complete ? 'complete' : 'running', snapshot });
  }

  if (action === 'battle-test') {
    const genome = body.genome as number[] | undefined;
    if (!genome || !Array.isArray(genome)) {
      return NextResponse.json({ error: 'genome array required' }, { status: 400 });
    }
    const symbol = (body.symbol && SUPPORTED_PAIRS.some(p => p.symbol === body.symbol))
      ? body.symbol as TradingPair : 'SOLUSDT';
    try {
      const result = await runBattleTest(genome, symbol);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === 'stop') {
    stopEvolution();
    return NextResponse.json({ status: 'stopped' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
