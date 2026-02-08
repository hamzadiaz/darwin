import { NextRequest, NextResponse } from 'next/server';
import { deployAgent, stopAgent, updateAgent, getLiveAgentState } from '@/lib/trading/live-agent';
import { getArenaState } from '@/lib/engine/arena';

export async function GET() {
  const state = getLiveAgentState();
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action || 'status';

  if (action === 'deploy') {
    const arena = getArenaState();
    let genome = body.genome;

    if (!genome && arena) {
      // Pick best alive agent's genome
      const best = arena.agents
        .filter(a => a.isAlive)
        .sort((a, b) => b.totalPnl - a.totalPnl)[0];
      if (best) genome = best.genome;
    }

    if (!genome) {
      return NextResponse.json({ error: 'No genome available' }, { status: 400 });
    }

    const state = deployAgent(
      genome,
      body.mode || 'paper',
      body.walletAddress || null,
      body.initialValue || 10000,
    );
    return NextResponse.json(state);
  }

  if (action === 'stop') {
    stopAgent();
    return NextResponse.json(getLiveAgentState());
  }

  if (action === 'update') {
    const state = await updateAgent();
    return NextResponse.json(state);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
