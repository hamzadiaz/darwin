import { Agent, AgentStats, Origin, PersonalityTraits, ORIGIN_CONFIG } from '@/types/agent';

const BASE_STATS = { hp: 100, atk: 50, def: 50, int: 50, spd: 50 };

export function generateAgentStats(origin: Origin, traits: PersonalityTraits): AgentStats {
  const originBonus = ORIGIN_CONFIG[origin].statBonus;
  
  // Add personality trait influence (each trait affects stats)
  const traitBonus = {
    hp: Math.floor(traits.loyalty * 0.1), // Loyal agents have more HP
    atk: Math.floor(traits.bravery * 0.15), // Brave agents hit harder
    def: Math.floor((100 - traits.strategy) * 0.1), // Impulsive agents defend better
    int: Math.floor(traits.strategy * 0.2), // Strategic agents are smarter
    spd: Math.floor((100 - traits.social) * 0.15), // Lone wolves are faster
  };

  return {
    hp: BASE_STATS.hp + originBonus.hp + traitBonus.hp,
    atk: BASE_STATS.atk + originBonus.atk + traitBonus.atk,
    def: BASE_STATS.def + originBonus.def + traitBonus.def,
    int: BASE_STATS.int + originBonus.int + traitBonus.int,
    spd: BASE_STATS.spd + originBonus.spd + traitBonus.spd,
  };
}

export function generateBackstory(name: string, origin: Origin, traits: PersonalityTraits): string {
  const originStories = {
    dragon: [
      `Born from the smoldering embers of an ancient volcano, ${name} carries the fury of dragons within.`,
      `${name} was forged in dragonfire, their heart burning with an unquenchable flame.`,
      `Legend speaks of ${name}, who stole their power from the last of the great wyrms.`,
    ],
    scholar: [
      `${name} spent centuries studying forbidden tomes in the Tower of Eternity.`,
      `Once a simple apprentice, ${name} unlocked secrets that gave them command over reality itself.`,
      `${name} wields knowledge as their weapon, unraveling the fabric of magic with each spell.`,
    ],
    shadow: [
      `${name} walks between darkness and light, seen only when they wish to be.`,
      `Born in the void between worlds, ${name} moves like smoke through the night.`,
      `${name} learned the art of deception from the shadows themselves, becoming one with the dark.`,
    ],
    sentinel: [
      `${name} stands unwavering, an iron wall that no force can break.`,
      `Forged in the great war, ${name} has defended the realm for a thousand years.`,
      `${name} is the last of the Sentinel Order, sworn to protect the innocent at any cost.`,
    ],
  };

  const baseStory = originStories[origin][Math.floor(Math.random() * originStories[origin].length)];
  
  // Add personality flavor
  const personalityFlavor = [];
  
  if (traits.bravery > 70) {
    personalityFlavor.push('They fear nothing and charge headfirst into battle.');
  } else if (traits.bravery < 30) {
    personalityFlavor.push('They calculate every move, never rushing into danger.');
  }
  
  if (traits.loyalty > 70) {
    personalityFlavor.push('Once they pledge their allegiance, they will never betray their cause.');
  } else if (traits.loyalty < 30) {
    personalityFlavor.push('They serve only themselves, trusting no one but their own instincts.');
  }
  
  if (traits.strategy > 70) {
    personalityFlavor.push('Every action is part of a grand design, calculated moves in an endless game.');
  }
  
  if (traits.social < 30) {
    personalityFlavor.push('They walk alone, preferring solitude to the company of others.');
  }

  return [baseStory, ...personalityFlavor].join(' ');
}

export function createAgent(
  name: string,
  origin: Origin,
  traits: PersonalityTraits,
  backstory?: string,
  ownerWallet?: string
): Agent {
  const stats = generateAgentStats(origin, traits);
  const generatedBackstory = backstory || generateBackstory(name, origin, traits);

  return {
    id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    origin,
    personalityTraits: traits,
    backstory: generatedBackstory,
    stats,
    xp: 0,
    level: 1,
    wins: 0,
    losses: 0,
    ownerWallet,
    createdAt: Date.now(),
  };
}

export function getAgentAvatar(origin: Origin): string {
  return ORIGIN_CONFIG[origin].emoji;
}

export function getAgentGradient(origin: Origin): string {
  return ORIGIN_CONFIG[origin].gradient;
}

export function calculateLevel(xp: number): number {
  // Every 100 XP = 1 level
  return Math.floor(xp / 100) + 1;
}

export function getXPForNextLevel(level: number): number {
  return level * 100;
}
