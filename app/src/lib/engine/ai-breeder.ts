/**
 * AI-Guided Breeder — Uses Gemini to make intelligent breeding decisions
 * Instead of random crossover/mutation, the AI analyzes top genomes + market data
 * and decides which agents should breed and how to mutate.
 */

import { AgentGenome, decodeGenome, GENE_NAMES } from '@/types';
import { OHLCV } from './market';

export interface AIBreedingDecision {
  parentA: number;       // agent ID
  parentB: number;       // agent ID
  reasoning: string;     // why these two
  mutationBias: Record<string, number>; // gene name -> direction (-1 to 1)
  strategyFocus: string; // e.g. "momentum", "mean reversion", "breakout"
  marketRegime: string;  // "trending" | "ranging" | "volatile"
  confidence: number;    // 0-1
}

export interface AIBreedingResult {
  decisions: AIBreedingDecision[];
  evolutionStrategy: string;
  marketRegimeDetection: string;
  timestamp: number;
}

/**
 * Build the prompt for AI-guided breeding
 */
export function buildBreedingPrompt(
  topAgents: AgentGenome[],
  candles: OHLCV[],
  generation: number,
): string {
  const recentCandles = candles.slice(-50);
  const startPrice = recentCandles[0]?.close ?? 0;
  const endPrice = recentCandles[recentCandles.length - 1]?.close ?? 0;
  const priceChange = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);
  const highPrice = Math.max(...highs);
  const lowPrice = Math.min(...lows);
  const volatility = startPrice > 0 ? ((highPrice - lowPrice) / startPrice) * 100 : 0;

  // Calculate trend strength
  const closes = recentCandles.map(c => c.close);
  let upMoves = 0, downMoves = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) upMoves++;
    else downMoves++;
  }
  const trendRatio = closes.length > 1 ? upMoves / (upMoves + downMoves) : 0.5;

  const agentDescriptions = topAgents.slice(0, 5).map((a, idx) => {
    const decoded = decodeGenome(a.genome);
    return `Agent #${a.id} (Rank ${idx + 1}):
  PnL: ${(a.totalPnl / 100).toFixed(2)}%, Win Rate: ${(a.winRate / 100).toFixed(0)}%, Trades: ${a.totalTrades}
  Key genes: momentum=${decoded.momentumWeight.toFixed(2)}, aggressiveness=${decoded.signalThreshold.toFixed(2)}, stopLoss=${decoded.stopLossPct.toFixed(1)}%, takeProfit=${decoded.takeProfitPct.toFixed(1)}%
  EMA: ${decoded.emaFast}/${decoded.emaSlow}, RSI: ${decoded.rsiPeriod} (${decoded.rsiOversold}-${decoded.rsiOverbought}), Donchian: ${decoded.donchianPeriod}
  MACD: ${decoded.macdFast}/${decoded.macdSlow}/${decoded.macdSignal}, BB: ${decoded.bbPeriod} (${decoded.bbStd}σ), Stoch: ${decoded.stochK}/${decoded.stochD}`;
  }).join('\n\n');

  return `You are an expert genetic algorithm optimizer for trading strategies. Generation ${generation}.

## Market Conditions (SOL/USD, recent 50 candles)
- Price: $${startPrice.toFixed(2)} → $${endPrice.toFixed(2)} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%)
- Range: $${lowPrice.toFixed(2)} - $${highPrice.toFixed(2)} (volatility: ${volatility.toFixed(1)}%)
- Trend ratio: ${(trendRatio * 100).toFixed(0)}% bullish candles
- ${trendRatio > 0.6 ? 'TRENDING UP' : trendRatio < 0.4 ? 'TRENDING DOWN' : volatility > 15 ? 'HIGH VOLATILITY RANGE' : 'RANGING'}

## Top 5 Agents
${agentDescriptions}

## Gene Names (for mutation bias)
${GENE_NAMES.join(', ')}

## Instructions
Choose the best 2 parents to breed and suggest mutation biases. Consider:
1. Which agents complement each other (e.g., one has good entries, another good exits)?
2. What market regime are we in, and what genes matter most?
3. Should we lean more momentum or mean-reversion given current conditions?

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{
  "parentA": <agent_id>,
  "parentB": <agent_id>,
  "reasoning": "1-2 sentences explaining why these two should breed",
  "mutationBias": {
    "Momentum Weight": <-1 to 1, negative=decrease, positive=increase>,
    "Aggressiveness": <-1 to 1>,
    "Stop Loss %": <-1 to 1>,
    "Take Profit %": <-1 to 1>
  },
  "strategyFocus": "momentum|mean_reversion|breakout|hybrid",
  "marketRegime": "trending_up|trending_down|ranging|volatile",
  "evolutionStrategy": "1-2 sentences about overall evolution direction",
  "confidence": <0.0-1.0>
}`;
}

/**
 * Parse the AI response into a breeding decision
 */
export function parseBreedingResponse(
  text: string,
  topAgents: AgentGenome[],
): AIBreedingResult | null {
  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const validAgentIds = new Set(topAgents.map(a => a.id));
    const parentA = validAgentIds.has(parsed.parentA) ? parsed.parentA : topAgents[0]?.id ?? 0;
    const parentB = validAgentIds.has(parsed.parentB) ? parsed.parentB : topAgents[1]?.id ?? topAgents[0]?.id ?? 0;

    return {
      decisions: [{
        parentA,
        parentB,
        reasoning: parsed.reasoning || 'AI selected based on complementary traits',
        mutationBias: parsed.mutationBias || {},
        strategyFocus: parsed.strategyFocus || 'hybrid',
        marketRegime: parsed.marketRegime || 'ranging',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      }],
      evolutionStrategy: parsed.evolutionStrategy || 'Balanced evolution approach',
      marketRegimeDetection: parsed.marketRegime || 'ranging',
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Map gene display names to genome indices for applying mutation bias
 */
const GENE_NAME_TO_INDEX: Record<string, number> = {
  'Donchian Period': 0,
  'EMA Fast': 1,
  'EMA Slow': 2,
  'RSI Period': 3,
  'RSI Oversold': 4,
  'RSI Overbought': 5,
  'Stop Loss %': 6,
  'Take Profit %': 7,
  'Position Size %': 8,
  'Trade Cooldown': 9,
  'Volatility Filter': 10,
  'Momentum Weight': 11,
  'MACD Fast': 12,
  'MACD Slow': 13,
  'MACD Signal': 14,
  'BB Period': 15,
  'BB Std Dev': 16,
  'Stoch K': 17,
  'Stoch D': 18,
  'Aggressiveness': 19,
};

/**
 * Apply AI mutation bias to a genome during mutation
 * Instead of random direction, bias mutations toward AI-suggested direction
 */
export function applyMutationBias(
  genome: number[],
  bias: Record<string, number>,
  rate = 0.20,
): number[] {
  return genome.map((gene, idx) => {
    if (Math.random() > rate) return gene;

    // Find if there's a bias for this gene
    const geneName = GENE_NAMES[idx];
    const biasValue = bias[geneName] ?? 0;

    // 10% chance of complete randomization even with AI guidance (maintain diversity)
    if (Math.random() < 0.10) return Math.floor(Math.random() * 1001);

    // Biased mutation: direction influenced by AI, magnitude still somewhat random
    const magnitude = 75 + Math.random() * 175;
    let direction: number;

    if (Math.abs(biasValue) > 0.1) {
      // AI has an opinion — follow it 70% of the time
      direction = Math.random() < 0.7 ? Math.sign(biasValue) : (Math.random() < 0.5 ? -1 : 1);
    } else {
      // No strong bias — random direction
      direction = Math.random() < 0.5 ? -1 : 1;
    }

    const mutated = gene + magnitude * direction * (0.5 + Math.abs(biasValue) * 0.5);
    return Math.max(0, Math.min(1000, Math.round(mutated)));
  });
}

// Store the latest AI breeding result for display
let latestBreedingResult: AIBreedingResult | null = null;

export function getLatestBreedingResult(): AIBreedingResult | null {
  return latestBreedingResult;
}

export function setLatestBreedingResult(result: AIBreedingResult | null): void {
  latestBreedingResult = result;
}
