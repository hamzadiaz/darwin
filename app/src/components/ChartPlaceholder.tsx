'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';

export function ChartPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl p-6 h-full min-h-[400px] relative overflow-hidden group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-tertiary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-accent-tertiary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">SOL / USDC Arena</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Trading Battlefield</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted font-mono">1H</span>
          <span className="text-accent-primary font-mono font-bold bg-accent-primary/10 px-2 py-0.5 rounded">4H</span>
          <span className="text-text-muted font-mono">1D</span>
        </div>
      </div>

      {/* Fake chart lines */}
      <div className="absolute inset-0 top-16 px-6 pb-6 flex items-end gap-[2px] opacity-20">
        {Array.from({ length: 80 }, (_, i) => {
          const height = 20 + Math.sin(i * 0.15) * 30 + Math.random() * 25;
          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.3 + i * 0.01, duration: 0.5 }}
              className={`flex-1 rounded-t-sm ${
                Math.random() > 0.45 ? 'bg-success' : 'bg-danger'
              }`}
            />
          );
        })}
      </div>

      {/* Center overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl gradient-evolution flex items-center justify-center mx-auto mb-4 glow-evolution">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <p className="text-text-secondary text-sm font-bold">Live Chart — Phase 2</p>
          <p className="text-text-muted text-xs mt-1">TradingView lightweight-charts with agent overlays</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
