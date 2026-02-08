'use client';

import { motion } from 'framer-motion';
import { Dna, Target, Zap, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  bestPnl: number;
  avgWinRate: number;
  totalGenerations: number;
  totalDeaths: number;
}

export function StatsCards({ bestPnl, avgWinRate, totalGenerations, totalDeaths }: StatsCardsProps) {
  const cards = [
    {
      label: 'Best PnL Ever',
      value: bestPnl <= -9999 ? '—' : `${bestPnl >= 0 ? '+' : ''}${(bestPnl / 100).toFixed(2)}%`,
      icon: <Target className="w-5 h-5" />,
      color: 'success' as const,
      glow: 'glow-success',
      bg: 'from-success/20 to-transparent',
      iconBg: 'bg-success shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    },
    {
      label: 'Avg Win Rate',
      value: `${(avgWinRate / 100).toFixed(1)}%`,
      icon: <Zap className="w-5 h-5" />,
      color: 'primary' as const,
      glow: 'glow-primary',
      bg: 'from-accent-primary/20 to-transparent',
      iconBg: 'bg-accent-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    },
    {
      label: 'Generations',
      value: String(totalGenerations),
      icon: <Dna className="w-5 h-5" />,
      color: 'evolution' as const,
      glow: 'glow-evolution',
      bg: 'from-evolution-purple/20 to-transparent',
      iconBg: 'bg-evolution-purple shadow-[0_0_20px_rgba(139,92,246,0.2)]',
    },
    {
      label: 'Total Deaths',
      value: String(totalDeaths),
      icon: <Skull className="w-5 h-5" />,
      color: 'danger' as const,
      glow: 'glow-danger',
      bg: 'from-danger/20 to-transparent',
      iconBg: 'bg-danger shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08 }}
          className={cn(
            'glass-card rounded-2xl p-5 relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] hover:border-white/10',
            card.glow,
          )}
        >
          <div className={cn('absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl opacity-50 group-hover:scale-150 transition-all duration-500', card.bg)} />

          <div className="relative z-10">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4', card.iconBg)}>
              {card.icon}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold mb-1">{card.label}</p>
            <p className="text-2xl font-mono font-bold text-text-primary tracking-tighter">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
