'use client';

import { motion } from 'framer-motion';
import { Trophy, Skull, TrendingUp, TrendingDown } from 'lucide-react';
import { AgentGenome } from '@/types';
import { cn, formatBps } from '@/lib/utils';

interface LeaderboardProps {
  agents: AgentGenome[];
}

export function Leaderboard({ agents }: LeaderboardProps) {
  const sorted = [...agents]
    .filter((a) => a.isAlive)
    .sort((a, b) => b.totalPnl - a.totalPnl)
    .slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-5 h-full overflow-hidden flex flex-col"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-warning" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Leaderboard</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Top Agents by PnL</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-custom space-y-2">
        {sorted.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            className={cn(
              'group relative flex items-center justify-between p-3 rounded-xl border border-white/5 hover:bg-bg-elevated/50 hover:border-white/10 transition-all',
              i === 0 && 'bg-warning/5 border-warning/20 glow-success',
              i === 1 && 'bg-bg-elevated/30',
              i === 2 && 'bg-bg-elevated/20',
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono',
                  i === 0 && 'bg-warning/20 text-warning',
                  i === 1 && 'bg-text-secondary/20 text-text-secondary',
                  i === 2 && 'bg-orange-500/20 text-orange-400',
                  i > 2 && 'bg-bg-card text-text-muted',
                )}
              >
                {i + 1}
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary tracking-tight flex items-center gap-1.5">
                  Agent #{agent.id}
                  {!agent.isAlive && <Skull className="w-3 h-3 text-danger" />}
                </p>
                <p className="text-[9px] text-text-muted font-mono">
                  Gen {agent.generation} · {agent.totalTrades} trades
                </p>
              </div>
            </div>

            <div className="text-right">
              <p
                className={cn(
                  'text-xs font-mono font-bold tracking-tight',
                  agent.totalPnl >= 0 ? 'text-success' : 'text-danger',
                )}
              >
                {agent.totalPnl >= 0 ? (
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 inline mr-1" />
                )}
                {formatBps(agent.totalPnl)}
              </p>
              <p className="text-[9px] text-text-muted font-mono">
                {(agent.winRate / 100).toFixed(1)}% WR
              </p>
            </div>
          </motion.div>
        ))}

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Skull className="w-8 h-8 text-text-muted mb-3 opacity-30" />
            <p className="text-text-muted text-xs">No agents alive</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
