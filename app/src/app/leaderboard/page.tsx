'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Medal, ArrowLeft, Crown, Flame, Wand2, Ghost, Shield } from 'lucide-react';
import { Agent } from '@/types/agent';
import { ORIGIN_CONFIG } from '@/types/agent';
import { getLeaderboard } from '@/lib/storage';
import { WC3Card, WC3Button } from '@/components/wc3';

const ORIGIN_ICONS = {
  dragon: Flame,
  scholar: Wand2,
  shadow: Ghost,
  sentinel: Shield,
};

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    setAgents(getLeaderboard(50));
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-wc3-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Hall
        </Link>

        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-wc3-gold to-wc3-dark-gold mb-6 shadow-[0_0_40px_rgba(252,211,18,0.4)]"
          >
            <Trophy className="w-10 h-10 text-black" />
          </motion.div>
          
          <h1 className="text-5xl font-bold wc3-text-gold mb-4">🏆 Hall of Champions</h1>
          <p className="text-text-body text-lg">The mightiest warriors, ranked by glory and conquest</p>
        </div>

        {agents.length === 0 ? (
          <WC3Card dialog className="text-center py-20 max-w-lg mx-auto">
            <p className="text-text-body mb-6">The Hall stands empty. Be the first to forge a legend!</p>
            <Link href="/create">
              <WC3Button primary>
                <Flame className="w-5 h-5" />
                Forge First Champion
              </WC3Button>
            </Link>
          </WC3Card>
        ) : (
          <div className="space-y-3">
            {agents.map((agent, index) => {
              const Icon = ORIGIN_ICONS[agent.origin];
              const rank = index + 1;
              const winRate = agent.wins + agent.losses > 0
                ? Math.round((agent.wins / (agent.wins + agent.losses)) * 100)
                : 0;
              const isTopThree = rank <= 3;

              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/agent/${agent.id}`}>
                    <WC3Card className={`group wc3-hover-glow flex items-center gap-4 ${
                      isTopThree
                        ? 'border-2 border-wc3-gold/50 bg-gradient-to-r from-wc3-gold/10 to-transparent'
                        : 'border border-border-medium'
                    }`}>
                      {/* Rank Badge */}
                      <div className={`flex items-center justify-center w-14 h-14 rounded-lg ${
                        isTopThree 
                          ? 'bg-gradient-to-br from-wc3-gold to-wc3-dark-gold border-2 border-wc3-gold/50' 
                          : 'bg-card-elevated border border-border-medium'
                      }`}>
                        {rank === 1 && <Crown className="w-7 h-7 text-black" />}
                        {rank === 2 && <Medal className="w-7 h-7 text-gray-800" />}
                        {rank === 3 && <Medal className="w-7 h-7 text-orange-900" />}
                        {rank > 3 && <span className="text-lg font-bold text-text-muted">#{rank}</span>}
                      </div>

                      {/* Agent Icon */}
                      <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${ORIGIN_CONFIG[agent.origin].gradient} flex items-center justify-center border-2 ${
                        isTopThree ? 'border-wc3-gold/30' : 'border-border-medium'
                      } shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold group-hover:text-wc3-gold transition-colors ${
                          isTopThree ? 'wc3-text-gold' : 'text-text-primary'
                        }`}>
                          {agent.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                          <span>{ORIGIN_CONFIG[agent.origin].name}</span>
                          <span>•</span>
                          <span>Level {agent.level}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-center">
                        <div>
                          <div className="text-xs text-text-muted mb-1 uppercase font-bold">Victories</div>
                          <div className="text-xl font-bold text-green-400">{agent.wins}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-text-muted mb-1 uppercase font-bold">Defeats</div>
                          <div className="text-xl font-bold text-red-400">{agent.losses}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-text-muted mb-1 uppercase font-bold">Win Rate</div>
                          <div className={`text-xl font-bold ${isTopThree ? 'wc3-text-gold' : 'text-text-primary'}`}>
                            {winRate}%
                          </div>
                        </div>
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
