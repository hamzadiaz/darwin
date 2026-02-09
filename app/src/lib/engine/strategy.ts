/**
 * Trading Strategy Engine — runs a genome against candle data to produce PnL
 * Now with MACD, Bollinger Bands, Stochastic, OBV, VWAP + SHORT positions
 */

import { DecodedGenome, decodeGenome } from '@/types';
import { OHLCV } from './market';

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export interface Trade {
  entryIdx: number;
  entryPrice: number;
  exitIdx: number;
  exitPrice: number;
  side: 'long' | 'short';
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
  leverage?: number;
  simplePnlPct?: number;
  finalBalance?: number;
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

/** MACD: returns { macd, signal, histogram } arrays */
function calcMACD(closes: number[], fast: number, slow: number, sig: number): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const macd = closes.map((_, i) => emaFast[i] - emaSlow[i]);
  const signal = calcEMA(macd, sig);
  const histogram = macd.map((m, i) => m - signal[i]);
  return { macd, signal, histogram };
}

/** Bollinger Bands */
function calcBollingerBands(closes: number[], period: number, stdMult: number): { upper: number[]; middle: number[]; lower: number[] } {
  const upper: number[] = new Array(closes.length).fill(0);
  const middle: number[] = new Array(closes.length).fill(0);
  const lower: number[] = new Array(closes.length).fill(0);

  for (let i = 0; i < closes.length; i++) {
    const start = Math.max(0, i - period + 1);
    const slice = closes.slice(start, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / slice.length;
    const std = Math.sqrt(variance);
    middle[i] = mean;
    upper[i] = mean + stdMult * std;
    lower[i] = mean - stdMult * std;
  }
  return { upper, middle, lower };
}

/** Stochastic Oscillator */
function calcStochastic(candles: OHLCV[], kPeriod: number, dPeriod: number): { k: number[]; d: number[] } {
  const kArr: number[] = new Array(candles.length).fill(50);
  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - kPeriod + 1);
    let hi = -Infinity, lo = Infinity;
    for (let j = start; j <= i; j++) {
      if (candles[j].high > hi) hi = candles[j].high;
      if (candles[j].low < lo) lo = candles[j].low;
    }
    kArr[i] = hi === lo ? 50 : ((candles[i].close - lo) / (hi - lo)) * 100;
  }
  // %D is SMA of %K
  const dArr: number[] = new Array(candles.length).fill(50);
  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - dPeriod + 1);
    const slice = kArr.slice(start, i + 1);
    dArr[i] = slice.reduce((a, b) => a + b, 0) / slice.length;
  }
  return { k: kArr, d: dArr };
}

/** OBV trend direction: returns +1 (rising), -1 (falling), 0 (flat) per candle */
function calcOBVTrend(candles: OHLCV[], lookback = 10): number[] {
  const obv: number[] = new Array(candles.length).fill(0);
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) obv[i] = obv[i - 1] + candles[i].volume;
    else if (candles[i].close < candles[i - 1].close) obv[i] = obv[i - 1] - candles[i].volume;
    else obv[i] = obv[i - 1];
  }
  // Trend: compare current OBV to lookback periods ago
  const trend: number[] = new Array(candles.length).fill(0);
  for (let i = lookback; i < candles.length; i++) {
    const diff = obv[i] - obv[i - lookback];
    trend[i] = diff > 0 ? 1 : diff < 0 ? -1 : 0;
  }
  return trend;
}

/** VWAP approximation (cumulative) */
function calcVWAP(candles: OHLCV[]): number[] {
  const vwap: number[] = new Array(candles.length).fill(0);
  let cumVP = 0, cumVol = 0;
  for (let i = 0; i < candles.length; i++) {
    const tp = (candles[i].high + candles[i].low + candles[i].close) / 3;
    cumVP += tp * candles[i].volume;
    cumVol += candles[i].volume;
    vwap[i] = cumVol > 0 ? cumVP / cumVol : tp;
  }
  return vwap;
}

// ─── Trading Fees (realistic Binance costs) ───

/** Taker fee per side: 0.1% */
const TAKER_FEE_PCT = 0.1;
/** Slippage per side: 0.05% */
const SLIPPAGE_PCT = 0.05;
/** Total round-trip cost (entry + exit): (0.1 + 0.05) * 2 = 0.30% */
const ROUND_TRIP_COST_PCT = (TAKER_FEE_PCT + SLIPPAGE_PCT) * 2;
/** Per-side cost for applying to entry/exit individually */
const PER_SIDE_COST_PCT = TAKER_FEE_PCT + SLIPPAGE_PCT; // 0.15%
/** Funding rate: ~0.01% per 8h on perpetual futures (applied per 4h candle = 0.005%) */
const FUNDING_RATE_PER_CANDLE = 0.005;

// ─── Main strategy runner ───

export function runStrategy(rawGenome: number[], candles: OHLCV[]): StrategyResult {
  const g: DecodedGenome = decodeGenome(rawGenome);
  const closes = candles.map((c) => c.close);

  // Pre-compute all indicators
  const emaFast = calcEMA(closes, g.emaFast);
  const emaSlow = calcEMA(closes, g.emaSlow);
  const rsi = calcRSI(closes, g.rsiPeriod);
  const atr = calcATR(candles, 14);
  const donchian = calcDonchian(candles, g.donchianPeriod);
  const macd = calcMACD(closes, g.macdFast, g.macdSlow, g.macdSignal);
  const bb = calcBollingerBands(closes, g.bbPeriod, g.bbStd);
  const stoch = calcStochastic(candles, g.stochK, g.stochD);
  const obvTrend = calcOBVTrend(candles);
  const vwap = calcVWAP(candles);

  const indicators = { emaFast, emaSlow, rsi, donchian, macd, bb, stoch, obvTrend, vwap };

  const trades: Trade[] = [];
  let position: 'none' | 'long' | 'short' = 'none';
  let entryIdx = 0;
  let entryPrice = 0;
  let lastTradeIdx = 0;

  // Minimum warmup period
  const warmup = Math.max(g.emaSlow, g.donchianPeriod, g.rsiPeriod, g.macdSlow, g.bbPeriod, g.stochK) + 2;
  // Cooldown in candle-units (candles are 4h, cooldown is in hours)
  const cooldownCandles = Math.max(1, Math.round(g.tradeCooldown / 4));

  // Liquidation threshold: at Nx leverage, ~100/N % adverse move = liquidation
  // We use 95/leverage to account for fees eating into margin
  const liquidationPct = 95 / g.leverage;

  for (let i = warmup; i < candles.length; i++) {
    const price = closes[i];
    const atrPct = atr[i] / price;

    if (position !== 'none') {
      // Calculate PnL based on position direction (raw price change %)
      const pnl = position === 'long'
        ? ((price - entryPrice) / entryPrice) * 100
        : ((entryPrice - price) / entryPrice) * 100;

      // Also check intra-candle worst price (wick) for liquidation
      const worstPrice = position === 'long' ? candles[i].low : candles[i].high;
      const worstPnl = position === 'long'
        ? ((worstPrice - entryPrice) / entryPrice) * 100
        : ((entryPrice - worstPrice) / entryPrice) * 100;

      // Funding cost: accumulated per candle the position is held
      // Note: this is in raw price % terms — leverage is applied in the compounding loop
      const holdingCandles = i - entryIdx;
      const fundingCostPct = FUNDING_RATE_PER_CANDLE * holdingCandles;

      // Check LIQUIDATION first — if leveraged loss exceeds margin, position is liquidated
      // At 15x leverage, ~6.33% adverse move = liquidation (95/15)
      if (g.leverage > 1 && worstPnl <= -liquidationPct) {
        trades.push({
          entryIdx, entryPrice,
          exitIdx: i, exitPrice: price,
          side: position, pnlPct: -liquidationPct, // lose entire margin (no fees matter, it's all gone)
          exitReason: 'sl',
        });
        position = 'none';
        lastTradeIdx = i;
        continue;
      }

      // Check stop loss
      if (pnl <= -g.stopLossPct) {
        trades.push({
          entryIdx, entryPrice,
          exitIdx: i, exitPrice: price,
          side: position, pnlPct: -g.stopLossPct - ROUND_TRIP_COST_PCT - fundingCostPct,
          exitReason: 'sl',
        });
        position = 'none';
        lastTradeIdx = i;
        continue;
      }

      // Check take profit (fees + funding subtracted from profit)
      if (pnl >= g.takeProfitPct) {
        trades.push({
          entryIdx, entryPrice,
          exitIdx: i, exitPrice: price,
          side: position, pnlPct: g.takeProfitPct - ROUND_TRIP_COST_PCT - fundingCostPct,
          exitReason: 'tp',
        });
        position = 'none';
        lastTradeIdx = i;
        continue;
      }

      // Check exit signal (opposite signal)
      const signal = generateSignal(g, i, indicators, closes, atrPct);
      if ((position === 'long' && signal === 'SELL') || (position === 'short' && signal === 'BUY')) {
        trades.push({
          entryIdx, entryPrice,
          exitIdx: i, exitPrice: price,
          side: position, pnlPct: pnl - ROUND_TRIP_COST_PCT - fundingCostPct,
          exitReason: 'signal',
        });
        position = 'none';
        lastTradeIdx = i;
        // Allow immediate re-entry in opposite direction
        if (i - lastTradeIdx >= 0) {
          if (signal === 'BUY') { position = 'long'; entryIdx = i; entryPrice = price; }
          else if (signal === 'SELL') { position = 'short'; entryIdx = i; entryPrice = price; }
        }
      }
    } else {
      // Check cooldown
      if (i - lastTradeIdx < cooldownCandles) continue;

      const signal = generateSignal(g, i, indicators, closes, atrPct);
      if (signal === 'BUY') {
        position = 'long';
        entryIdx = i;
        entryPrice = price;
      } else if (signal === 'SELL') {
        position = 'short';
        entryIdx = i;
        entryPrice = price;
      }
    }
  }

  // Close any open position at end
  if (position !== 'none') {
    const lastPrice = closes[closes.length - 1];
    const pnl = position === 'long'
      ? ((lastPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - lastPrice) / entryPrice) * 100;
    const holdCandles = (candles.length - 1) - entryIdx;
    const fundCost = FUNDING_RATE_PER_CANDLE * holdCandles;
    trades.push({
      entryIdx, entryPrice,
      exitIdx: candles.length - 1, exitPrice: lastPrice,
      side: position, pnlPct: pnl - ROUND_TRIP_COST_PCT - fundCost,
      exitReason: 'signal',
    });
  }

  // Calculate results with LEVERAGE + COMPOUNDING (Donchian-style)
  const leverage = g.leverage; // 1-15x
  const positionSizeFrac = g.positionSizePct / 100; // fraction of balance for position size (5-25%)
  const riskPerTrade = g.riskPerTrade / 100; // max risk per trade as drawdown cap (5-30%)
  // Note: positionSize * leverage can exceed 100% (isolated margin — risk is capped at margin/posSize)

  const wins = trades.filter((t) => t.pnlPct > 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  // Simple sum PnL (unleveraged, for reference)
  const simplePnl = trades.reduce((sum, t) => sum + t.pnlPct, 0);

  // Compounded leveraged PnL — simulates actual account growth
  // Start with $10,000 account
  // Balance is capped at 100x starting ($1M) to model realistic liquidity/slippage limits
  const STARTING_BALANCE = 10000;
  const MAX_BALANCE = STARTING_BALANCE * 100; // $1M cap — beyond this, market impact makes results unrealistic
  let balance = STARTING_BALANCE;
  let peakBalance = STARTING_BALANCE;
  let maxDD = 0;

  for (const t of trades) {
    // Cap balance for position sizing (profits above cap are banked but don't compound)
    const effectiveBalance = Math.min(balance, MAX_BALANCE);
    // Position size = balance * positionSizePct (capped at riskPerTrade for risk management)
    const posSize = Math.min(effectiveBalance * riskPerTrade, effectiveBalance * positionSizeFrac);
    // Leveraged PnL on this trade
    const tradePnl = posSize * leverage * (t.pnlPct / 100);

    // Liquidation check: if loss exceeds margin (posSize), cap at -posSize
    // This prevents balance going negative — like having a stop at liquidation price
    const cappedPnl = Math.max(tradePnl, -posSize);
    balance += cappedPnl;

    // Track drawdown
    if (balance > peakBalance) peakBalance = balance;
    const dd = ((peakBalance - balance) / peakBalance) * 100;
    if (dd > maxDD) maxDD = dd;

    // Account blown — stop trading
    if (balance <= 0) {
      balance = 0;
      break;
    }
  }

  // Total PnL as percentage of starting balance
  const totalPnlPct = ((balance - 10000) / 10000) * 100;

  // Sharpe approximation
  const returns = trades.map((t) => t.pnlPct * leverage);
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
    leverage,
    simplePnlPct: simplePnl,
    finalBalance: Math.round(balance),
  };
}

interface Indicators {
  emaFast: number[];
  emaSlow: number[];
  rsi: number[];
  donchian: { upper: number[]; lower: number[] };
  macd: { macd: number[]; signal: number[]; histogram: number[] };
  bb: { upper: number[]; middle: number[]; lower: number[] };
  stoch: { k: number[]; d: number[] };
  obvTrend: number[];
  vwap: number[];
}

function generateSignal(
  g: DecodedGenome,
  i: number,
  ind: Indicators,
  closes: number[],
  atrPct: number,
): Signal {
  // Volatility filter: skip if ATR% is below threshold (market too quiet)
  if (g.volatilityFilter > 0.3 && atrPct < g.volatilityFilter * 0.02) return 'HOLD';

  let bullScore = 0;
  let bearScore = 0;
  const mw = g.momentumWeight;
  const mrWeight = 1 - mw;

  // 1. EMA crossover — strong momentum signal
  if (ind.emaFast[i] > ind.emaSlow[i] && ind.emaFast[i - 1] <= ind.emaSlow[i - 1]) bullScore += 0.4;
  if (ind.emaFast[i] < ind.emaSlow[i] && ind.emaFast[i - 1] >= ind.emaSlow[i - 1]) bearScore += 0.4;
  // EMA trend (continuous)
  if (ind.emaFast[i] > ind.emaSlow[i]) bullScore += mw * 0.2;
  if (ind.emaFast[i] < ind.emaSlow[i]) bearScore += mw * 0.2;

  // 2. RSI — mean reversion
  if (ind.rsi[i] < g.rsiOversold) bullScore += 0.2 + mrWeight * 0.2;
  if (ind.rsi[i] > g.rsiOverbought) bearScore += 0.2 + mrWeight * 0.2;
  // RSI midline cross
  if (ind.rsi[i] > 50 && ind.rsi[i - 1] <= 50) bullScore += 0.1;
  if (ind.rsi[i] < 50 && ind.rsi[i - 1] >= 50) bearScore += 0.1;

  // 3. Donchian breakout
  if (closes[i] >= ind.donchian.upper[i - 1]) bullScore += 0.2 + mw * 0.15;
  if (closes[i] <= ind.donchian.lower[i - 1]) bearScore += 0.2 + mw * 0.15;

  // 4. MACD crossover
  if (ind.macd.histogram[i] > 0 && ind.macd.histogram[i - 1] <= 0) bullScore += 0.3;
  if (ind.macd.histogram[i] < 0 && ind.macd.histogram[i - 1] >= 0) bearScore += 0.3;
  // MACD trend
  if (ind.macd.histogram[i] > 0) bullScore += 0.1;
  if (ind.macd.histogram[i] < 0) bearScore += 0.1;

  // 5. Bollinger Bands — mean reversion
  if (closes[i] < ind.bb.lower[i]) bullScore += 0.2 + mrWeight * 0.15;
  if (closes[i] > ind.bb.upper[i]) bearScore += 0.2 + mrWeight * 0.15;
  // Price crossing middle band
  if (closes[i] > ind.bb.middle[i] && closes[i - 1] <= ind.bb.middle[i]) bullScore += 0.1;
  if (closes[i] < ind.bb.middle[i] && closes[i - 1] >= ind.bb.middle[i]) bearScore += 0.1;

  // 6. Stochastic — oversold/overbought
  if (ind.stoch.k[i] < 20) bullScore += 0.15;
  if (ind.stoch.k[i] > 80) bearScore += 0.15;
  // Stochastic crossover (%K crosses %D)
  if (ind.stoch.k[i] > ind.stoch.d[i] && ind.stoch.k[i - 1] <= ind.stoch.d[i - 1]) bullScore += 0.15;
  if (ind.stoch.k[i] < ind.stoch.d[i] && ind.stoch.k[i - 1] >= ind.stoch.d[i - 1]) bearScore += 0.15;

  // 7. OBV trend confirmation
  if (ind.obvTrend[i] > 0) bullScore += 0.1;
  if (ind.obvTrend[i] < 0) bearScore += 0.1;

  // 8. VWAP — price relative to VWAP
  if (closes[i] > ind.vwap[i]) bullScore += 0.1;
  if (closes[i] < ind.vwap[i]) bearScore += 0.1;

  // Signal threshold from genome (lower = more aggressive = more trades)
  const threshold = g.signalThreshold;

  if (bullScore >= threshold && bullScore > bearScore) return 'BUY';
  if (bearScore >= threshold && bearScore > bullScore) return 'SELL';
  return 'HOLD';
}
