'use client';

import { motion } from 'framer-motion';
import { Target, Zap, Dna, Skull, Scale, TrendingUp } from 'lucide-react';
import { Tooltip } from './Tooltip';

const TOOLTIPS: Record<string, string> = {
  'Best PnL': 'Highest cumulative return achieved by any agent in this evolution run. Includes compounding, fees, and slippage.',
  'Win Rate': 'Percentage of trades that were profitable. Low WR with high R:R ratio can still be very profitable. Trend-following strategies typically have 30-45% WR.',
  'Profit Factor': 'Gross profits divided by gross losses. >1.0 is profitable, >2.0 is excellent, >3.0 is exceptional.',
  'Avg EV/Trade': 'Average profit/loss per trade. Positive EV means the strategy is profitable over time. EV = (WR × avg_win) - ((1-WR) × avg_loss).',
  'Generations': 'Number of evolution cycles completed. Each generation: all agents trade, bottom 80% die, survivors breed children with mutations.',
  'Deaths': 'Total agents eliminated during evolution. Higher death count means more aggressive natural selection.',
};

interface StatsCardsProps {
  bestPnl: number;
  avgWinRate: number;
  totalGenerations: number;
  totalDeaths: number;
  avgProfitFactor?: number;
  avgExpectedValue?: number;
}

export function StatsCards({ bestPnl, avgWinRate, totalGenerations, totalDeaths, avgProfitFactor, avgExpectedValue }: StatsCardsProps) {
  const cards = [
    {
      label: 'Best PnL',
      value: bestPnl <= -9999 ? '—' : (() => { const pct = bestPnl / 100; const sign = pct >= 0 ? '+' : ''; return Math.abs(pct) >= 1000 ? `${sign}${pct.toLocaleString('en-US', { maximumFractionDigits: 0 })}%` : `${sign}${pct.toFixed(2)}%`; })(),
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
      label: 'Profit Factor',
      value: avgProfitFactor != null ? avgProfitFactor.toFixed(2) : '—',
      icon: Scale,
      accentColor: avgProfitFactor != null && avgProfitFactor >= 1 ? 'text-success' : 'text-warning',
      glowColor: 'rgba(234, 179, 8, 0.08)',
      iconBg: 'bg-warning/10',
    },
    {
      label: 'Avg EV/Trade',
      value: avgExpectedValue != null ? `${avgExpectedValue >= 0 ? '+' : ''}${avgExpectedValue.toFixed(2)}%` : '—',
      icon: TrendingUp,
      accentColor: avgExpectedValue != null && avgExpectedValue >= 0 ? 'text-success' : 'text-danger',
      glowColor: 'rgba(16, 185, 129, 0.08)',
      iconBg: 'bg-success/10',
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
            <Tooltip content={TOOLTIPS[card.label] || card.label}>
              <p className="metric-label mb-1 cursor-help border-b border-dotted border-white/10">{card.label}</p>
            </Tooltip>
            <p className={`text-2xl sm:text-3xl font-mono font-bold ${card.accentColor} tracking-tighter leading-none`}>
              {card.value}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
