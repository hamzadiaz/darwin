'use client';

import { motion } from 'framer-motion';
import { Zap, TrendingUp, Users, Activity } from 'lucide-react';
import { Generation } from '@/types';
import { formatBps } from '@/lib/utils';

interface GenerationProgressProps {
  currentGeneration: number;
  maxGenerations: number;
  generations: Generation[];
  aliveCount: number;
  status: string;
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 30;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5 }}
      />
      {/* Last point glow */}
      {values.length > 0 && (
        <motion.circle
          cx={(values.length - 1) / (values.length - 1) * w}
          cy={h - ((values[values.length - 1] - min) / range) * h}
          r={3}
          fill={color}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </svg>
  );
}

export function GenerationProgress({ currentGeneration, maxGenerations, generations, aliveCount, status }: GenerationProgressProps) {
  const progress = maxGenerations > 0 ? ((currentGeneration + 1) / maxGenerations) * 100 : 0;
  const bestPnls = generations.map(g => g.bestPnl);
  const avgPnls = generations.map(g => g.avgPnl);
  const bestPnl = bestPnls.length > 0 ? bestPnls[bestPnls.length - 1] : 0;
  const avgPnl = avgPnls.length > 0 ? avgPnls[avgPnls.length - 1] : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
    >
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-4 h-4 text-evolution-purple" />
        <div className="flex-1">
          <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
            <span>Generation {currentGeneration + 1} / {maxGenerations}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-evolution"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
        {status === 'running' && (
          <motion.div
            className="w-2 h-2 rounded-full bg-success"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <div className="metric-label mb-1">Best PnL</div>
          <div className={`metric-value text-xs sm:text-sm ${bestPnl >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatBps(bestPnl)}
          </div>
        </div>
        <div>
          <div className="metric-label mb-1">Avg PnL</div>
          <div className={`metric-value text-xs sm:text-sm ${avgPnl >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatBps(avgPnl)}
          </div>
        </div>
        <div>
          <div className="metric-label mb-1">Alive</div>
          <div className="metric-value text-xs sm:text-sm text-accent-primary flex items-center gap-1">
            <Users className="w-3 h-3" /> {aliveCount}
          </div>
        </div>
        <div>
          <div className="metric-label mb-1">Best PnL Trend</div>
          <Sparkline values={bestPnls} color="#10B981" />
        </div>
      </div>
    </motion.div>
  );
}
