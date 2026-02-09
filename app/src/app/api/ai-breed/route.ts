import { NextRequest, NextResponse } from 'next/server';
import { buildBreedingPrompt, parseBreedingResponse, setLatestBreedingResult } from '@/lib/engine/ai-breeder';

export async function POST(req: NextRequest) {
  try {
    // Stateless: accept agents from request body (no server state needed)
    let body: { agents?: any[]; candles?: number[][]; generation?: number } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { agents, candles, generation = 0 } = body;

    if (!agents || !Array.isArray(agents)) {
      return NextResponse.json({ error: 'agents array required in body' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 500 });
    }

    const aliveAgents = agents
      .filter((a: any) => a.isAlive)
      .sort((a: any, b: any) => (b.totalPnl || 0) - (a.totalPnl || 0))
      .slice(0, 5);

    if (aliveAgents.length < 2) {
      return NextResponse.json({ error: 'Not enough agents' }, { status: 400 });
    }

    const prompt = buildBreedingPrompt(aliveAgents, (candles || []) as any, generation);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
        }),
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Gemini ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: 'Empty response' }, { status: 502 });
    }

    const result = parseBreedingResponse(text, aliveAgents);
    if (result) {
      setLatestBreedingResult(result);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  } catch (err) {
    console.error('AI breeding error:', err);
    return NextResponse.json({ error: 'AI breeding failed' }, { status: 500 });
  }
}

export async function GET() {
  const { getLatestBreedingResult } = await import('@/lib/engine/ai-breeder');
  const result = getLatestBreedingResult();
  return NextResponse.json(result ?? { decisions: [], evolutionStrategy: null, marketRegimeDetection: null });
}
