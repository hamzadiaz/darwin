/**
 * AI Analyst — Uses Gemini Flash to analyze evolved trading strategies
 */

import { DecodedGenome, decodeGenome, GENE_NAMES } from '@/types';

export interface AnalysisRequest {
  genome: number[];
  generation: number;
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  avgPnl: number;
  bestPnl: number;
  populationSize: number;
  candleSummary?: {
    startPrice: number;
    endPrice: number;
    highPrice: number;
    lowPrice: number;
    priceChange: number;
  };
}

export interface AnalysisResult {
  strategyDescription: string;
  marketInsight: string;
  mutationSuggestion: string;
  confidence: string;
}

/**
 * Build a prompt for the AI analyst
 */
export function buildAnalysisPrompt(req: AnalysisRequest): string {
  const decoded = decodeGenome(req.genome);
  const geneStr = Object.entries(decoded)
    .map(([k, v]) => `  ${k}: ${typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v}`)
    .join('\n');

  return `You are an expert quantitative trading analyst. Analyze this evolved trading agent genome from generation ${req.generation}.

## Genome Parameters
${geneStr}

## Performance
- Total PnL: ${(req.totalPnl / 100).toFixed(2)}%
- Win Rate: ${(req.winRate / 100).toFixed(0)}%
- Total Trades: ${req.totalTrades}
- Generation Avg PnL: ${(req.avgPnl / 100).toFixed(2)}%
- Best PnL This Gen: ${(req.bestPnl / 100).toFixed(2)}%
- Population Size: ${req.populationSize}

${req.candleSummary ? `## Market Context (SOL/USD)
- Price moved from $${req.candleSummary.startPrice.toFixed(2)} to $${req.candleSummary.endPrice.toFixed(2)} (${req.candleSummary.priceChange > 0 ? '+' : ''}${req.candleSummary.priceChange.toFixed(1)}%)
- Range: $${req.candleSummary.lowPrice.toFixed(2)} - $${req.candleSummary.highPrice.toFixed(2)}` : ''}

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{
  "strategyDescription": "2-3 sentences describing what trading strategy this genome represents. Compare to known strategies (momentum, mean reversion, breakout, etc). Mention specific indicator combinations.",
  "marketInsight": "1-2 sentences about current market conditions and how this strategy is adapting.",
  "mutationSuggestion": "1-2 specific suggestions for which genes to mutate and why.",
  "confidence": "low/medium/high based on trade count and win rate"
}`;
}

/**
 * Call the AI analysis API endpoint
 */
export async function analyzeGenome(req: AnalysisRequest): Promise<AnalysisResult | null> {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data as AnalysisResult;
  } catch {
    return null;
  }
}

/**
 * Fallback: generate a deterministic analysis without AI
 */
export function generateFallbackAnalysis(req: AnalysisRequest): AnalysisResult {
  const d = decodeGenome(req.genome);

  // Determine strategy type
  const parts: string[] = [];
  if (d.momentumWeight > 0.6) parts.push('momentum-following');
  else if (d.momentumWeight < 0.4) parts.push('mean-reversion');
  else parts.push('balanced');

  if (d.signalThreshold < 0.4) parts.push('aggressive entry');
  else if (d.signalThreshold > 0.6) parts.push('selective entry');

  if (d.stopLossPct < 3) parts.push('tight risk management');
  else if (d.stopLossPct > 7) parts.push('loose risk management');

  const indicators: string[] = [];
  if (d.emaFast < 10) indicators.push('fast EMA crossover');
  if (d.donchianPeriod > 30) indicators.push('wide Donchian channels');
  if (d.bbStd < 2.0) indicators.push('tight Bollinger Bands');
  if (d.rsiOversold > 35) indicators.push('conservative RSI');

  const strategyDescription = `This agent employs a ${parts.join(', ')} strategy using ${indicators.length > 0 ? indicators.join(' and ') : 'standard indicator settings'}. With ${d.tradeCooldown}h trade cooldown and ${d.takeProfitPct.toFixed(1)}% take-profit targets, it ${d.signalThreshold < 0.5 ? 'trades frequently to capture small moves' : 'waits for high-conviction setups'}.`;

  const marketInsight = req.candleSummary
    ? `SOL ${req.candleSummary.priceChange > 0 ? 'rallied' : 'declined'} ${Math.abs(req.candleSummary.priceChange).toFixed(1)}% — ${d.momentumWeight > 0.5 ? 'momentum strategies are being favored by evolution' : 'mean reversion strategies are capturing the range-bound moves'}.`
    : 'Market data suggests a mixed regime where both momentum and mean-reversion strategies can find edge.';

  const suggestions: string[] = [];
  if (req.totalTrades < 5) suggestions.push('Lower signalThreshold gene to increase trade frequency');
  if (req.winRate / 100 < 40) suggestions.push('Tighten stopLossPct and increase RSI oversold threshold');
  if (req.winRate / 100 > 60 && req.totalPnl < 0) suggestions.push('Increase takeProfitPct — winning trades are being cut short');
  if (suggestions.length === 0) suggestions.push('Consider widening Donchian period for stronger breakout signals');

  return {
    strategyDescription,
    marketInsight,
    mutationSuggestion: suggestions.join('. '),
    confidence: req.totalTrades > 15 ? 'high' : req.totalTrades > 5 ? 'medium' : 'low',
  };
}
