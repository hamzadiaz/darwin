/**
 * Genetic Algorithm — selection, crossover, mutation, immigration
 */

export interface AgentResult {
  id: number;
  genome: number[];       // 12 genes, 0-1000
  totalPnlPct: number;
  winRate: number;
  totalTrades: number;
  sharpe: number;
}

export interface NewGeneration {
  genomes: number[][];
  parentage: { parentA: number; parentB: number }[];
}

/** Create a random genome (12 genes, each 0-1000) */
export function createRandomGenome(): number[] {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 1001));
}

/** Tournament selection: pick `tournamentSize` random agents, return the best */
function tournamentSelect(agents: AgentResult[], tournamentSize = 3): AgentResult {
  let best: AgentResult | null = null;
  for (let i = 0; i < tournamentSize; i++) {
    const candidate = agents[Math.floor(Math.random() * agents.length)];
    if (!best || candidate.totalPnlPct > best.totalPnlPct) {
      best = candidate;
    }
  }
  return best!;
}

/** Select elite agents (top N%) */
export function selectElite(agents: AgentResult[], topPercent = 0.25): AgentResult[] {
  const sorted = [...agents].sort((a, b) => b.totalPnlPct - a.totalPnlPct);
  const count = Math.max(1, Math.round(agents.length * topPercent));
  return sorted.slice(0, count);
}

/** Uniform crossover between two parent genomes */
export function crossover(parentA: number[], parentB: number[]): number[] {
  return parentA.map((gene, i) => (Math.random() < 0.5 ? gene : parentB[i]));
}

/** Mutate a genome: each gene has `rate` chance of being mutated */
export function mutate(genome: number[], rate = 0.20): number[] {
  return genome.map((gene) => {
    if (Math.random() > rate) return gene;
    // 15% chance of complete randomization (macro mutation)
    if (Math.random() < 0.15) return Math.floor(Math.random() * 1001);
    // Otherwise add absolute offset ±75-250 (not relative, so gene=0 can escape)
    const offset = 75 + Math.random() * 175;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const mutated = gene + offset * direction;
    return Math.max(0, Math.min(1000, Math.round(mutated)));
  });
}

/**
 * Evolve a new generation from results.
 * - Keep top 25% as elite (carried forward)
 * - Breed children from tournament-selected parents
 * - Add a few random immigrants to prevent local optima
 */
export function evolveGeneration(
  agents: AgentResult[],
  populationSize = 20,
): NewGeneration {
  const elite = selectElite(agents, 0.20);
  const eliteCount = elite.length;
  const immigrantCount = Math.max(2, Math.round(populationSize * 0.15)); // 15% immigrants
  const childCount = populationSize - eliteCount - immigrantCount;

  const genomes: number[][] = [];
  const parentage: { parentA: number; parentB: number }[] = [];

  // 1. Carry forward elite genomes (unchanged)
  for (const e of elite) {
    genomes.push([...e.genome]);
    parentage.push({ parentA: e.id, parentB: e.id });
  }

  // 2. Breed children via tournament selection + crossover + mutation
  for (let i = 0; i < childCount; i++) {
    const pA = tournamentSelect(agents);
    let pB = tournamentSelect(agents);
    // Ensure different parents when possible
    let attempts = 0;
    while (pB.id === pA.id && attempts < 5) {
      pB = tournamentSelect(agents);
      attempts++;
    }
    const child = mutate(crossover(pA.genome, pB.genome));
    genomes.push(child);
    parentage.push({ parentA: pA.id, parentB: pB.id });
  }

  // 3. Add random immigrants
  for (let i = 0; i < immigrantCount; i++) {
    genomes.push(createRandomGenome());
    parentage.push({ parentA: -1, parentB: -1 });
  }

  return { genomes, parentage };
}
