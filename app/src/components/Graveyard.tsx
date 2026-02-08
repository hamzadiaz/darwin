'use client';

import { motion } from 'framer-motion';
import { Skull, TrendingDown, TrendingUp } from 'lucide-react';
import { AgentGenome } from '@/types';
import { formatBps } from '@/lib/utils';

interface GraveyardProps {
  agents: AgentGenome[];
}

export function Graveyard({ agents }: GraveyardProps) {
  const dead = [...agents].filter(a => !a.isAlive).sort((a, b) => b.totalPnl - a.totalPnl);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
          <Skull className="w-4 h-4 text-danger" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Graveyard</h3>
          <p className="text-[10px] text-text-muted">{dead.length} fallen agents</p>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-custom">
        {dead.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-elevated/50 border border-white/5"
            style={{ filter: 'grayscale(0.3)' }}
          >
            <span className="text-xs font-mono font-bold text-text-muted w-8">#{agent.id}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-text-muted/10 text-text-muted">
              Gen {agent.generation}
            </span>
            <div className="flex-1" />
            <span className={`text-xs font-mono font-bold flex items-center gap-1 ${agent.totalPnl >= 0 ? 'text-success/60' : 'text-danger/60'}`}>
              {agent.totalPnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatBps(agent.totalPnl)}
            </span>
            <span className="text-[10px] font-mono text-text-muted">
              {agent.totalTrades}t
            </span>
          </motion.div>
        ))}
        {dead.length === 0 && (
          <p className="text-sm text-text-muted text-center py-8">No casualties yet</p>
        )}
      </div>
    </div>
  );
}
