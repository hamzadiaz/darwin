/**
 * Trading Strategy Engine — runs a genome against candle data to produce PnL
 */

import { DecodedGenome, decodeGenome } from '@/types';
import { OHLCV } from './market';

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export interface Trade {
  entryIdx: number;
  entryPrice: number;
  exitIdx: number;
  exitPrice: number;
  side: 'long';
  pnlPct: number;
  exitReason: 'tp' | 'sl' | 'signal';
}

export interface StrategyResult {
  trades: Trade[];
  totalPnlPct: number;
  winRate: number;       // 0-100
  totalTrades: number;
  maxDrawdownPct: number;
  sharpeApprox: number;
}

// ─── Indicator calculations ───

function calcEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

function calcRSI(closes: number[], period: number): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;

  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gainSum += diff;
    else lossSum -= diff;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const diff = closes[i] - closes[i - 1];
      avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }
  return rsi;
}

function calcATR(candles: OHLCV[], period: number): number[] {
  const atr: number[] = new Array(candles.length).fill(0);
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close),
    );
    if (i < period) {
      atr[i] = tr;
    } else if (i === period) {
      let sum = 0;
      for (let j = 1; j <= period; j++) {
        const tr2 = Math.max(
          candles[j].high - candles[j].low,
          Math.abs(candles[j].high - candles[j - 1].close),
          Math.abs(candles[j].low - candles[j - 1].close),
        );
        sum += tr2;
      }
      atr[i] = sum / period;
    } else {
      atr[i] = (atr[i - 1] * (period - 1) + tr) / period;
    }
  }
  return atr;
}

function calcDonchian(candles: OHLCV[], period: number): { upper: number[]; lower: number[] } {
  const upper: number[] = new Array(candles.length).fill(0);
  const lower: number[] = new Array(candles.length).fill(0);
  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - period + 1);
    let hi = -Infinity, lo = Infinity;
    for (let j = start; j <= i; j++) {
      if (candles[j].high > hi) hi = candles[j].high;
      if (candles[j].low < lo) lo = candles[j].low;
    }
    upper[i] = hi;
    lower[i] = lo;
  }
  return { upper, lower };
}

// ─── Main strategy runner ───

export function runStrategy(rawGenome: number[], candles: OHLCV[]): StrategyResult {
  const g: DecodedGenome = decodeGenome(rawGenome);
  const closes = candles.map((c) => c.close);

  // Pre-compute indicators
  const emaFast = calcEMA(closes, g.emaFast);
  const emaSlow = calcEMA(closes, g.emaSlow);
  const rsi = calcRSI(closes, g.rsiPeriod);
  const atr = calcATR(candles, 14);
  const donchian = calcDonchian(candles, g.donchianPeriod);

  const trades: Trade[] = [];
  let inPosition = false;
  let entryIdx = 0;
  let entryPrice = 0;
  let lastTradeIdx = 0;

  // Minimum warmup period
  const warmup = Math.max(g.emaSlow, g.donchianPeriod, g.rsiPeriod) + 1;
  // Cooldown in candle-units (candles are 4h, cooldown is in hours)
  const cooldownCandles = Math.max(1, Math.round(g.tradeCooldown / 4));

  for (let i = warmup; i < candles.length; i++) {
    const price = closes[i];
    const atrPct = atr[i] / price; // typically 0.02-0.05 for SOL
    const volThreshold = g.volatilityFilter; // 0-1, compared directly to atrPct in generateSignal

    if (inPosition) {
      // Check stop loss / take profit
      const pnl = ((price - entryPrice) / entryPrice) * 100;

      if (pnl <= -g.stopLossPct) {
        trades.push({
          entryIdx, entryPrice,
          exitIdx: i, exitPrice: price,
          side: 'long', pnlPct: -g.stopLossPct,
          exitReason: 'sl',
        });
        inPosition = false;
        lastTradeIdx = i;
        continue;
      }

      if (pnl >= g.takeProfitPct) {
        trades.push({
          entryIdx, entryPrice,
          exitIdx: i, exitPrice: price,
          side: 'long', pnlPct: g.takeProfitPct,
          exitReason: 'tp',
        });
        inPosition = false;
        lastTradeIdx = i;
        continue;
      }

      // Check sell signal
      const sellSignal = generateSignal(g, i, emaFast, emaSlow, rsi, donchian, closes, atrPct, volThreshold);
      if (sellSignal === 'SELL') {
        trades.push({
          entryIdx, entryPrice,
          exitIdx: i, exitPrice: price,
          side: 'long', pnlPct: pnl,
          exitReason: 'signal',
        });
        inPosition = false;
        lastTradeIdx = i;
      }
    } else {
      // Check cooldown
      if (i - lastTradeIdx < cooldownCandles) continue;

      const signal = generateSignal(g, i, emaFast, emaSlow, rsi, donchian, closes, atrPct, volThreshold);
      if (signal === 'BUY') {
        inPosition = true;
        entryIdx = i;
        entryPrice = price;
      }
    }
  }

  // Close any open position at end
  if (inPosition) {
    const lastPrice = closes[closes.length - 1];
    const pnl = ((lastPrice - entryPrice) / entryPrice) * 100;
    trades.push({
      entryIdx, entryPrice,
      exitIdx: candles.length - 1, exitPrice: lastPrice,
      side: 'long', pnlPct: pnl,
      exitReason: 'signal',
    });
  }

  // Calculate results
  const wins = trades.filter((t) => t.pnlPct > 0).length;
  const totalPnlPct = trades.reduce((sum, t) => sum + t.pnlPct, 0);
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  // Max drawdown
  let peak = 0, maxDD = 0, cumPnl = 0;
  for (const t of trades) {
    cumPnl += t.pnlPct;
    if (cumPnl > peak) peak = cumPnl;
    const dd = peak - cumPnl;
    if (dd > maxDD) maxDD = dd;
  }

  // Sharpe approximation (mean return / std dev of returns)
  const returns = trades.map((t) => t.pnlPct);
  const mean = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 1
    ? returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1)
    : 1;
  const sharpe = variance > 0 ? mean / Math.sqrt(variance) : 0;

  return {
    trades,
    totalPnlPct,
    winRate,
    totalTrades: trades.length,
    maxDrawdownPct: maxDD,
    sharpeApprox: sharpe,
  };
}

function generateSignal(
  g: DecodedGenome,
  i: number,
  emaFast: number[],
  emaSlow: number[],
  rsi: number[],
  donchian: { upper: number[]; lower: number[] },
  closes: number[],
  atrPct: number,
  volThreshold: number,
): Signal {
  // Volatility filter: skip if ATR% is below threshold (market too quiet)
  // volThreshold 0-1 maps to 0-3% ATR threshold
  if (volThreshold > 0.1 && atrPct < volThreshold * 0.03) return 'HOLD';

  let bullScore = 0;
  let bearScore = 0;
  const mw = g.momentumWeight; // 0-1: higher = more momentum, lower = more mean reversion

  // EMA crossover (momentum) — strong signal
  if (emaFast[i] > emaSlow[i] && emaFast[i - 1] <= emaSlow[i - 1]) bullScore += 0.6;
  if (emaFast[i] < emaSlow[i] && emaFast[i - 1] >= emaSlow[i - 1]) bearScore += 0.6;
  // EMA trend (continuous) — weighted by momentum preference
  if (emaFast[i] > emaSlow[i]) bullScore += mw * 0.4;
  if (emaFast[i] < emaSlow[i]) bearScore += mw * 0.4;

  // RSI (mean reversion component) — weighted by (1-momentum)
  const mrWeight = 1 - mw;
  if (rsi[i] < g.rsiOversold) bullScore += 0.3 + mrWeight * 0.4;
  if (rsi[i] > g.rsiOverbought) bearScore += 0.3 + mrWeight * 0.4;

  // Donchian breakout (momentum)
  if (closes[i] >= donchian.upper[i - 1]) bullScore += 0.3 + mw * 0.3;
  if (closes[i] <= donchian.lower[i - 1]) bearScore += 0.3 + mw * 0.3;

  // Signal threshold: 0.5
  if (bullScore >= 0.5) return 'BUY';
  if (bearScore >= 0.5) return 'SELL';
  return 'HOLD';
}
