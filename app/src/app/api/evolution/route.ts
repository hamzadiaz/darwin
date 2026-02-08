import { NextRequest, NextResponse } from 'next/server';
import { startEvolution, stopEvolution, getArenaSnapshot } from '@/lib/engine/arena';

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
    const generations = body.generations || 10;

    // Start evolution in background (don't await)
    startEvolution(populationSize, generations);

    return NextResponse.json({
      status: 'started',
      populationSize,
      generations,
    });
  }

  if (action === 'stop') {
    stopEvolution();
    return NextResponse.json({ status: 'stopped' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
