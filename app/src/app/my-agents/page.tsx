'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft, Flame, Wand2, Ghost, Shield } from 'lucide-react';
import { Agent } from '@/types/agent';
import { ORIGIN_CONFIG } from '@/types/agent';
import { getAllAgents } from '@/lib/storage';
import { WC3Card, WC3Button } from '@/components/wc3';

const ORIGIN_ICONS = {
  dragon: Flame,
  scholar: Wand2,
  shadow: Ghost,
  sentinel: Shield,
};

export default function MyAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    // For MVP, show all agents (in production, filter by wallet)
    setAgents(getAllAgents());
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-wc3-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Hall
          </Link>
          
          <Link href="/create">
            <WC3Button primary>
              <Plus className="w-4 h-4" />
              Forge New Champion
            </WC3Button>
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-5xl font-bold wc3-text-gold mb-4">⚔️ My Champions</h1>
          <p className="text-text-body text-lg">
            {agents.length} {agents.length === 1 ? 'champion' : 'champions'} await your command
          </p>
        </div>

        {agents.length === 0 ? (
          <WC3Card dialog className="text-center py-20 max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-card-elevated border-2 border-wc3-gold/30 flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 wc3-text-gold" />
            </div>
            <h2 className="text-2xl font-bold wc3-text-gold mb-4">No Champions Forged</h2>
            <p className="text-text-body mb-8">The forge stands ready. Summon your first legendary hero!</p>
            <Link href="/create">
              <WC3Button primary className="text-lg">
                <Plus className="w-5 h-5" />
                Forge First Champion
              </WC3Button>
            </Link>
          </WC3Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, index) => {
              const Icon = ORIGIN_ICONS[agent.origin];
              const winRate = agent.wins + agent.losses > 0
                ? Math.round((agent.wins / (agent.wins + agent.losses)) * 100)
                : 0;

              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/agent/${agent.id}`}>
                    <WC3Card className="group wc3-hover-glow">
                      {/* Agent Icon & Name */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[agent.origin].gradient} flex items-center justify-center border-2 border-border-medium shadow-lg`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          {/* Level Badge */}
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-wc3-gold to-wc3-dark-gold border-2 border-card-bg flex items-center justify-center">
                            <span className="text-[10px] font-bold text-black">{agent.level}</span>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-bold wc3-text-gold group-hover:text-wc3-gold transition-colors">{agent.name}</h3>
                          <p className="text-sm text-text-muted">{ORIGIN_CONFIG[agent.origin].name}</p>
                        </div>
                      </div>

                      {/* XP Progress */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-text-muted uppercase font-bold">Experience</span>
                          <span className="font-mono wc3-text-gold">{agent.xp % 100} / 100 XP</span>
                        </div>
                        <div className="h-2 bg-black/50 border border-border-subtle rounded overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-wc3-dark-gold to-wc3-gold`}
                            style={{ width: `${((agent.xp % 100) / 100) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="text-center p-2 rounded bg-card-elevated border border-border-subtle">
                          <div className="text-[10px] text-text-muted mb-1 uppercase font-bold">Victories</div>
                          <div className="text-lg font-bold text-green-400">{agent.wins}</div>
                        </div>
                        <div className="text-center p-2 rounded bg-card-elevated border border-border-subtle">
                          <div className="text-[10px] text-text-muted mb-1 uppercase font-bold">Defeats</div>
                          <div className="text-lg font-bold text-red-400">{agent.losses}</div>
                        </div>
                        <div className="text-center p-2 rounded bg-card-elevated border border-border-subtle">
                          <div className="text-[10px] text-text-muted mb-1 uppercase font-bold">Win Rate</div>
                          <div className="text-lg font-bold wc3-text-gold">{winRate}%</div>
                        </div>
                      </div>

                      {/* Combat Stats Preview */}
                      <div className="space-y-2">
                        {Object.entries(agent.stats).slice(0, 3).map(([stat, value]) => (
                          <div key={stat} className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary uppercase font-bold">{stat}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-black/50 border border-border-subtle rounded overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r from-wc3-dark-gold to-wc3-gold`}
                                  style={{ width: `${(value / 150) * 100}%` }}
                                />
                              </div>
                              <span className="font-mono wc3-text-gold w-8 text-right text-xs">{value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </WC3Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
