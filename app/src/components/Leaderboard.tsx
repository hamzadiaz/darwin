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
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="glass-card rounded-xl p-4 sm:p-5 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-warning" />
          </div>
          <div>
            <h3 className="section-title text-sm">Leaderboard</h3>
            <p className="text-[10px] text-text-muted">Top agents by PnL</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-text-muted">{sorted.length} alive</span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[28px_1fr_auto] gap-2 px-2 mb-1.5">
        <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium">#</span>
        <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium">Agent</span>
        <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium text-right">PnL</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto scrollbar-custom space-y-0.5">
        {sorted.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.04, duration: 0.3 }}
            className={cn(
              'grid grid-cols-[28px_1fr_auto] gap-2 items-center px-2 py-2 rounded-lg row-hover cursor-default',
              i === 0 && 'bg-warning/[0.04]',
            )}
          >
            {/* Rank */}
            <div
              className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono',
                i === 0 && 'bg-warning/15 text-warning',
                i === 1 && 'bg-text-secondary/10 text-text-secondary',
                i === 2 && 'bg-orange-500/10 text-orange-400',
                i > 2 && 'text-text-muted',
              )}
            >
              {i + 1}
            </div>

            {/* Agent Info */}
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary flex items-center gap-1.5 leading-none mb-0.5">
                Agent #{agent.id}
                {!agent.isAlive && <Skull className="w-2.5 h-2.5 text-danger/60" />}
              </p>
              <p className="text-[10px] text-text-muted font-mono leading-none">
                Gen {agent.generation} · {agent.totalTrades}t · {(agent.winRate / 100).toFixed(0)}% WR
              </p>
            </div>

            {/* PnL */}
            <div className="text-right">
              <p
                className={cn(
                  'text-xs font-mono font-bold leading-none flex items-center gap-0.5 justify-end',
                  agent.totalPnl >= 0 ? 'text-success' : 'text-danger',
                )}
              >
                {agent.totalPnl >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatBps(agent.totalPnl)}
              </p>
            </div>
          </motion.div>
        ))}

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Skull className="w-6 h-6 text-text-muted/20 mb-2" />
            <p className="text-text-muted text-xs">No agents alive</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
