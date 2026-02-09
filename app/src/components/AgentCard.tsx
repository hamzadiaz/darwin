'use client';

import { motion } from 'framer-motion';
import { Skull, TrendingUp, TrendingDown, Dna } from 'lucide-react';
import { AgentGenome, decodeGenome } from '@/types';
import { formatBps } from '@/lib/utils';
import { GenomeRadar } from './GenomeRadar';

interface AgentCardProps {
  agent: AgentGenome;
  onSelect?: (agent: AgentGenome) => void;
  compact?: boolean;
  highlight?: boolean;
  parentGenome?: number[];
}

function describeStrategy(genome: number[]): string {
  const d = decodeGenome(genome);
  const parts: string[] = [];
  if (d.momentumWeight > 0.6) parts.push('Momentum');
  else if (d.volatilityFilter > 0.6) parts.push('Vol-aware');
  else parts.push('Balanced');
  if (d.stopLossPct < 3) parts.push('tight SL');
  else if (d.stopLossPct > 7) parts.push('wide SL');
  if (d.takeProfitPct > 15) parts.push('high TP');
  if (d.tradeCooldown > 12) parts.push('patient');
  else if (d.tradeCooldown < 4) parts.push('aggressive');
  return parts.join(' · ');
}

export function AgentCard({ agent, onSelect, compact, highlight, parentGenome }: AgentCardProps) {
  const pnlPositive = agent.totalPnl >= 0;

  return (
    <motion.div
      layout
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={() => onSelect?.(agent)}
      className={`glass-card rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-white/8 relative overflow-hidden ${
        highlight ? 'border-accent-primary/25 glow-primary' : ''
      }`}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        {agent.isAlive ? (
          <div className="w-2 h-2 rounded-full bg-success/80" />
        ) : (
          <Skull className="w-3 h-3 text-text-muted/40" />
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${
          pnlPositive ? 'bg-success/8 text-success' : 'bg-danger/8 text-danger'
        }`}>
          #{agent.id}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-primary">Agent #{agent.id}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-evolution-purple/10 text-evolution-purple/80">
              G{agent.generation}
            </span>
          </div>
          <p className="text-[10px] text-text-muted truncate leading-tight mt-0.5">{describeStrategy(agent.genome)}</p>
        </div>
      </div>

      {/* PnL Row */}
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {pnlPositive ? <TrendingUp className="w-3.5 h-3.5 text-success" /> : <TrendingDown className="w-3.5 h-3.5 text-danger" />}
          <span className={`text-lg font-mono font-bold leading-none ${pnlPositive ? 'text-success' : 'text-danger'}`}>
            {pnlPositive ? '+' : ''}{formatBps(agent.totalPnl)}
          </span>
        </div>
        <span className="text-[10px] text-text-muted font-mono">
          {(agent.winRate / 100).toFixed(0)}% WR · {agent.totalTrades}t
        </span>
      </div>

      {/* Radar */}
      {!compact && (
        <div className="flex justify-center mb-3">
          <GenomeRadar genome={agent.genome} compareGenome={parentGenome} size={130} />
        </div>
      )}

      {/* Parents */}
      {(agent.parentA !== null || agent.parentB !== null) && (
        <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
          <Dna className="w-3 h-3" />
          <span>#{agent.parentA} × #{agent.parentB}</span>
        </div>
      )}

      {/* AI Analysis */}
      {agent.aiAnalysis && !compact && (
        <div className="mt-2 p-2.5 rounded-lg bg-evolution-purple/[0.04] border border-evolution-purple/8">
          <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-3">{agent.aiAnalysis}</p>
        </div>
      )}
    </motion.div>
  );
}
