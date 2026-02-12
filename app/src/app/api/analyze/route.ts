import { NextRequest, NextResponse } from 'next/server';
import { buildAnalysisPrompt, generateFallbackAnalysis, type AnalysisRequest } from '@/lib/engine/analyst';
import { checkRateLimit, checkDailyAiLimit } from '@/lib/rate-limit';

// Rate limits: 10 analysis calls per minute per IP, shares daily cap with ai-breed
const RATE_CONFIG = { max: 10, windowSec: 60 };
const DAILY_MAX = 100;

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIP(req);

    // Per-IP rate limit
    const rl = checkRateLimit(`analyze:${ip}`, RATE_CONFIG);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${rl.resetIn}s` },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      );
    }

    // Global daily AI cap (shared counter)
    const daily = checkDailyAiLimit(DAILY_MAX);
    if (!daily.allowed) {
      // Fall back to non-AI analysis instead of blocking
      const body: AnalysisRequest = await req.json();
      return NextResponse.json(generateFallbackAnalysis(body));
    }

    const body: AnalysisRequest = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(generateFallbackAnalysis(body));
    }

    const prompt = buildAnalysisPrompt(body);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      },
    );

    if (!res.ok) {
      console.error('Gemini API error:', res.status);
      return NextResponse.json(generateFallbackAnalysis(body));
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(generateFallbackAnalysis(body));
    }

    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(generateFallbackAnalysis(body));
    }
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 },
    );
  }
}
