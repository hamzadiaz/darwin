import { Agent, BattleAction, BattleRound, Battle } from '@/types/agent';

const BATTLE_ROUNDS = 5;

// Determine action based on stats and personality
export function determineAction(
  agent: Agent,
  round: number,
  currentHP: number
): BattleAction {
  const { stats, personalityTraits } = agent;
  
  // Low HP → more likely to defend or dodge
  const hpPercent = (currentHP / stats.hp) * 100;
  
  if (hpPercent < 30) {
    // Low HP - defensive behavior influenced by bravery
    if (personalityTraits.bravery < 40) {
      return Math.random() < 0.6 ? 'defend' : 'dodge';
    }
  }
  
  // Personality-based action weights
  const weights = {
    attack: 0.4 + (personalityTraits.bravery / 100) * 0.3,
    defend: 0.2 + ((100 - personalityTraits.bravery) / 100) * 0.2,
    special: 0.2 + (stats.int / 100) * 0.2, // Higher INT = more specials
    dodge: 0.2 + (stats.spd / 100) * 0.2, // Higher SPD = more dodges
  };
  
  // Normalize weights
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  Object.keys(weights).forEach((key) => {
    weights[key as BattleAction] /= total;
  });
  
  // Random selection based on weights
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [action, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand <= cumulative) {
      return action as BattleAction;
    }
  }
  
  return 'attack';
}

export function calculateDamage(
  attacker: Agent,
  defender: Agent,
  attackerAction: BattleAction,
  defenderAction: BattleAction
): { agent1Damage: number; agent2Damage: number } {
  let agent1Damage = 0;
  let agent2Damage = 0;
  
  const rngFactor = () => 0.9 + Math.random() * 0.2; // 10% RNG
  
  // Attacker deals damage
  if (attackerAction === 'attack') {
    const baseDamage = attacker.stats.atk * rngFactor();
    
    if (defenderAction === 'defend') {
      agent2Damage = Math.max(0, baseDamage - defender.stats.def * 0.6);
    } else if (defenderAction === 'dodge') {
      // SPD vs SPD check
      const dodgeChance = defender.stats.spd / (attacker.stats.spd + defender.stats.spd);
      agent2Damage = Math.random() > dodgeChance ? baseDamage : 0;
    } else {
      agent2Damage = Math.max(0, baseDamage - defender.stats.def * 0.3);
    }
  } else if (attackerAction === 'special') {
    const specialDamage = (attacker.stats.atk + attacker.stats.int) * 0.7 * rngFactor();
    
    if (defenderAction === 'defend') {
      agent2Damage = Math.max(0, specialDamage - defender.stats.def * 0.4);
    } else if (defenderAction === 'dodge') {
      const dodgeChance = defender.stats.spd / (attacker.stats.spd + defender.stats.spd + 20);
      agent2Damage = Math.random() > dodgeChance ? specialDamage : 0;
    } else {
      agent2Damage = Math.max(0, specialDamage - defender.stats.def * 0.2);
    }
  }
  
  // Defender counter-attacks if they attacked
  if (defenderAction === 'attack') {
    const baseDamage = defender.stats.atk * rngFactor();
    
    if (attackerAction === 'defend') {
      agent1Damage = Math.max(0, baseDamage - attacker.stats.def * 0.6);
    } else if (attackerAction === 'dodge') {
      const dodgeChance = attacker.stats.spd / (defender.stats.spd + attacker.stats.spd);
      agent1Damage = Math.random() > dodgeChance ? baseDamage : 0;
    } else {
      agent1Damage = Math.max(0, baseDamage - attacker.stats.def * 0.3);
    }
  } else if (defenderAction === 'special') {
    const specialDamage = (defender.stats.atk + defender.stats.int) * 0.7 * rngFactor();
    
    if (attackerAction === 'defend') {
      agent1Damage = Math.max(0, specialDamage - attacker.stats.def * 0.4);
    } else if (attackerAction === 'dodge') {
      const dodgeChance = attacker.stats.spd / (defender.stats.spd + attacker.stats.spd + 20);
      agent1Damage = Math.random() > dodgeChance ? specialDamage : 0;
    } else {
      agent1Damage = Math.max(0, specialDamage - attacker.stats.def * 0.2);
    }
  }
  
  return {
    agent1Damage: Math.floor(agent1Damage),
    agent2Damage: Math.floor(agent2Damage),
  };
}

export function simulateBattle(agent1: Agent, agent2: Agent): Battle {
  const rounds: BattleRound[] = [];
  let agent1HP = agent1.stats.hp;
  let agent2HP = agent2.stats.hp;
  
  for (let i = 1; i <= BATTLE_ROUNDS; i++) {
    const agent1Action = determineAction(agent1, i, agent1HP);
    const agent2Action = determineAction(agent2, i, agent2HP);
    
    const { agent1Damage, agent2Damage } = calculateDamage(
      agent1,
      agent2,
      agent1Action,
      agent2Action
    );
    
    agent1HP = Math.max(0, agent1HP - agent1Damage);
    agent2HP = Math.max(0, agent2HP - agent2Damage);
    
    rounds.push({
      round: i,
      agent1Action,
      agent2Action,
      agent1Damage,
      agent2Damage,
      agent1HP,
      agent2HP,
    });
    
    // Battle ends if someone dies
    if (agent1HP <= 0 || agent2HP <= 0) break;
  }
  
  // Determine winner (higher HP, or by stats if tie)
  let winnerId: string;
  if (agent1HP > agent2HP) {
    winnerId = agent1.id;
  } else if (agent2HP > agent1HP) {
    winnerId = agent2.id;
  } else {
    // Tie - winner determined by total stats
    const agent1Total = Object.values(agent1.stats).reduce((a, b) => a + b, 0);
    const agent2Total = Object.values(agent2.stats).reduce((a, b) => a + b, 0);
    winnerId = agent1Total >= agent2Total ? agent1.id : agent2.id;
  }
  
  const xpGained = 50; // Base XP per battle
  
  return {
    id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agent1,
    agent2,
    rounds,
    winnerId,
    xpGained,
    createdAt: Date.now(),
  };
}
