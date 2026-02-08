/**
 * Arena — the main evolution loop. Manages population, runs backtests, evolves.
 */

import { OHLCV, fetchCandles, TradingPair, getPairLabel } from './market';
import { runStrategy, Trade } from './strategy';
import { createRandomGenome, evolveGeneration, AgentResult } from './genetics';
import { AgentGenome, Generation } from '@/types';
import { AIBreedingResult, applyMutationBias, getLatestBreedingResult } from './ai-breeder';

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
}

let arena: ArenaState | null = null;
let runningPromise: Promise<void> | null = null;

export function getArenaState(): ArenaState | null {
  return arena;
}

export function initArena(populationSize = 20, maxGenerations = 50, symbol: TradingPair = 'SOLUSDT'): ArenaState {
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
  }

  // Fitness function: multi-objective — PnL + win rate bonus + trade count bonus
  // Agents must trade to survive. Cowards (0 trades) get punished.
  // Win rate bonus: agents with >60% WR get a boost
  const fitness = (a: AgentGenome) => {
    if (a.totalTrades === 0) return -10000;
    const wrBonus = a.winRate > 6000 ? (a.winRate - 6000) / 100 : 0; // bonus for >60% WR (winRate stored as bps)
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
    const wrBonus = a.winRate > 6000 ? (a.winRate - 6000) / 100 : 0;
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
): Promise<void> {
  const state = initArena(populationSize, maxGenerations, symbol);
  state.status = 'running';

  // If we have seed genomes (from "Continue Evolution"), use them for part of population
  if (seedGenomes && seedGenomes.length > 0) {
    const seedCount = Math.min(seedGenomes.length, Math.floor(populationSize * 0.5));
    for (let i = 0; i < seedCount; i++) {
      state.agents[i].genome = seedGenomes[i];
      state.agents[i].parentA = -1; // marker: seeded from previous run
    }
  }

  // Fetch real market data
  state.candles = await fetchCandles(symbol, '4h', 500);

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

  // Crossover
  const childGenome = parentA.genome.map((g, i) => {
    const crossed = Math.random() > 0.5 ? g : parentB.genome[i];
    // 15% mutation rate
    if (Math.random() < 0.15) {
      return Math.min(1000, Math.max(0, Math.round(crossed + (Math.random() - 0.5) * 200)));
    }
    return Math.round(crossed);
  });

  // Backtest the child against current candle data
  const result = runStrategy(childGenome, arena.candles);

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
    arena.candles = await fetchCandles(arena.symbol, '4h', 500);
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
  };
}
