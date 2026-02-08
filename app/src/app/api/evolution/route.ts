import { NextRequest, NextResponse } from 'next/server';
import { startEvolution, stopEvolution, stepEvolution, getArenaSnapshot } from '@/lib/engine/arena';

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

    try {
      await startEvolution(populationSize, generations);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('startEvolution failed:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'started',
      populationSize,
      generations,
    });
  }

  if (action === 'step') {
    // Client calls this repeatedly to advance evolution one generation at a time
    // This avoids Vercel serverless timeout killing background promises
    const complete = await stepEvolution();
    const snapshot = getArenaSnapshot();
    return NextResponse.json({
      status: complete ? 'complete' : 'running',
      currentGeneration: snapshot?.currentGeneration ?? 0,
      maxGenerations: snapshot?.maxGenerations ?? 0,
    });
  }

  if (action === 'stop') {
    stopEvolution();
    return NextResponse.json({ status: 'stopped' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
