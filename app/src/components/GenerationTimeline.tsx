'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Generation } from '@/types';
import { cn } from '@/lib/utils';

interface GenerationTimelineProps {
  generations: Generation[];
}

export function GenerationTimeline({ generations }: GenerationTimelineProps) {
  const maxPnl = Math.max(...generations.map((g) => Math.abs(g.bestPnl)), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-evolution-purple/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-evolution-purple" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Evolution Timeline
            </h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
              Best PnL per Generation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1 text-success">
            <div className="w-2 h-2 rounded-full bg-success" /> Profit
          </span>
          <span className="flex items-center gap-1 text-danger">
            <div className="w-2 h-2 rounded-full bg-danger" /> Loss
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-32 px-2">
        {generations.map((gen, i) => {
          const height = (Math.abs(gen.bestPnl) / maxPnl) * 100;
          const isPositive = gen.bestPnl >= 0;

          return (
            <motion.div
              key={gen.number}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 4)}%` }}
              transition={{ delay: 0.5 + i * 0.03, duration: 0.4 }}
              className={cn(
                'flex-1 rounded-t-sm cursor-pointer transition-all hover:opacity-80 relative group min-w-[4px]',
                isPositive ? 'bg-success/70' : 'bg-danger/70',
              )}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                  <p className="font-bold text-text-primary">Gen #{gen.number}</p>
                  <p className={cn('font-mono', isPositive ? 'text-success' : 'text-danger')}>
                    {isPositive ? '+' : ''}{(gen.bestPnl / 100).toFixed(2)}%
                  </p>
                  <p className="text-text-muted">Agent #{gen.bestAgent}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Generation labels */}
      <div className="flex justify-between mt-2 px-2">
        <span className="text-[9px] text-text-muted font-mono">Gen 0</span>
        <span className="text-[9px] text-text-muted font-mono">
          Gen {generations.length - 1}
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Best Ever</p>
          <p className="text-sm font-mono font-bold text-success tracking-tight flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {generations.length > 0
              ? `+${(Math.max(...generations.map((g) => g.bestPnl)) / 100).toFixed(2)}%`
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Avg Trend</p>
          <p className="text-sm font-mono font-bold text-accent-tertiary tracking-tight">
            {generations.length > 1
              ? `${(
                  (generations[generations.length - 1].avgPnl - generations[0].avgPnl) /
                  100
                ).toFixed(2)}%`
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Mortality</p>
          <p className="text-sm font-mono font-bold text-danger tracking-tight flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            {generations.length > 0
              ? `${Math.round(
                  (generations.reduce((s, g) => s + g.agentsDied, 0) /
                    Math.max(generations.reduce((s, g) => s + g.agentsBorn, 0), 1)) *
                    100,
                )}%`
              : '—'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
