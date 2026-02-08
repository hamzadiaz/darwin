/**
 * Live Trading Agent — deploys the best evolved genome against live price data
 * Supports paper trading (default) and live trading via Jupiter DEX
 */

import { decodeGenome, DecodedGenome } from '@/types';
import { SOL_MINT, USDC_MINT, getQuote, getJupiterSwapUrl } from './jupiter';

export type TradingMode = 'paper' | 'live';
export type Position = 'long' | 'short' | 'flat';
export type TradeSignal = 'BUY' | 'SELL' | 'HOLD';

export interface LiveTrade {
  id: string;
  timestamp: number;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  pnl: number;
  mode: TradingMode;
  jupiterUrl?: string;
  txSignature?: string;
}

export interface LiveAgentState {
  isRunning: boolean;
  mode: TradingMode;
  genome: number[];
  decodedGenome: DecodedGenome | null;
  currentPrice: number;
  previousPrices: number[];
  position: Position;
  entryPrice: number;
  signalStrength: number;
  currentSignal: TradeSignal;
  portfolioValue: number;
  initialValue: number;
  totalPnl: number;
  trades: LiveTrade[];
  lastUpdate: number;
  walletAddress: string | null;
  error: string | null;
}

const COINGECKO_PRICE_API = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

// Global state
let agentState: LiveAgentState = createDefaultState();

function createDefaultState(): LiveAgentState {
  return {
    isRunning: false,
    mode: 'paper',
    genome: [],
    decodedGenome: null,
    currentPrice: 0,
    previousPrices: [],
    position: 'flat',
    entryPrice: 0,
    signalStrength: 0,
    currentSignal: 'HOLD',
    portfolioValue: 10000,
    initialValue: 10000,
    totalPnl: 0,
    trades: [],
    lastUpdate: 0,
    walletAddress: null,
    error: null,
  };
}

export function getLiveAgentState(): LiveAgentState {
  return { ...agentState };
}

/**
 * Deploy the best genome as a live trading agent
 */
export function deployAgent(
  genome: number[],
  mode: TradingMode = 'paper',
  walletAddress: string | null = null,
  initialValue = 10000,
): LiveAgentState {
  agentState = createDefaultState();
  agentState.genome = genome;
  agentState.decodedGenome = decodeGenome(genome);
  agentState.mode = mode;
  agentState.walletAddress = walletAddress;
  agentState.isRunning = true;
  agentState.portfolioValue = initialValue;
  agentState.initialValue = initialValue;
  return agentState;
}

export function stopAgent(): void {
  agentState.isRunning = false;
}

/**
 * Fetch current SOL price from CoinGecko
 */
export async function fetchCurrentPrice(): Promise<number> {
  try {
    const res = await fetch(COINGECKO_PRICE_API, {
      headers: { Accept: 'application/json', 'User-Agent': 'Darwin/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    return data.solana?.usd ?? 0;
  } catch (err) {
    console.error('Price fetch failed:', err);
    return 0;
  }
}

/**
 * Simple signal generation for live trading based on price history
 * Uses a simplified version of the genome's strategy
 */
function generateLiveSignal(
  g: DecodedGenome,
  prices: number[],
): { signal: TradeSignal; strength: number } {
  if (prices.length < 20) return { signal: 'HOLD', strength: 0 };

  const current = prices[prices.length - 1];
  const len = prices.length;

  // Simple EMA
  const calcEMA = (period: number): number => {
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < len; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  };

  const emaFast = calcEMA(Math.min(g.emaFast, len - 1));
  const emaSlow = calcEMA(Math.min(g.emaSlow, len - 1));

  // Simple RSI
  let gains = 0, losses = 0;
  const rsiPeriod = Math.min(g.rsiPeriod, len - 1);
  for (let i = len - rsiPeriod; i < len; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const rs = losses === 0 ? 100 : gains / losses;
  const rsi = 100 - 100 / (1 + rs);

  // Price momentum
  const priceChange = len > 10 ? (current - prices[len - 10]) / prices[len - 10] : 0;

  // Score
  let bullScore = 0, bearScore = 0;

  if (emaFast > emaSlow) bullScore += 0.3 * g.momentumWeight;
  else bearScore += 0.3 * g.momentumWeight;

  if (rsi < g.rsiOversold) bullScore += 0.3;
  if (rsi > g.rsiOverbought) bearScore += 0.3;

  if (priceChange > 0.02) bullScore += 0.2;
  if (priceChange < -0.02) bearScore += 0.2;

  // Donchian breakout (simplified)
  const recentHigh = Math.max(...prices.slice(-Math.min(g.donchianPeriod, len)));
  const recentLow = Math.min(...prices.slice(-Math.min(g.donchianPeriod, len)));
  if (current >= recentHigh * 0.99) bullScore += 0.2;
  if (current <= recentLow * 1.01) bearScore += 0.2;

  const threshold = g.signalThreshold;
  const strength = Math.max(bullScore, bearScore);

  if (bullScore >= threshold && bullScore > bearScore) return { signal: 'BUY', strength };
  if (bearScore >= threshold && bearScore > bullScore) return { signal: 'SELL', strength };
  return { signal: 'HOLD', strength: Math.abs(bullScore - bearScore) };
}

/**
 * Update the live agent with a new price tick
 */
export async function updateAgent(): Promise<LiveAgentState> {
  if (!agentState.isRunning || !agentState.decodedGenome) return agentState;

  try {
    const price = await fetchCurrentPrice();
    if (price <= 0) {
      agentState.error = 'Failed to fetch price';
      return agentState;
    }

    agentState.currentPrice = price;
    agentState.previousPrices.push(price);
    // Keep last 100 prices
    if (agentState.previousPrices.length > 100) {
      agentState.previousPrices = agentState.previousPrices.slice(-100);
    }

    const g = agentState.decodedGenome;
    const { signal, strength } = generateLiveSignal(g, agentState.previousPrices);
    agentState.currentSignal = signal;
    agentState.signalStrength = strength;

    // Check existing position for stop loss / take profit
    if (agentState.position !== 'flat') {
      const pnlPct = agentState.position === 'long'
        ? ((price - agentState.entryPrice) / agentState.entryPrice) * 100
        : ((agentState.entryPrice - price) / agentState.entryPrice) * 100;

      if (pnlPct <= -g.stopLossPct || pnlPct >= g.takeProfitPct) {
        // Close position
        const trade: LiveTrade = {
          id: `t_${Date.now()}`,
          timestamp: Date.now(),
          type: agentState.position === 'long' ? 'SELL' : 'BUY',
          price,
          amount: agentState.portfolioValue * (g.positionSizePct / 100),
          pnl: pnlPct,
          mode: agentState.mode,
          jupiterUrl: agentState.mode === 'live'
            ? getJupiterSwapUrl(
              agentState.position === 'long' ? SOL_MINT : USDC_MINT,
              agentState.position === 'long' ? USDC_MINT : SOL_MINT,
            )
            : undefined,
        };
        agentState.trades.push(trade);
        agentState.portfolioValue *= (1 + pnlPct / 100);
        agentState.totalPnl = ((agentState.portfolioValue - agentState.initialValue) / agentState.initialValue) * 100;
        agentState.position = 'flat';
        agentState.entryPrice = 0;
      }

      // Check for exit signal
      if (agentState.position !== 'flat') {
        if ((agentState.position === 'long' && signal === 'SELL') ||
          (agentState.position === 'short' && signal === 'BUY')) {
          const pnl = agentState.position === 'long'
            ? ((price - agentState.entryPrice) / agentState.entryPrice) * 100
            : ((agentState.entryPrice - price) / agentState.entryPrice) * 100;

          const trade: LiveTrade = {
            id: `t_${Date.now()}`,
            timestamp: Date.now(),
            type: signal === 'BUY' ? 'BUY' : 'SELL',
            price,
            amount: agentState.portfolioValue * (g.positionSizePct / 100),
            pnl,
            mode: agentState.mode,
            jupiterUrl: agentState.mode === 'live'
              ? getJupiterSwapUrl(SOL_MINT, USDC_MINT)
              : undefined,
          };
          agentState.trades.push(trade);
          agentState.portfolioValue *= (1 + pnl / 100);
          agentState.totalPnl = ((agentState.portfolioValue - agentState.initialValue) / agentState.initialValue) * 100;
          agentState.position = 'flat';
          agentState.entryPrice = 0;
        }
      }
    }

    // Open new position
    if (agentState.position === 'flat' && signal !== 'HOLD') {
      agentState.position = signal === 'BUY' ? 'long' : 'short';
      agentState.entryPrice = price;

      const trade: LiveTrade = {
        id: `t_${Date.now()}`,
        timestamp: Date.now(),
        type: signal,
        price,
        amount: agentState.portfolioValue * (g.positionSizePct / 100),
        pnl: 0,
        mode: agentState.mode,
        jupiterUrl: agentState.mode === 'live'
          ? getJupiterSwapUrl(
            signal === 'BUY' ? USDC_MINT : SOL_MINT,
            signal === 'BUY' ? SOL_MINT : USDC_MINT,
          )
          : undefined,
      };
      agentState.trades.push(trade);
    }

    agentState.lastUpdate = Date.now();
    agentState.error = null;
  } catch (err) {
    agentState.error = err instanceof Error ? err.message : 'Update failed';
  }

  return agentState;
}
