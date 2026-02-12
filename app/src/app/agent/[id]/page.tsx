'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Swords, Trophy, Target, Calendar, Flame, Wand2, Ghost, Shield } from 'lucide-react';
import { Agent, Battle } from '@/types/agent';
import { ORIGIN_CONFIG } from '@/types/agent';
import { getAgentById, getBattlesByAgent } from '@/lib/storage';
import { WC3Card, WC3Button, WC3Bar, WC3ResourceCounter } from '@/components/wc3';

const ORIGIN_ICONS = {
  dragon: Flame,
  scholar: Wand2,
  shadow: Ghost,
  sentinel: Shield,
};

export default function AgentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    const foundAgent = getAgentById(id);
    
    if (!foundAgent) {
      router.push('/');
      return;
    }
    
    setAgent(foundAgent);
    setBattles(getBattlesByAgent(id));
    setLoading(false);
  }, [params.id, router]);

  if (loading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="wc3-text-gold text-lg">Loading champion...</div>
      </div>
    );
  }

  const Icon = ORIGIN_ICONS[agent.origin];
  const winRate = agent.wins + agent.losses > 0
    ? Math.round((agent.wins / (agent.wins + agent.losses)) * 100)
    : 0;

  const currentLevelXP = agent.xp % 100;
  const xpProgress = (currentLevelXP / 100) * 100;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-wc3-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Hall
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <WC3Card elevated className="border-2 border-wc3-gold/40 wc3-glow-gold">
                {/* Hero Header */}
                <div className="flex items-start gap-6 mb-8">
                  <div className="relative">
                    <div className={`w-28 h-28 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[agent.origin].gradient} flex items-center justify-center shadow-[0_0_30px_rgba(252,211,18,0.3)] border-2 border-wc3-gold/50`}>
                      <Icon className="w-14 h-14 text-white" />
                    </div>
                    {/* Level Badge */}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-wc3-gold to-wc3-dark-gold border-3 border-card-bg flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-black">{agent.level}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold wc3-text-gold mb-2">{agent.name}</h1>
                    <p className="text-lg text-text-secondary mb-4">{ORIGIN_CONFIG[agent.origin].name}</p>
                    
                    {/* Quick Stats Row */}
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                      <WC3ResourceCounter 
                        icon={<Trophy className="w-5 h-5 wc3-text-gold" />}
                        value={`${winRate}%`}
                        label="Win Rate"
                      />
                      <WC3ResourceCounter 
                        icon={<Swords className="w-5 h-5 text-green-400" />}
                        value={agent.wins}
                        label="Victories"
                      />
                      <WC3ResourceCounter 
                        icon={<Target className="w-5 h-5 text-red-400" />}
                        value={agent.losses}
                        label="Defeats"
                      />
                    </div>

                    {/* XP Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-text-muted uppercase font-bold">Experience</span>
                        <span className="font-mono wc3-text-gold">{currentLevelXP} / 100 XP</span>
                      </div>
                      <WC3Bar 
                        current={currentLevelXP} 
                        max={100} 
                        type="energy"
                        showText={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Combat Stats */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold wc3-text-gold uppercase tracking-wider mb-4">⚔️ Combat Attributes</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(agent.stats).map(([stat, value]) => (
                      <div key={stat}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-text-secondary uppercase font-bold">{stat}</span>
                          <span className="text-sm font-mono wc3-text-gold">{value}</span>
                        </div>
                        <WC3Bar 
                          current={value} 
                          max={150} 
                          type="health"
                          showText={false}
                          className="h-2.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personality */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold wc3-text-gold uppercase tracking-wider mb-4">🎭 Forged Traits</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(agent.personalityTraits).map(([trait, value]) => (
                      <div key={trait}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-text-primary capitalize font-bold">{trait}</span>
                          <span className="text-sm font-mono wc3-text-gold">{value}%</span>
                        </div>
                        <div className="h-2 bg-black/50 border border-border-subtle rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-wc3-dark-gold to-wc3-gold rounded"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Backstory */}
                <div>
                  <h2 className="text-lg font-bold wc3-text-gold uppercase tracking-wider mb-4">📜 Chronicle</h2>
                  <p className="text-text-body leading-relaxed">{agent.backstory}</p>
                </div>
              </WC3Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <WC3Card>
                <h3 className="text-sm font-bold wc3-text-gold uppercase tracking-wider mb-4">⚔️ Actions</h3>
                <div className="space-y-3">
                  <Link href="/battle">
                    <WC3Button primary className="w-full">
                      <Swords className="w-4 h-4" />
                      Challenge to Battle
                    </WC3Button>
                  </Link>
                  
                  <Link href="/my-agents">
                    <WC3Button className="w-full">
                      View My Champions
                    </WC3Button>
                  </Link>
                </div>
              </WC3Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <WC3Card>
                <h3 className="text-sm font-bold wc3-text-gold uppercase tracking-wider mb-4">📊 Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Total XP</span>
                    <span className="font-mono wc3-text-gold font-bold">{agent.xp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Battles Fought</span>
                    <span className="font-mono text-text-primary font-bold">{agent.wins + agent.losses}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Forged</span>
                    <span className="text-xs text-text-muted">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </WC3Card>
            </motion.div>
          </div>
        </div>

        {/* Battle History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <WC3Card elevated>
            <h2 className="text-2xl font-bold wc3-text-gold mb-6">⚔️ Battle Chronicle</h2>
            
            {battles.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-body mb-4">No battles recorded. Let them prove their worth in combat!</p>
                <Link href="/battle">
                  <WC3Button primary>
                    <Swords className="w-4 h-4" />
                    Enter the Arena
                  </WC3Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {battles.slice().reverse().slice(0, 10).map((battle) => {
                  const isAgent1 = battle.agent1.id === agent.id;
                  const opponent = isAgent1 ? battle.agent2 : battle.agent1;
                  const won = battle.winnerId === agent.id;
                  
                  return (
                    <div
                      key={battle.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        won
                          ? 'bg-wc3-gold/5 border-wc3-gold/30'
                          : 'bg-red-500/5 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[opponent.origin].gradient} flex items-center justify-center border border-border-medium`}>
                          {React.createElement(ORIGIN_ICONS[opponent.origin], { className: 'w-6 h-6 text-white' })}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary">{opponent.name}</span>
                            {won ? (
                              <span className="text-xs px-2 py-0.5 rounded bg-wc3-gold/20 border border-wc3-gold/40 wc3-text-gold font-bold">VICTORY</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 font-bold">DEFEAT</span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted">
                            {battle.rounds.length} rounds · +{won ? battle.xpGained : Math.floor(battle.xpGained / 2)} XP gained
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-text-muted">
                          {new Date(battle.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </WC3Card>
        </motion.div>
      </div>
    </div>
  );
}
