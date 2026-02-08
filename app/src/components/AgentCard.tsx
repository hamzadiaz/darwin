'use client';

import { motion } from 'framer-motion';
import { Skull, Heart, TrendingUp, TrendingDown, Dna, Clock } from 'lucide-react';
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
  if (d.momentumWeight > 0.6) parts.push('Momentum-driven');
  else if (d.volatilityFilter > 0.6) parts.push('Volatility-aware');
  else parts.push('Balanced');
  if (d.stopLossPct < 3) parts.push('tight stops');
  else if (d.stopLossPct > 7) parts.push('wide stops');
  if (d.takeProfitPct > 15) parts.push('high targets');
  if (d.tradeCooldown > 12) parts.push('patient');
  else if (d.tradeCooldown < 4) parts.push('aggressive');
  return parts.join(' · ');
}

export function AgentCard({ agent, onSelect, compact, highlight, parentGenome }: AgentCardProps) {
  const pnlPositive = agent.totalPnl >= 0;

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0, filter: 'grayscale(1)' }}
      whileHover={{ y: -4, boxShadow: `0 12px 40px rgba(${pnlPositive ? '16,185,129' : '239,68,68'},0.15)` }}
      onClick={() => onSelect?.(agent)}
      className={`glass-card rounded-2xl p-4 cursor-pointer transition-colors relative overflow-hidden ${highlight ? 'border-accent-primary/40 glow-primary' : ''}`}
    >
      {/* Status glow */}
      {agent.isAlive && (
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-success"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
      {!agent.isAlive && (
        <div className="absolute top-2 right-2">
          <Skull className="w-3.5 h-3.5 text-text-muted/50" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${pnlPositive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          #{agent.id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-text-primary">Agent #{agent.id}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-evolution-purple/20 text-evolution-purple">
              Gen {agent.generation}
            </span>
          </div>
          <p className="text-[10px] text-text-muted truncate">{describeStrategy(agent.genome)}</p>
        </div>
      </div>

      {/* PnL */}
      <div className="flex items-center gap-2 mb-3">
        {pnlPositive ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-danger" />}
        <span className={`text-lg font-mono font-bold ${pnlPositive ? 'text-success' : 'text-danger'}`}>
          {pnlPositive ? '+' : ''}{formatBps(agent.totalPnl)}
        </span>
        <span className="text-[10px] text-text-muted ml-auto font-mono">
          WR {(agent.winRate / 100).toFixed(0)}%
        </span>
      </div>

      {/* Radar */}
      {!compact && (
        <div className="flex justify-center mb-2">
          <GenomeRadar genome={agent.genome} compareGenome={parentGenome} size={140} />
        </div>
      )}

      {/* Parents */}
      {(agent.parentA !== null || agent.parentB !== null) && (
        <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
          <Dna className="w-3 h-3" />
          <span>Parents: #{agent.parentA} × #{agent.parentB}</span>
        </div>
      )}

      {/* AI Analysis */}
      {agent.aiAnalysis && !compact && (
        <div className="mt-2 p-2 rounded-lg bg-evolution-purple/5 border border-evolution-purple/10">
          <p className="text-[10px] text-text-muted leading-relaxed line-clamp-3">{agent.aiAnalysis}</p>
        </div>
      )}
    </motion.div>
  );
}
