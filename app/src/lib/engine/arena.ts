/**
 * Arena — the main evolution loop. Manages population, runs backtests, evolves.
 */

import { OHLCV, fetchCandles, fetchCandlesForPeriod, TradingPair, getPairLabel } from './market';
import { runStrategy, Trade } from './strategy';
import { createRandomGenome, evolveGeneration, AgentResult, mutate } from './genetics';
import { AgentGenome, Generation } from '@/types';
import { AIBreedingResult, applyMutationBias, getLatestBreedingResult } from './ai-breeder';
import { BATTLE_TEST_PERIODS, PeriodId } from './periods';
import { crossover } from './genetics';

export interface BattleEvent {
  gen: number;
  type: 'kill' | 'survive' | 'born' | 'new-best';
  agentId: number;
  pnl?: number;
  parentA?: number;
  parentB?: number;
  message: string;
}

export interface ArenaState {
  status: 'idle' | 'running' | 'paused' | 'complete';
  currentGeneration: number;
  maxGenerations: number;
  populationSize: number;
  agents: AgentGenome[];
  generations: Generation[];
  candles: OHLCV[];
  agentTrades: Map<number, Trade[]>; // agentId -> trades
  bestEverPnl: number;
  bestEverAgentId: number;
  nextAgentId: number;
  aiGuidedEvolution: boolean;
  lastAIBreedingResult: AIBreedingResult | null;
  symbol: TradingPair;
  period: string | null; // period ID or null for default (last 500 candles)
  battleEvents: BattleEvent[];
  battlePeriodsLoaded: string[];
}

let arena: ArenaState | null = null;

/** Reset arena to idle (no state) */
export function resetArena(): void {
  arena = null;
}
let runningPromise: Promise<void> | null = null;

export function getArenaState(): ArenaState | null {
  return arena;
}

export function initArena(populationSize = 20, maxGenerations = 50, symbol: TradingPair = 'SOLUSDT', period: string | null = null): ArenaState {
  const agents: AgentGenome[] = [];
  for (let i = 0; i < populationSize; i++) {
    agents.push({
      id: i + 1,
      generation: 0,
      parentA: null,
      parentB: null,
      genome: createRandomGenome(),
      bornAt: Date.now(),
      diedAt: null,
      totalPnl: 0,
      totalTrades: 0,
      winRate: 0,
      isAlive: true,
      owner: '11111111111111111111111111111111',
    });
  }

  arena = {
    status: 'idle',
    currentGeneration: 0,
    maxGenerations,
    populationSize,
    agents,
    generations: [],
    candles: [],
    agentTrades: new Map(),
    bestEverPnl: -Infinity,
    bestEverAgentId: 0,
    nextAgentId: populationSize + 1,
    aiGuidedEvolution: true,
    lastAIBreedingResult: null,
    symbol,
    period,
    battleEvents: [],
    battlePeriodsLoaded: [],
  };

  return arena;
}

/** Get a candle slice for this generation (rolling window for diversity) */
function getCandleSlice(candles: OHLCV[], generation: number): OHLCV[] {
  // Use ~65% of candles so the window shifts meaningfully each generation
  const windowSize = Math.min(candles.length, Math.max(150, Math.floor(candles.length * 0.65)));
  const maxShift = Math.max(1, candles.length - windowSize);
  // Shift by ~10 candles per generation, wrapping around
  const shift = (generation * 10) % maxShift;
  return candles.slice(shift, shift + windowSize);
}

/** Run a single generation: backtest all agents, record results */
async function runGeneration(state: ArenaState): Promise<void> {
  const genStart = Date.now();
  const aliveAgents = state.agents.filter((a) => a.isAlive);

  // Use a rolling candle window so same genome can get different results
  const candleSlice = getCandleSlice(state.candles, state.currentGeneration);

  // Run each agent's strategy against candle data
  for (const agent of aliveAgents) {
    const result = runStrategy(agent.genome, candleSlice);
    agent.totalPnl = Math.round(result.totalPnlPct * 100); // store as basis points
    agent.totalTrades = result.totalTrades;
    agent.winRate = Math.round(result.winRate * 100); // store as basis points
    state.agentTrades.set(agent.id, result.trades);
    // Compute trading metrics
    const wins = result.trades.filter(t => t.pnlPct > 0);
    const losses = result.trades.filter(t => t.pnlPct <= 0);
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlPct, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnlPct, 0) / losses.length) : 0;
    const grossWins = wins.reduce((s, t) => s + t.pnlPct, 0);
    const grossLosses = Math.abs(losses.reduce((s, t) => s + t.pnlPct, 0));
    agent.avgWin = +avgWin.toFixed(2);
    agent.avgLoss = +avgLoss.toFixed(2);
    agent.profitFactor = grossLosses > 0 ? +(grossWins / grossLosses).toFixed(2) : grossWins > 0 ? 999 : 0;
    agent.riskReward = avgLoss > 0 ? `1:${(avgWin / avgLoss).toFixed(1)}` : '—';
    const wr = result.winRate / 100;
    agent.expectedValue = +((wr * avgWin) - ((1 - wr) * avgLoss)).toFixed(2);
  }

  // Fitness function: multi-objective — PnL + win rate pressure + trade count bonus
  // WR stored as basis points (e.g. 5000 = 50%)
  const fitness = (a: AgentGenome) => {
    if (a.totalTrades === 0) return -10000;
    const wrPct = a.winRate / 100; // convert bps to percent (e.g. 5000 -> 50)
    // Proportional WR bonus: every % above 40% WR adds bonus, scaling up
    let wrBonus = 0;
    if (wrPct > 40) wrBonus = (wrPct - 40) * 15; // +15 bps per % above 40% (e.g. 55% WR = +225 bps)
    // Penalty for degenerate low WR (<30%) — proportional
    if (wrPct < 30) wrBonus = -(30 - wrPct) * 20; // -20 bps per % below 30% (e.g. 20% WR = -200 bps)
    const tradeBonus = Math.min(a.totalTrades, 10) * 5; // reward active traders (up to 50 bps bonus)
    return a.totalPnl + wrBonus + tradeBonus;
  };

  // Find best agent this generation
  const sorted = [...aliveAgents].sort((a, b) => fitness(b) - fitness(a));
  const best = sorted[0];

  if (best && best.totalPnl > state.bestEverPnl) {
    state.bestEverPnl = best.totalPnl;
    state.bestEverAgentId = best.id;
  }

  // Record generation
  const avgPnl = aliveAgents.length > 0
    ? Math.round(aliveAgents.reduce((s, a) => s + a.totalPnl, 0) / aliveAgents.length)
    : 0;

  state.generations.push({
    number: state.currentGeneration,
    startedAt: genStart,
    endedAt: Date.now(),
    bestPnl: best?.totalPnl ?? 0,
    bestAgent: best?.id ?? 0,
    avgPnl,
    agentsBorn: aliveAgents.length,
    agentsDied: 0, // updated after evolution
  });
}

/** Evolve: create next generation from current results */
function evolvePopulation(state: ArenaState): void {
  const aliveAgents = state.agents.filter((a) => a.isAlive);

  // Check for AI breeding guidance
  const aiResult = state.aiGuidedEvolution ? getLatestBreedingResult() : null;
  if (aiResult) {
    state.lastAIBreedingResult = aiResult;
  }

  // Fitness: penalize non-traders, reward win rate + trade activity
  const fit = (a: AgentGenome) => {
    if (a.totalTrades === 0) return -10000;
    const wrPct = a.winRate / 100;
    let wrBonus = 0;
    if (wrPct > 40) wrBonus = (wrPct - 40) * 15;
    if (wrPct < 30) wrBonus = -(30 - wrPct) * 20;
    const tradeBonus = Math.min(a.totalTrades, 10) * 5;
    return a.totalPnl + wrBonus + tradeBonus;
  };

  const agentResults: AgentResult[] = aliveAgents.map((a) => ({
    id: a.id,
    genome: a.genome,
    totalPnlPct: (a.totalTrades === 0 ? -100 : a.totalPnl / 100),
    winRate: a.winRate / 100,
    totalTrades: a.totalTrades,
    sharpe: 0,
  }));

  const newGen = evolveGeneration(agentResults, state.populationSize);

  // Mark non-elite agents as dead
  const sorted = [...aliveAgents].sort((a, b) => fit(b) - fit(a));
  const eliteCount = Math.max(1, Math.round(state.populationSize * 0.20));
  const eliteIds = new Set(sorted.slice(0, eliteCount).map((a) => a.id));

  let deaths = 0;
  for (const agent of aliveAgents) {
    if (!eliteIds.has(agent.id)) {
      agent.isAlive = false;
      agent.diedAt = Date.now();
      deaths++;
    }
  }

  // Update last generation's death count
  if (state.generations.length > 0) {
    state.generations[state.generations.length - 1].agentsDied = deaths;
  }

  // Create new agents (skip elite which carry forward)
  // Apply AI mutation bias if available
  const aiBias = aiResult?.decisions?.[0]?.mutationBias ?? {};
  state.currentGeneration++;
  for (let i = eliteCount; i < newGen.genomes.length; i++) {
    // Apply AI-guided mutation bias to children (not immigrants)
    let genome = newGen.genomes[i];
    if (Object.keys(aiBias).length > 0 && newGen.parentage[i].parentA > 0) {
      genome = applyMutationBias(genome, aiBias, 0.15);
    }
    const newAgent: AgentGenome = {
      id: state.nextAgentId++,
      generation: state.currentGeneration,
      parentA: newGen.parentage[i].parentA > 0 ? newGen.parentage[i].parentA : null,
      parentB: newGen.parentage[i].parentB > 0 ? newGen.parentage[i].parentB : null,
      genome,
      bornAt: Date.now(),
      diedAt: null,
      totalPnl: 0,
      totalTrades: 0,
      winRate: 0,
      isAlive: true,
      owner: '11111111111111111111111111111111',
    };
    state.agents.push(newAgent);
  }

  // Update elite agents' generation
  for (const agent of aliveAgents) {
    if (eliteIds.has(agent.id)) {
      agent.generation = state.currentGeneration;
    }
  }
}

/** Initialize evolution with candle data and run first generation */
export async function startEvolution(
  populationSize = 20,
  maxGenerations = 50,
  seedGenomes?: number[][],
  symbol: TradingPair = 'SOLUSDT',
  period: string | null = null,
): Promise<void> {
  const state = initArena(populationSize, maxGenerations, symbol, period);
  state.status = 'running';

  // If we have seed genomes (from "Continue Evolution"), use them with progressive mutation
  if (seedGenomes && seedGenomes.length > 0) {
    const seedCount = Math.min(seedGenomes.length, Math.floor(populationSize * 0.5));
    for (let i = 0; i < seedCount; i++) {
      if (i === 0) {
        // Keep #1 elite as exact copy
        state.agents[i].genome = [...seedGenomes[i]];
      } else {
        // Mutate seeds with increasing aggression to force exploration
        state.agents[i].genome = mutate(seedGenomes[i], 0.30 + i * 0.05);
      }
      state.agents[i].parentA = -1; // marker: seeded from previous run
    }
  }

  // Fetch real market data — use period if specified
  if (period) {
    state.candles = await fetchCandlesForPeriod(symbol, period, '4h');
  } else {
    state.candles = await fetchCandles(symbol, '4h', 500);
  }

  // Run first generation
  await runGeneration(state);
}

/** Get top genomes from current run (for seeding next run) */
export function getTopGenomes(count = 10): number[][] {
  if (!arena) return [];
  return [...arena.agents]
    .filter(a => a.isAlive && a.totalTrades > 0)
    .sort((a, b) => b.totalPnl - a.totalPnl)
    .slice(0, count)
    .map(a => [...a.genome]);
}

/** Breed two specific agents and backtest the child */
export async function breedAndTest(parentAId: number, parentBId: number): Promise<AgentGenome | null> {
  if (!arena || arena.candles.length === 0) return null;
  
  const parentA = arena.agents.find(a => a.id === parentAId);
  const parentB = arena.agents.find(a => a.id === parentBId);
  if (!parentA || !parentB) return null;

  // Crossover + mutation — use higher mutation rate for manual lab breeding
  const crossed = parentA.genome.map((g, i) =>
    Math.random() > 0.5 ? g : parentB.genome[i]
  );
  // Check if parents are clones (identical genomes) — if so, use aggressive mutation
  const areClones = parentA.genome.every((g, i) => g === parentB.genome[i]);
  const childGenome = mutate(crossed, areClones ? 0.50 : 0.25);

  // Backtest the child against current candle data
  const result = runStrategy(childGenome, arena.candles);

  // Compute trading metrics for child
  const cWins = result.trades.filter(t => t.pnlPct > 0);
  const cLosses = result.trades.filter(t => t.pnlPct <= 0);
  const cAvgWin = cWins.length > 0 ? cWins.reduce((s, t) => s + t.pnlPct, 0) / cWins.length : 0;
  const cAvgLoss = cLosses.length > 0 ? Math.abs(cLosses.reduce((s, t) => s + t.pnlPct, 0) / cLosses.length) : 0;
  const cGrossWins = cWins.reduce((s, t) => s + t.pnlPct, 0);
  const cGrossLosses = Math.abs(cLosses.reduce((s, t) => s + t.pnlPct, 0));
  const cWr = result.winRate / 100;

  const child: AgentGenome = {
    id: arena.nextAgentId++,
    generation: Math.max(parentA.generation, parentB.generation) + 1,
    parentA: parentA.id,
    parentB: parentB.id,
    genome: childGenome,
    bornAt: Date.now(),
    diedAt: null,
    totalPnl: Math.round(result.totalPnlPct * 100),
    totalTrades: result.totalTrades,
    winRate: Math.round(result.winRate * 100),
    isAlive: true,
    owner: '11111111111111111111111111111111',
    avgWin: +cAvgWin.toFixed(2),
    avgLoss: +cAvgLoss.toFixed(2),
    profitFactor: cGrossLosses > 0 ? +(cGrossWins / cGrossLosses).toFixed(2) : cGrossWins > 0 ? 999 : 0,
    riskReward: cAvgLoss > 0 ? `1:${(cAvgWin / cAvgLoss).toFixed(1)}` : '—',
    expectedValue: +((cWr * cAvgWin) - ((1 - cWr) * cAvgLoss)).toFixed(2),
  };

  // Add to arena
  arena.agents.push(child);
  arena.agentTrades.set(child.id, result.trades);

  return child;
}

/**
 * Run a batch of generations (up to `batchSize`) in a single call.
 * Returns true if evolution is complete.
 * This batching approach works within Vercel's 10s timeout.
 */
export async function stepEvolution(batchSize = 5): Promise<boolean> {
  if (!arena) return true;
  if (arena.status === 'complete') return true;

  // Re-fetch candles if lost (serverless instance may have changed)
  if (!arena.candles || arena.candles.length === 0) {
    if (arena.period) {
      arena.candles = await fetchCandlesForPeriod(arena.symbol, arena.period, '4h');
    } else {
      arena.candles = await fetchCandles(arena.symbol, '4h', 500);
    }
    // Re-run current generation since results were lost
    await runGeneration(arena);
  }

  arena.status = 'running';

  for (let i = 0; i < batchSize; i++) {
    evolvePopulation(arena);

    if (arena.currentGeneration >= arena.maxGenerations) {
      arena.status = 'complete';
      return true;
    }

    await runGeneration(arena);

    if (arena.currentGeneration >= arena.maxGenerations - 1) {
      arena.status = 'complete';
      return true;
    }
  }

  return false;
}

export function stopEvolution(): void {
  if (arena) arena.status = 'paused';
}

/** Get serializable state for API responses */
export function getArenaSnapshot() {
  if (!arena) return null;

  const aliveAgents = arena.agents.filter((a) => a.isAlive);
  const allAgentsEver = arena.agents;

  // Build trades map (only for current alive agents, limited)
  const tradesMap: Record<number, Trade[]> = {};
  for (const agent of aliveAgents.slice(0, 5)) {
    const trades = arena.agentTrades.get(agent.id);
    if (trades) tradesMap[agent.id] = trades;
  }

  return {
    status: arena.status,
    currentGeneration: arena.currentGeneration,
    maxGenerations: arena.maxGenerations,
    populationSize: arena.populationSize,
    agents: aliveAgents.sort((a, b) => {
      // Rank by fitness: traders first, then by PnL
      const fa = a.totalTrades === 0 ? -10000 : a.totalPnl;
      const fb = b.totalTrades === 0 ? -10000 : b.totalPnl;
      return fb - fa;
    }),
    allAgents: allAgentsEver.sort((a, b) => {
      const fa = a.totalTrades === 0 ? -10000 : a.totalPnl;
      const fb = b.totalTrades === 0 ? -10000 : b.totalPnl;
      return fb - fa;
    }).slice(0, 50),
    generations: arena.generations,
    candles: arena.candles,
    candleInfo: arena.candles.length > 0 ? {
      count: arena.candles.length,
      interval: '4h',
      startDate: new Date(arena.candles[0].time * 1000).toISOString().slice(0, 10),
      endDate: new Date(arena.candles[arena.candles.length - 1].time * 1000).toISOString().slice(0, 10),
      days: Math.round((arena.candles[arena.candles.length - 1].time - arena.candles[0].time) / 86400),
      pair: getPairLabel(arena.symbol),
      symbol: arena.symbol,
    } : null,
    trades: tradesMap,
    bestEverPnl: arena.bestEverPnl,
    bestEverAgentId: arena.bestEverAgentId,
    aiGuidedEvolution: arena.aiGuidedEvolution,
    lastAIBreedingResult: arena.lastAIBreedingResult,
    totalDeaths: arena.agents.filter(a => !a.isAlive).length,
    period: arena.period,
    battleEvents: arena.battleEvents?.slice(-50) ?? [],
    battlePeriodsLoaded: arena.battlePeriodsLoaded ?? [],
  };
}

// ============================================================
// Battle Evolution — train across ALL market periods
// Fitness = average performance across multiple periods
// ============================================================


let battleCandles: Map<string, OHLCV[]> = new Map();

export async function startBattleEvolution(
  populationSize: number = 20,
  maxGenerations: number = 50,
  symbol: TradingPair = 'SOLUSDT',
  seedGenomes?: number[][],
): Promise<void> {
  // Pre-fetch all period candles
  battleCandles = new Map();
  for (const periodId of BATTLE_TEST_PERIODS) {
    try {
      const candles = await fetchCandlesForPeriod(symbol, periodId, '4h');
      if (candles.length >= 20) {
        battleCandles.set(periodId, candles);
      }
    } catch (e) {
      console.warn(`Battle evolution: skip ${periodId}:`, (e as Error).message);
    }
  }

  const state = initArena(populationSize, maxGenerations, symbol, 'battle');
  state.battlePeriodsLoaded = [...battleCandles.keys()];
  // Use first period candles as default display
  const firstPeriod = [...battleCandles.values()][0];
  if (firstPeriod) state.candles = firstPeriod;

  // Seed top genomes from previous run with progressive mutation
  if (seedGenomes && seedGenomes.length > 0) {
    const seedCount = Math.min(seedGenomes.length, Math.floor(populationSize * 0.5));
    for (let i = 0; i < seedCount; i++) {
      if (i === 0) {
        state.agents[i].genome = [...seedGenomes[i]];
      } else {
        state.agents[i].genome = mutate(seedGenomes[i], 0.30 + i * 0.05);
      }
      state.agents[i].parentA = -1; // marker: seeded
    }
  }

  arena = state;
}

/** Override runGeneration for battle mode: evaluate across all periods */
export async function stepBattleEvolution(): Promise<boolean> {
  if (!arena || !arena.period?.includes('battle')) {
    return stepEvolution();
  }

  const state = arena;
  if (state.currentGeneration >= state.maxGenerations) return true;

  const genStart = Date.now();
  const aliveAgents = state.agents.filter(a => a.isAlive);
  const gen = state.currentGeneration;

  // Evaluate each agent across ALL periods
  for (const agent of aliveAgents) {
    let totalFitness = 0;
    let periodCount = 0;
    let totalTrades = 0;
    let totalWins = 0;
    let grossWins = 0;
    let grossLosses = 0;
    let allWinPcts: number[] = [];
    let allLossPcts: number[] = [];

    for (const [, candles] of battleCandles) {
      const result = runStrategy(agent.genome, candles);
      totalFitness += result.totalPnlPct;
      totalTrades += result.trades.length;
      for (const t of result.trades) {
        if (t.pnlPct > 0) {
          totalWins++;
          grossWins += t.pnlPct;
          allWinPcts.push(t.pnlPct);
        } else {
          grossLosses += Math.abs(t.pnlPct);
          allLossPcts.push(Math.abs(t.pnlPct));
        }
      }
      periodCount++;
    }

    agent.totalPnl = periodCount > 0 ? Math.round((totalFitness / periodCount) * 100) : -10000;
    agent.totalTrades = totalTrades;
    agent.winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 10000) : 0;

    // Compute trading metrics
    const avgWin = allWinPcts.length > 0 ? allWinPcts.reduce((s, v) => s + v, 0) / allWinPcts.length : 0;
    const avgLoss = allLossPcts.length > 0 ? allLossPcts.reduce((s, v) => s + v, 0) / allLossPcts.length : 0;
    const wr = totalTrades > 0 ? totalWins / totalTrades : 0;
    agent.avgWin = +avgWin.toFixed(2);
    agent.avgLoss = +avgLoss.toFixed(2);
    agent.profitFactor = grossLosses > 0 ? +(grossWins / grossLosses).toFixed(2) : grossWins > 0 ? 999 : 0;
    agent.riskReward = avgLoss > 0 ? `1:${(avgWin / avgLoss).toFixed(1)}` : '—';
    agent.expectedValue = +((wr * avgWin) - ((1 - wr) * avgLoss)).toFixed(2);
  }

  // Selection
  const fitness = (a: AgentGenome) => a.totalPnl;
  const sorted = [...aliveAgents].sort((a, b) => fitness(b) - fitness(a));
  const best = sorted[0];

  const prevBest = state.bestEverPnl;
  if (best && best.totalPnl > state.bestEverPnl) {
    state.bestEverPnl = best.totalPnl;
    state.bestEverAgentId = best.id;
    state.battleEvents.push({
      gen, type: 'new-best', agentId: best.id, pnl: best.totalPnl,
      message: `🏆 New best! Agent #${best.id} (+${(best.totalPnl / 100).toFixed(1)}%)`,
    });
  }

  // Kill bottom 75%
  const keepCount = Math.max(Math.ceil(sorted.length * 0.25), 2);
  let deaths = 0;
  for (let i = keepCount; i < sorted.length; i++) {
    sorted[i].isAlive = false;
    sorted[i].diedAt = Date.now();
    deaths++;
    state.battleEvents.push({
      gen, type: 'kill', agentId: sorted[i].id, pnl: sorted[i].totalPnl,
      message: `💀 Agent #${sorted[i].id} eliminated (${(sorted[i].totalPnl / 100).toFixed(1)}%)`,
    });
  }

  // Log survivors
  for (let i = 0; i < keepCount && i < sorted.length; i++) {
    state.battleEvents.push({
      gen, type: 'survive', agentId: sorted[i].id, pnl: sorted[i].totalPnl,
      message: `✅ Agent #${sorted[i].id} survived (+${(sorted[i].totalPnl / 100).toFixed(1)}%)`,
    });
  }

  // Breed survivors
  const survivors = sorted.slice(0, keepCount);
  let born = 0;
  const targetPop = state.populationSize;
  while (state.agents.filter(a => a.isAlive).length < targetPop) {
    const p1 = survivors[Math.floor(Math.random() * survivors.length)];
    const p2 = survivors[Math.floor(Math.random() * survivors.length)];
    const crossed = crossover(p1.genome, p2.genome);
    const childGenome = mutate(crossed);
    state.nextAgentId++;
    const child: AgentGenome = {
      id: state.nextAgentId,
      genome: childGenome,
      parentA: p1.id,
      parentB: p2.id,
      generation: state.currentGeneration + 1,
      bornAt: Date.now(),
      diedAt: null,
      owner: '11111111111111111111111111111111',
      isAlive: true,
      totalPnl: 0,
      totalTrades: 0,
      winRate: 0,
    };
    state.agents.push(child);
    born++;
    state.battleEvents.push({
      gen, type: 'born', agentId: child.id, parentA: p1.id, parentB: p2.id,
      message: `🧒 Agent #${child.id} born (child of #${p1.id} × #${p2.id})`,
    });
  }

  // Record generation
  const avgPnl = aliveAgents.length > 0
    ? Math.round(aliveAgents.reduce((s, a) => s + a.totalPnl, 0) / aliveAgents.length)
    : 0;

  state.generations.push({
    number: gen,
    startedAt: genStart,
    endedAt: Date.now(),
    bestPnl: best?.totalPnl ?? 0,
    bestAgent: best?.id ?? 0,
    avgPnl,
    agentsBorn: born,
    agentsDied: deaths,
  });

  // Trim events to last 200 to prevent memory bloat
  if (state.battleEvents.length > 200) {
    state.battleEvents = state.battleEvents.slice(-200);
  }

  state.currentGeneration++;
  if (state.currentGeneration >= state.maxGenerations) {
    state.status = 'complete';
    return true;
  }
  return false;
}
