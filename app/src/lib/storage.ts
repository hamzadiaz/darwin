import { Agent, Battle } from '@/types/agent';

const AGENTS_KEY = 'darwin_agents';
const BATTLES_KEY = 'darwin_battles';

// Agent Storage
export function saveAgent(agent: Agent): void {
  const agents = getAllAgents();
  const index = agents.findIndex((a) => a.id === agent.id);
  
  if (index >= 0) {
    agents[index] = agent;
  } else {
    agents.push(agent);
  }
  
  localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
}

export function getAllAgents(): Agent[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(AGENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getAgentById(id: string): Agent | null {
  const agents = getAllAgents();
  return agents.find((a) => a.id === id) || null;
}

export function getAgentsByWallet(wallet: string): Agent[] {
  return getAllAgents().filter((a) => a.ownerWallet === wallet);
}

export function deleteAgent(id: string): void {
  const agents = getAllAgents().filter((a) => a.id !== id);
  localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
}

// Battle Storage
export function saveBattle(battle: Battle): void {
  const battles = getAllBattles();
  battles.push(battle);
  localStorage.setItem(BATTLES_KEY, JSON.stringify(battles));
  
  // Update agent stats
  const winner = getAgentById(battle.winnerId);
  const loser = getAgentById(
    battle.winnerId === battle.agent1.id ? battle.agent2.id : battle.agent1.id
  );
  
  if (winner) {
    winner.wins += 1;
    winner.xp += battle.xpGained;
    winner.level = Math.floor(winner.xp / 100) + 1;
    saveAgent(winner);
  }
  
  if (loser) {
    loser.losses += 1;
    loser.xp += Math.floor(battle.xpGained / 2); // Losers get half XP
    loser.level = Math.floor(loser.xp / 100) + 1;
    saveAgent(loser);
  }
}

export function getAllBattles(): Battle[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BATTLES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getBattlesByAgent(agentId: string): Battle[] {
  return getAllBattles().filter(
    (b) => b.agent1.id === agentId || b.agent2.id === agentId
  );
}

// Leaderboard
export function getLeaderboard(limit = 10): Agent[] {
  const agents = getAllAgents();
  
  // Sort by wins, then by win rate
  return agents
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      
      const aWinRate = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
      const bWinRate = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
      
      return bWinRate - aWinRate;
    })
    .slice(0, limit);
}

// Get random opponent (excluding own agents)
export function getRandomOpponent(excludeIds: string[]): Agent | null {
  const agents = getAllAgents().filter((a) => !excludeIds.includes(a.id));
  
  if (agents.length === 0) return null;
  
  return agents[Math.floor(Math.random() * agents.length)];
}

// Initialize with sample agents if empty
export function initializeSampleAgents(): void {
  if (getAllAgents().length === 0) {
    const sampleAgents: Omit<Agent, 'id' | 'createdAt'>[] = [
      {
        name: 'Dracarys',
        origin: 'dragon',
        personalityTraits: { bravery: 90, loyalty: 60, strategy: 40, social: 30 },
        backstory: 'Born from volcanic fury, Dracarys burns with unquenchable rage.',
        stats: { hp: 115, atk: 76, def: 60, int: 55, spd: 63 },
        xp: 350,
        level: 4,
        wins: 7,
        losses: 2,
      },
      {
        name: 'Arcturus',
        origin: 'scholar',
        personalityTraits: { bravery: 30, loyalty: 80, strategy: 95, social: 70 },
        backstory: 'Master of ancient tomes, Arcturus bends reality with forbidden knowledge.',
        stats: { hp: 110, atk: 55, def: 55, int: 78, spd: 68 },
        xp: 280,
        level: 3,
        wins: 6,
        losses: 3,
      },
      {
        name: 'Nyx',
        origin: 'shadow',
        personalityTraits: { bravery: 50, loyalty: 20, strategy: 75, social: 15 },
        backstory: 'Nyx walks between darkness and light, seen only when they wish.',
        stats: { hp: 105, atk: 69, def: 52, int: 68, spd: 80 },
        xp: 420,
        level: 5,
        wins: 9,
        losses: 1,
      },
      {
        name: 'Aegis',
        origin: 'sentinel',
        personalityTraits: { bravery: 70, loyalty: 95, strategy: 65, social: 80 },
        backstory: 'Aegis stands unwavering, an iron wall no force can break.',
        stats: { hp: 129, atk: 60, def: 82, int: 53, spd: 51 },
        xp: 150,
        level: 2,
        wins: 3,
        losses: 2,
      },
    ];
    
    sampleAgents.forEach((agent) => {
      const fullAgent: Agent = {
        ...agent,
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now() - Math.random() * 1000000,
      };
      saveAgent(fullAgent);
    });
  }
}
