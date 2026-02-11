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
    // Try server state first, fall back to client-provided data
    const snapshot = getArenaSnapshot();
    
    if (snapshot && snapshot.generations.length > 0) {
      // Server has state — use it
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

    // Serverless fallback: accept generations data from client
    if (body.generations && Array.isArray(body.generations)) {
      const existingRecords = getOnChainRecords();
      const recordedGens = new Set(existingRecords.map((r: { generation: number }) => r.generation));

      for (const gen of body.generations) {
        if (!recordedGens.has(gen.number)) {
          await recordGenerationOnChain(
            gen.number,
            gen.winnerGenome || [],
            gen.bestPnl || 0,
            gen.bestAgent || 0,
          );
        }
      }
      return NextResponse.json({ records: getOnChainRecords() });
    }

    return NextResponse.json({ 
      error: 'No evolution data available. Run evolution first, then record winners.',
      hint: 'serverless'
    }, { status: 400 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
