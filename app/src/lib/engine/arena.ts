/**
 * Arena — the main evolution loop. Manages population, runs backtests, evolves.
 */

import { OHLCV, fetchCandles } from './market';
import { runStrategy, Trade } from './strategy';
import { createRandomGenome, evolveGeneration, AgentResult } from './genetics';
import { AgentGenome, Generation } from '@/types';

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
}

let arena: ArenaState | null = null;
let runningPromise: Promise<void> | null = null;

export function getArenaState(): ArenaState | null {
  return arena;
}

export function initArena(populationSize = 20, maxGenerations = 50): ArenaState {
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

  // Fitness function: agents must trade to survive. Cowards (0 trades) get punished.
  const fitness = (a: AgentGenome) => a.totalTrades === 0 ? -10000 : a.totalPnl;

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

  // Fitness: penalize non-traders
  const fit = (a: AgentGenome) => a.totalTrades === 0 ? -10000 : a.totalPnl;

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
  state.currentGeneration++;
  for (let i = eliteCount; i < newGen.genomes.length; i++) {
    const newAgent: AgentGenome = {
      id: state.nextAgentId++,
      generation: state.currentGeneration,
      parentA: newGen.parentage[i].parentA > 0 ? newGen.parentage[i].parentA : null,
      parentB: newGen.parentage[i].parentB > 0 ? newGen.parentage[i].parentB : null,
      genome: newGen.genomes[i],
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
): Promise<void> {
  const state = initArena(populationSize, maxGenerations);
  state.status = 'running';

  // Fetch real market data
  state.candles = await fetchCandles('SOLUSDT', '4h', 500);

  // Run first generation
  await runGeneration(state);
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
    arena.candles = await fetchCandles('SOLUSDT', '4h', 500);
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
    trades: tradesMap,
    bestEverPnl: arena.bestEverPnl,
    bestEverAgentId: arena.bestEverAgentId,
  };
}
