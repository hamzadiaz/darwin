import { NextRequest, NextResponse } from 'next/server';
import { recordGenerationOnChain, getOnChainRecords } from '@/lib/solana';
import { getArenaSnapshot } from '@/lib/engine/arena';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'records';

  if (action === 'records') {
    return NextResponse.json({ records: getOnChainRecords() });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action || 'record-winner';

  if (action === 'record-winner') {
    const snapshot = getArenaSnapshot();
    if (!snapshot || snapshot.generations.length === 0) {
      return NextResponse.json({ error: 'No generations to record' }, { status: 400 });
    }

    // Record all unrecorded generations
    const existingRecords = getOnChainRecords();
    const recordedGens = new Set(existingRecords.map(r => r.generation));

    for (const gen of snapshot.generations) {
      if (!recordedGens.has(gen.number)) {
        const winner = snapshot.allAgents.find(a => a.id === gen.bestAgent);
        if (winner) {
          await recordGenerationOnChain(
            gen.number,
            winner.genome,
            gen.bestPnl,
            gen.bestAgent,
          );
        }
      }
    }

    return NextResponse.json({ records: getOnChainRecords() });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
