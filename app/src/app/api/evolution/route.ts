import { NextRequest, NextResponse } from 'next/server';
import { startEvolution, stopEvolution, stepEvolution, getArenaSnapshot, getTopGenomes, breedAndTest, startBattleEvolution, stepBattleEvolution, resetArena } from '@/lib/engine/arena';
import { TradingPair, SUPPORTED_PAIRS } from '@/lib/engine/market';
import { runBattleTest } from '@/lib/engine/battle-test';
import { MARKET_PERIODS } from '@/lib/engine/periods';
import { checkRateLimit } from '@/lib/rate-limit';

// Rate limits: 3 evolution starts per minute per IP (heavy compute)
const EVOLUTION_RATE = { max: 3, windowSec: 60 };
// Input caps
const MAX_POPULATION = 30;
const MAX_GENERATIONS = 100;

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

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

  // Rate limit mutation/compute-heavy actions
  if (['start', 'run-all', 'battle-start', 'battle-run-all'].includes(action)) {
    const ip = getIP(req);
    const rl = checkRateLimit(`evolution:${ip}`, EVOLUTION_RATE);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${rl.resetIn}s` },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      );
    }
  }

  if (action === 'start') {
    const populationSize = Math.min(body.populationSize || 20, MAX_POPULATION);
    const generations = Math.min(body.generations || 50, MAX_GENERATIONS);
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
    // Run the FULL evolution in a single request to avoid serverless state loss
    const topGenomes = body.seedGenomes as number[][] | undefined ?? getTopGenomes(10);
    const populationSize = Math.min(body.populationSize || 20, MAX_POPULATION);
    const generations = Math.min(body.generations || 50, MAX_GENERATIONS);
    const symbol = (body.symbol && SUPPORTED_PAIRS.some(p => p.symbol === body.symbol))
      ? body.symbol as TradingPair : 'SOLUSDT';
    const period = (body.period && body.period in MARKET_PERIODS) ? body.period as string : null;

    try {
      await startEvolution(populationSize, generations, topGenomes, symbol, period);
      // Run all generations in this single request (like run-all)
      let complete = false;
      while (!complete) {
        complete = await stepEvolution();
      }
      const snapshot = getArenaSnapshot();
      return NextResponse.json({
        status: 'complete',
        snapshot,
        seededFrom: topGenomes ? topGenomes.length : 0,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
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
    const complete = await stepEvolution();
    const snapshot = getArenaSnapshot();
    return NextResponse.json({
      status: complete ? 'complete' : 'running',
      snapshot,
    });
  }

  if (action === 'run-all') {
    // Run the complete evolution in a single request (for serverless environments)
    // Init + run all in one shot to avoid state loss between cold starts
    const populationSize = Math.min(body.populationSize || 20, MAX_POPULATION);
    const generations = Math.min(body.generations || 50, MAX_GENERATIONS);
    const seedGenomes = body.seedGenomes as number[][] | undefined;
    const symbol = (body.symbol && SUPPORTED_PAIRS.some(p => p.symbol === body.symbol))
      ? body.symbol as TradingPair : 'SOLUSDT';
    const period = (body.period && body.period in MARKET_PERIODS) ? body.period as string : null;

    try {
      await startEvolution(populationSize, generations, seedGenomes, symbol, period);
      let complete = false;
      while (!complete) {
        complete = await stepEvolution();
      }
      const snapshot = getArenaSnapshot();
      return NextResponse.json({ status: 'complete', snapshot });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === 'battle-evolve') {
    const populationSize = Math.min(body.populationSize ?? 20, MAX_POPULATION);
    const generations = Math.min(body.generations ?? 50, MAX_GENERATIONS);
    const symbol = (body.symbol && SUPPORTED_PAIRS.some(p => p.symbol === body.symbol))
      ? body.symbol as TradingPair : 'SOLUSDT';
    const seedGenomes = body.seedGenomes as number[][] | undefined;
    await startBattleEvolution(populationSize, generations, symbol, seedGenomes);
    return NextResponse.json({ status: 'started', mode: 'battle-evolve', populationSize, generations, symbol, seeded: seedGenomes?.length ?? 0 });
  }

  if (action === 'battle-step') {
    const complete = await stepBattleEvolution();
    const snapshot = getArenaSnapshot();
    return NextResponse.json({ status: complete ? 'complete' : 'running', snapshot });
  }

  if (action === 'battle-run-all') {
    const populationSize = Math.min(body.populationSize ?? 20, MAX_POPULATION);
    const generations = Math.min(body.generations ?? 50, MAX_GENERATIONS);
    const seedGenomes = body.seedGenomes as number[][] | undefined;
    const symbol = (body.symbol && SUPPORTED_PAIRS.some(p => p.symbol === body.symbol))
      ? body.symbol as TradingPair : 'SOLUSDT';
    try {
      await startBattleEvolution(populationSize, generations, symbol, seedGenomes);
      let complete = false;
      while (!complete) {
        complete = await stepBattleEvolution();
      }
      const snapshot = getArenaSnapshot();
      return NextResponse.json({ status: 'complete', snapshot, mode: 'battle' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
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

  if (action === 'reset') {
    resetArena();
    return NextResponse.json({ status: 'idle' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
