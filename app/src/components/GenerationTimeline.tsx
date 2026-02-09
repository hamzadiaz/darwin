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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-xl p-4 sm:p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-evolution-purple/10 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-evolution-purple" />
          </div>
          <div>
            <h3 className="section-title text-sm">Evolution Timeline</h3>
            <p className="text-[10px] text-text-muted">Best PnL per generation</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Profit</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-danger" /> Loss</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-0.5 h-28 px-1">
        {generations.map((gen, i) => {
          const height = (Math.abs(gen.bestPnl) / maxPnl) * 100;
          const isPositive = gen.bestPnl >= 0;

          return (
            <motion.div
              key={gen.number}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 3)}%` }}
              transition={{ delay: 0.3 + i * 0.02, duration: 0.3 }}
              className={cn(
                'flex-1 rounded-t-sm cursor-pointer transition-opacity hover:opacity-70 relative group min-w-[3px]',
                isPositive ? 'bg-success/60' : 'bg-danger/60',
              )}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-bg-card border border-white/8 rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap shadow-xl">
                  <p className="font-medium text-text-primary">Gen #{gen.number}</p>
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

      <div className="flex justify-between mt-1.5 px-1">
        <span className="text-[9px] text-text-muted font-mono">Gen 0</span>
        <span className="text-[9px] text-text-muted font-mono">Gen {generations.length - 1}</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/[0.04]">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-text-muted mb-0.5">Best Ever</p>
          <p className="text-xs font-mono font-bold text-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {generations.length > 0
              ? `+${(Math.max(...generations.map((g) => g.bestPnl)) / 100).toFixed(2)}%`
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-text-muted mb-0.5">Avg Trend</p>
          <p className="text-xs font-mono font-bold text-accent-tertiary">
            {generations.length > 1
              ? `${((generations[generations.length - 1].avgPnl - generations[0].avgPnl) / 100).toFixed(2)}%`
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-text-muted mb-0.5">Mortality</p>
          <p className="text-xs font-mono font-bold text-danger flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            {generations.length > 0
              ? `${Math.round(
                  (generations.reduce((s, g) => s + g.agentsDied, 0) /
                    Math.max(generations.reduce((s, g) => s + g.agentsBorn, 0), 1)) * 100
                )}%`
              : '—'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
