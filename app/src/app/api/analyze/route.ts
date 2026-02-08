import { NextRequest, NextResponse } from 'next/server';
import { buildAnalysisPrompt, generateFallbackAnalysis, type AnalysisRequest } from '@/lib/engine/analyst';

export async function POST(req: NextRequest) {
  try {
    const body: AnalysisRequest = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return fallback analysis if no API key
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

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch {
      // If JSON parsing fails, return fallback
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
