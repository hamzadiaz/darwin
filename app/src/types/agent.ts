export type Origin = 'dragon' | 'scholar' | 'shadow' | 'sentinel';

export interface PersonalityTraits {
  bravery: number; // 0-100 (0 = cautious, 100 = brave)
  loyalty: number; // 0-100 (0 = selfish, 100 = loyal)
  strategy: number; // 0-100 (0 = impulsive, 100 = strategic)
  social: number; // 0-100 (0 = lone wolf, 100 = social)
}

export interface AgentStats {
  hp: number;
  atk: number;
  def: number;
  int: number;
  spd: number;
}

export interface Agent {
  id: string;
  name: string;
  origin: Origin;
  personalityTraits: PersonalityTraits;
  backstory: string;
  stats: AgentStats;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  ownerWallet?: string;
  mintAddress?: string;
  createdAt: number;
}

export interface BattleRound {
  round: number;
  agent1Action: BattleAction;
  agent2Action: BattleAction;
  agent1Damage: number;
  agent2Damage: number;
  agent1HP: number;
  agent2HP: number;
}

export type BattleAction = 'attack' | 'defend' | 'special' | 'dodge';

export interface Battle {
  id: string;
  agent1: Agent;
  agent2: Agent;
  rounds: BattleRound[];
  winnerId: string;
  xpGained: number;
  createdAt: number;
}

export const ORIGIN_CONFIG = {
  dragon: {
    name: 'Dragon Blood',
    emoji: '🐉',
    description: 'Fire, strength, aggression',
    statBonus: { hp: 15, atk: 20, def: 10, int: 5, spd: 10 },
    gradient: 'from-red-500 to-orange-500',
  },
  scholar: {
    name: 'Arcane Scholar',
    emoji: '🧙',
    description: 'Intelligence, magic, wisdom',
    statBonus: { hp: 10, atk: 5, def: 5, int: 25, spd: 15 },
    gradient: 'from-purple-500 to-blue-500',
  },
  shadow: {
    name: 'Shadow Walker',
    emoji: '👻',
    description: 'Stealth, speed, cunning',
    statBonus: { hp: 10, atk: 15, def: 5, int: 15, spd: 25 },
    gradient: 'from-gray-700 to-purple-900',
  },
  sentinel: {
    name: 'Iron Sentinel',
    emoji: '⚔️',
    description: 'Defense, endurance, loyalty',
    statBonus: { hp: 20, atk: 10, def: 25, int: 5, spd: 5 },
    gradient: 'from-slate-500 to-cyan-500',
  },
} as const;
