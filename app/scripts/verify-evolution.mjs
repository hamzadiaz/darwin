/**
 * Verification script: Run 10 generations and print diversity metrics.
 * Usage: cd app && node --experimental-specifier-resolution=node --loader tsx scripts/verify-evolution.mjs
 * Or: cd app && npx tsx scripts/verify-evolution.mjs
 */

// We'll inline the logic since imports from TS need a loader

// === Genome utilities ===
function createRandomGenome() {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 1001));
}

function decodeGenome(raw) {
  const scale = (val, min, max) => min + (val / 1000) * (max - min);
  return {
    donchianPeriod: Math.round(scale(raw[0], 10, 50)),
    emaFast: Math.round(scale(raw[1], 5, 20)),
    emaSlow: Math.round(scale(raw[2], 20, 100)),
    rsiPeriod: Math.round(scale(raw[3], 7, 21)),
    rsiOversold: Math.round(scale(raw[4], 20, 40)),
    rsiOverbought: Math.round(scale(raw[5], 60, 80)),
    stopLossPct: scale(raw[6], 1, 10),
    takeProfitPct: scale(raw[7], 2, 30),
    positionSizePct: scale(raw[8], 5, 25),
    tradeCooldown: Math.round(scale(raw[9], 1, 24)),
    volatilityFilter: scale(raw[10], 0, 1),
    momentumWeight: scale(raw[11], 0, 1),
  };
}

// === Indicators ===
function calcEMA(data, period) {
  const ema = [];
  const k = 2 / (period + 1);
  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

function calcRSI(closes, period) {
  const rsi = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gainSum += diff; else lossSum -= diff;
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

function calcATR(candles, period) {
  const atr = new Array(candles.length).fill(0);
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close),
    );
    if (i < period) { atr[i] = tr; }
    else if (i === period) {
      let sum = 0;
      for (let j = 1; j <= period; j++) {
        sum += Math.max(candles[j].high - candles[j].low, Math.abs(candles[j].high - candles[j-1].close), Math.abs(candles[j].low - candles[j-1].close));
      }
      atr[i] = sum / period;
    } else { atr[i] = (atr[i-1] * (period-1) + tr) / period; }
  }
  return atr;
}

function calcDonchian(candles, period) {
  const upper = new Array(candles.length).fill(0);
  const lower = new Array(candles.length).fill(0);
  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - period + 1);
    let hi = -Infinity, lo = Infinity;
    for (let j = start; j <= i; j++) {
      if (candles[j].high > hi) hi = candles[j].high;
      if (candles[j].low < lo) lo = candles[j].low;
    }
    upper[i] = hi; lower[i] = lo;
  }
  return { upper, lower };
}

// === Signal generation ===
function generateSignal(g, i, emaFast, emaSlow, rsi, donchian, closes, atrPct, volThreshold) {
  if (volThreshold > 0.1 && atrPct < volThreshold * 0.03) return 'HOLD';
  let bullScore = 0, bearScore = 0;
  const mw = g.momentumWeight;
  if (emaFast[i] > emaSlow[i] && emaFast[i-1] <= emaSlow[i-1]) bullScore += 0.6;
  if (emaFast[i] < emaSlow[i] && emaFast[i-1] >= emaSlow[i-1]) bearScore += 0.6;
  if (emaFast[i] > emaSlow[i]) bullScore += mw * 0.4;
  if (emaFast[i] < emaSlow[i]) bearScore += mw * 0.4;
  const mrWeight = 1 - mw;
  if (rsi[i] < g.rsiOversold) bullScore += 0.3 + mrWeight * 0.4;
  if (rsi[i] > g.rsiOverbought) bearScore += 0.3 + mrWeight * 0.4;
  if (closes[i] >= donchian.upper[i-1]) bullScore += 0.3 + mw * 0.3;
  if (closes[i] <= donchian.lower[i-1]) bearScore += 0.3 + mw * 0.3;
  if (bullScore >= 0.5) return 'BUY';
  if (bearScore >= 0.5) return 'SELL';
  return 'HOLD';
}

// === Strategy runner ===
function runStrategy(rawGenome, candles) {
  const g = decodeGenome(rawGenome);
  const closes = candles.map(c => c.close);
  const emaFast = calcEMA(closes, g.emaFast);
  const emaSlow = calcEMA(closes, g.emaSlow);
  const rsi = calcRSI(closes, g.rsiPeriod);
  const atr = calcATR(candles, 14);
  const donchian = calcDonchian(candles, g.donchianPeriod);
  const trades = [];
  let inPosition = false, entryIdx = 0, entryPrice = 0, lastTradeIdx = 0;
  const warmup = Math.max(g.emaSlow, g.donchianPeriod, g.rsiPeriod) + 1;
  const cooldownCandles = Math.max(1, Math.round(g.tradeCooldown / 4));

  for (let i = warmup; i < candles.length; i++) {
    const price = closes[i];
    const atrPct = atr[i] / price;
    const volThreshold = g.volatilityFilter;
    if (inPosition) {
      const pnl = ((price - entryPrice) / entryPrice) * 100;
      if (pnl <= -g.stopLossPct) { trades.push({ pnlPct: -g.stopLossPct, exitReason: 'sl' }); inPosition = false; lastTradeIdx = i; continue; }
      if (pnl >= g.takeProfitPct) { trades.push({ pnlPct: g.takeProfitPct, exitReason: 'tp' }); inPosition = false; lastTradeIdx = i; continue; }
      const sig = generateSignal(g, i, emaFast, emaSlow, rsi, donchian, closes, atrPct, volThreshold);
      if (sig === 'SELL') { trades.push({ pnlPct: pnl, exitReason: 'signal' }); inPosition = false; lastTradeIdx = i; }
    } else {
      if (i - lastTradeIdx < cooldownCandles) continue;
      const sig = generateSignal(g, i, emaFast, emaSlow, rsi, donchian, closes, atrPct, volThreshold);
      if (sig === 'BUY') { inPosition = true; entryIdx = i; entryPrice = price; }
    }
  }
  if (inPosition) {
    const lastPrice = closes[closes.length - 1];
    trades.push({ pnlPct: ((lastPrice - entryPrice) / entryPrice) * 100, exitReason: 'signal' });
  }
  const wins = trades.filter(t => t.pnlPct > 0).length;
  const totalPnlPct = trades.reduce((s, t) => s + t.pnlPct, 0);
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  return { totalPnlPct, winRate, totalTrades: trades.length, trades };
}

// === Genetics ===
function tournamentSelect(agents, tournamentSize = 3) {
  let best = null;
  for (let i = 0; i < tournamentSize; i++) {
    const c = agents[Math.floor(Math.random() * agents.length)];
    if (!best || c.totalPnlPct > best.totalPnlPct) best = c;
  }
  return best;
}

function crossover(pA, pB) {
  return pA.map((g, i) => Math.random() < 0.5 ? g : pB[i]);
}

function mutate(genome, rate = 0.20) {
  return genome.map(gene => {
    if (Math.random() > rate) return gene;
    if (Math.random() < 0.15) return Math.floor(Math.random() * 1001);
    const offset = 75 + Math.random() * 175;
    const dir = Math.random() < 0.5 ? -1 : 1;
    return Math.max(0, Math.min(1000, Math.round(gene + offset * dir)));
  });
}

function evolveGeneration(agents, popSize = 20) {
  const sorted = [...agents].sort((a, b) => b.totalPnlPct - a.totalPnlPct);
  const eliteCount = Math.max(1, Math.round(popSize * 0.20));
  const elite = sorted.slice(0, eliteCount);
  const immigrantCount = Math.max(2, Math.round(popSize * 0.15));
  const childCount = popSize - eliteCount - immigrantCount;
  const genomes = [];
  for (const e of elite) genomes.push([...e.genome]);
  for (let i = 0; i < childCount; i++) {
    const pA = tournamentSelect(agents);
    let pB = tournamentSelect(agents);
    let att = 0;
    while (pB.id === pA.id && att < 5) { pB = tournamentSelect(agents); att++; }
    genomes.push(mutate(crossover(pA.genome, pB.genome)));
  }
  for (let i = 0; i < immigrantCount; i++) genomes.push(createRandomGenome());
  return genomes;
}

// === Synthetic candles ===
function generateCandles(count = 200) {
  const candles = [];
  let price = 120 + Math.random() * 30;
  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < count; i++) {
    const vol = 0.02 + Math.random() * 0.03;
    const drift = (Math.random() - 0.52) * vol;
    const open = price;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + Math.random() * vol * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * vol * 0.5);
    candles.push({ time: now - (count - i) * 14400, open, high, low, close, volume: 1000 });
    price = close;
  }
  return candles;
}

function getCandleSlice(candles, generation) {
  const windowSize = Math.min(candles.length, Math.max(150, Math.floor(candles.length * 0.65)));
  const maxShift = Math.max(1, candles.length - windowSize);
  const shift = (generation * 10) % maxShift;
  return candles.slice(shift, shift + windowSize);
}

// === MAIN ===
console.log('=== Darwin Evolution Verification ===\n');

const POP = 20;
const GENS = 10;
const candles = generateCandles(300);
console.log(`Candles: ${candles.length}, Population: ${POP}, Generations: ${GENS}\n`);

// Test 1: Do different genomes produce different results?
console.log('--- TEST 1: Genome diversity produces PnL diversity ---');
const testGenomes = Array.from({ length: 20 }, () => createRandomGenome());
const testResults = testGenomes.map(g => runStrategy(g, candles));
const pnls = testResults.map(r => r.totalPnlPct);
const uniquePnls = new Set(pnls.map(p => p.toFixed(4))).size;
const std = Math.sqrt(pnls.reduce((s, p) => s + (p - pnls.reduce((a,b)=>a+b,0)/pnls.length)**2, 0) / pnls.length);
console.log(`  Unique PnL values: ${uniquePnls}/${POP}`);
console.log(`  PnL range: ${Math.min(...pnls).toFixed(2)}% to ${Math.max(...pnls).toFixed(2)}%`);
console.log(`  Std dev: ${std.toFixed(4)}`);
console.log(`  Trades range: ${Math.min(...testResults.map(r=>r.totalTrades))} to ${Math.max(...testResults.map(r=>r.totalTrades))}`);
console.log(uniquePnls >= 10 ? '  ✅ PASS: Good diversity' : '  ❌ FAIL: Too many identical results');

// Test 2: Mutation actually changes genomes
console.log('\n--- TEST 2: Mutation effectiveness ---');
const baseGenome = [0, 0, 0, 0, 0, 500, 500, 500, 500, 500, 1000, 1000];
const mutated = Array.from({ length: 100 }, () => mutate([...baseGenome]));
const gene0vals = new Set(mutated.map(g => g[0]));
console.log(`  Gene 0 (was 0) unique values after 100 mutations: ${gene0vals.size}`);
console.log(`  Gene 0 escaped zero: ${mutated.filter(g => g[0] !== 0).length}/100`);
console.log(gene0vals.size > 5 ? '  ✅ PASS: Gene 0 can escape' : '  ❌ FAIL: Gene stuck at 0');

// Test 3: Run evolution loop
console.log('\n--- TEST 3: Evolution over 10 generations ---');
let agents = Array.from({ length: POP }, (_, i) => ({
  id: i + 1,
  genome: createRandomGenome(),
  totalPnlPct: 0, winRate: 0, totalTrades: 0, sharpe: 0,
}));

let nextId = POP + 1;
for (let gen = 0; gen < GENS; gen++) {
  const slice = getCandleSlice(candles, gen);
  // Evaluate
  for (const a of agents) {
    const r = runStrategy(a.genome, slice);
    a.totalPnlPct = r.totalPnlPct;
    a.winRate = r.winRate;
    a.totalTrades = r.totalTrades;
  }
  const genPnls = agents.map(a => a.totalPnlPct);
  const genUnique = new Set(genPnls.map(p => p.toFixed(2))).size;
  const genStd = Math.sqrt(genPnls.reduce((s, p) => s + (p - genPnls.reduce((a,b)=>a+b,0)/genPnls.length)**2, 0) / genPnls.length);
  const genTrades = agents.map(a => a.totalTrades);
  console.log(`  Gen ${gen}: PnL [${Math.min(...genPnls).toFixed(1)}, ${Math.max(...genPnls).toFixed(1)}] σ=${genStd.toFixed(2)} unique=${genUnique}/${POP} trades=[${Math.min(...genTrades)},${Math.max(...genTrades)}]`);

  if (gen < GENS - 1) {
    const newGenomes = evolveGeneration(agents, POP);
    agents = newGenomes.map((genome, i) => ({
      id: nextId++,
      genome,
      totalPnlPct: 0, winRate: 0, totalTrades: 0, sharpe: 0,
    }));
  }
}

console.log('\n=== Verification complete ===');
