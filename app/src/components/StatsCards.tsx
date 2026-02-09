'use client';

import { motion } from 'framer-motion';
import { Target, Zap, Dna, Skull } from 'lucide-react';

interface StatsCardsProps {
  bestPnl: number;
  avgWinRate: number;
  totalGenerations: number;
  totalDeaths: number;
}

export function StatsCards({ bestPnl, avgWinRate, totalGenerations, totalDeaths }: StatsCardsProps) {
  const cards = [
    {
      label: 'Best PnL',
      value: bestPnl <= -9999 ? '—' : bestPnl > 1000000 ? '+10,000%+' : `${bestPnl >= 0 ? '+' : ''}${(bestPnl / 100).toFixed(2)}%`,
      icon: Target,
      accentColor: 'text-success',
      glowColor: 'rgba(16, 185, 129, 0.08)',
      iconBg: 'bg-success/10',
    },
    {
      label: 'Win Rate',
      value: `${(avgWinRate / 100).toFixed(1)}%`,
      icon: Zap,
      accentColor: 'text-accent-primary',
      glowColor: 'rgba(59, 130, 246, 0.08)',
      iconBg: 'bg-accent-primary/10',
    },
    {
      label: 'Generations',
      value: String(totalGenerations),
      icon: Dna,
      accentColor: 'text-evolution-purple',
      glowColor: 'rgba(139, 92, 246, 0.08)',
      iconBg: 'bg-evolution-purple/10',
    },
    {
      label: 'Deaths',
      value: String(totalDeaths),
      icon: Skull,
      accentColor: 'text-danger',
      glowColor: 'rgba(239, 68, 68, 0.08)',
      iconBg: 'bg-danger/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
            className="glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden group transition-all duration-200 hover:border-white/8"
            style={{ boxShadow: `0 0 32px -8px ${card.glowColor}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${card.accentColor}`} />
              </div>
            </div>
            <p className="metric-label mb-1">{card.label}</p>
            <p className={`text-2xl sm:text-3xl font-mono font-bold ${card.accentColor} tracking-tighter leading-none`}>
              {card.value}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
