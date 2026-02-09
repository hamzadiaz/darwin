'use client';

import { motion } from 'framer-motion';
import { Skull, TrendingDown, TrendingUp } from 'lucide-react';
import { AgentGenome } from '@/types';
import { formatBpsUncapped } from '@/lib/utils';

interface GraveyardProps {
  agents: AgentGenome[];
}

export function Graveyard({ agents }: GraveyardProps) {
  const dead = [...agents].filter(a => !a.isAlive).sort((a, b) => b.totalPnl - a.totalPnl);

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center">
            <Skull className="w-3.5 h-3.5 text-danger" />
          </div>
          <div>
            <h3 className="section-title text-sm">Graveyard</h3>
            <p className="text-[10px] text-text-muted">{dead.length} fallen agents</p>
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[48px_60px_1fr_80px_48px] gap-2 px-3 mb-1.5">
        <span className="text-[9px] uppercase tracking-wider text-text-muted">ID</span>
        <span className="text-[9px] uppercase tracking-wider text-text-muted">Gen</span>
        <span className="text-[9px] uppercase tracking-wider text-text-muted" />
        <span className="text-[9px] uppercase tracking-wider text-text-muted text-right">PnL</span>
        <span className="text-[9px] uppercase tracking-wider text-text-muted text-right">Trades</span>
      </div>

      <div className="space-y-0.5 max-h-[480px] overflow-y-auto scrollbar-custom">
        {dead.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            className="grid grid-cols-[48px_60px_1fr_80px_48px] gap-2 items-center px-3 py-1.5 rounded-lg row-hover"
            style={{ opacity: 0.7 }}
          >
            <span className="text-[11px] font-mono font-medium text-text-muted">#{agent.id}</span>
            <span className="text-[10px] font-mono text-text-muted">G{agent.generation}</span>
            <div />
            <span className={`text-[11px] font-mono font-bold text-right flex items-center gap-0.5 justify-end ${
              agent.totalPnl >= 0 ? 'text-success/60' : 'text-danger/60'
            }`}>
              {agent.totalPnl >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {formatBpsUncapped(agent.totalPnl)}
            </span>
            <span className="text-[10px] font-mono text-text-muted text-right">{agent.totalTrades}</span>
          </motion.div>
        ))}
        {dead.length === 0 && (
          <p className="text-xs text-text-muted text-center py-8">No casualties yet</p>
        )}
      </div>
    </div>
  );
}
