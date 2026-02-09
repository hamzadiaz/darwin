'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Heart, Baby, Trophy, Zap, Activity, Clock, Users, TrendingUp, Target } from 'lucide-react';

interface BattleEvent {
  gen: number;
  type: 'kill' | 'survive' | 'born' | 'new-best';
  agentId: number;
  pnl?: number;
  parentA?: number;
  parentB?: number;
  message: string;
}

interface BattleDashboardProps {
  generation: number;
  maxGenerations: number;
  aliveCount: number;
  populationSize: number;
  bestPnl: number;
  bestAgentId: number;
  avgPnl: number;
  totalDeaths: number;
  battleEvents: BattleEvent[];
  battlePeriods: string[];
  generationTimes: number[]; // ms per generation for ETA
  prevBestPnl?: number;
}

const PERIOD_LABELS: Record<string, string> = {
  'bull-2024': 'Bull 2024',
  'bear-2022': 'Bear 2022',
  'crash-2021': 'Crash 2021',
  'last-90d': 'Last 90d',
  'last-30d': 'Last 30d',
  'last-1y': 'Last 1Y',
  'full-history': 'Full',
};

function AnimatedNumber({ value, decimals = 1, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      key={value.toFixed(decimals)}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </motion.span>
  );
}

export function BattleEvolutionDashboard({
  generation,
  maxGenerations,
  aliveCount,
  populationSize,
  bestPnl,
  bestAgentId,
  avgPnl,
  totalDeaths,
  battleEvents,
  battlePeriods,
  generationTimes,
  prevBestPnl,
}: BattleDashboardProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [newBest, setNewBest] = useState(false);
  const progress = maxGenerations > 0 ? (generation / maxGenerations) * 100 : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Flash green when new best
  useEffect(() => {
    if (prevBestPnl !== undefined && bestPnl > prevBestPnl && bestPnl > -Infinity) {
      setNewBest(true);
      const t = setTimeout(() => setNewBest(false), 1500);
      return () => clearTimeout(t);
    }
  }, [bestPnl, prevBestPnl]);

  // Auto-scroll kill feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [battleEvents.length]);

  // ETA calculation
  const avgGenTime = generationTimes.length > 0
    ? generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length
    : 0;
  const remainingGens = maxGenerations - generation;
  const etaMs = avgGenTime * remainingGens;
  const etaSeconds = Math.round(etaMs / 1000);

  const killedThisGen = battleEvents.filter(e => e.gen === generation - 1 && e.type === 'kill').length;
  const bornThisGen = battleEvents.filter(e => e.gen === generation - 1 && e.type === 'born').length;

  // Population history for mini chart
  const recentEvents = battleEvents.slice(-100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-white/[0.08] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(10,15,20,0.8) 100%)',
        backdropFilter: 'blur(24px)',
        boxShadow: newBest ? '0 0 60px rgba(0,255,136,0.15), inset 0 0 60px rgba(0,255,136,0.03)' : '0 0 40px rgba(0,0,0,0.3)',
        transition: 'box-shadow 0.5s ease',
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Progress Ring */}
            <svg width="48" height="48" className="-rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <motion.circle
                cx="24" cy="24" r="20" fill="none"
                stroke="url(#progressGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00ff88" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white font-mono">{Math.round(progress)}%</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Battle Evolution</h3>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"
              />
            </div>
            <p className="text-[11px] font-mono text-[#8B949E]">
              Generation <motion.span key={generation} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white font-bold">{generation}</motion.span>/{maxGenerations}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#484F58]">
          <Clock className="w-3 h-3" />
          {etaSeconds > 0 ? `~${etaSeconds}s remaining` : 'Calculating...'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
        {/* Left: Stats */}
        <div className="p-5 space-y-4 lg:col-span-1">
          {/* Population */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-[#484F58] font-bold">
              <Users className="w-3 h-3" /> Population
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-white">{aliveCount}</span>
                  <span className="text-[10px] text-[#484F58]">alive</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
                  <span className="text-[#00ff88]">+{bornThisGen} born</span>
                  <span className="text-red-400">-{killedThisGen} killed</span>
                </div>
              </div>
              {/* Mini population bar */}
              <div className="flex gap-[2px] items-end h-8">
                {Array.from({ length: populationSize }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full"
                    initial={{ height: 0 }}
                    animate={{
                      height: i < aliveCount ? '100%' : '30%',
                      backgroundColor: i < aliveCount ? '#00ff88' : 'rgba(239,68,68,0.3)',
                    }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Best PnL */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-[#484F58] font-bold">
              <Trophy className="w-3 h-3" /> Leading Agent
            </div>
            <div className={`transition-colors duration-500 ${newBest ? 'text-[#00ff88]' : 'text-white'}`}>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono">
                  <AnimatedNumber value={bestPnl / 100} prefix={bestPnl >= 0 ? '+' : ''} suffix="%" />
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#8B949E]">
                Agent #{bestAgentId}
              </div>
            </div>
          </div>

          {/* Avg PnL */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-[#484F58] font-bold">
              <Activity className="w-3 h-3" /> Avg Performance
            </div>
            <span className={`text-lg font-bold font-mono ${avgPnl >= 0 ? 'text-[#06B6D4]' : 'text-red-400'}`}>
              <AnimatedNumber value={avgPnl / 100} prefix={avgPnl >= 0 ? '+' : ''} suffix="%" />
            </span>
          </div>

          {/* Deaths */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <Skull className="w-3 h-3 text-red-400/60" />
            <span className="text-[#8B949E]">{totalDeaths} total deaths</span>
          </div>
        </div>

        {/* Center: Period Progress + Population Chart */}
        <div className="p-5 space-y-4 lg:col-span-1">
          {/* Period Progress */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-[#484F58] font-bold">
              <Target className="w-3 h-3" /> Battle Periods
            </div>
            <div className="space-y-1.5">
              {battlePeriods.map((period) => (
                <div key={period} className="flex items-center gap-2 text-[11px] font-mono">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                    className="text-[#00ff88]"
                  >
                    ⚔️
                  </motion.div>
                  <span className="text-[#8B949E]">{PERIOD_LABELS[period] || period}</span>
                  <span className="text-[#00ff88]/60 text-[9px]">active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 Agents Mini Chart */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-[#484F58] font-bold">
              <TrendingUp className="w-3 h-3" /> Top Agents
            </div>
            <TopAgentsChart battleEvents={battleEvents} generation={generation} />
          </div>
        </div>

        {/* Right: Kill Feed */}
        <div className="p-5 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-[#484F58] font-bold mb-3">
            <Zap className="w-3 h-3" /> Live Feed
          </div>
          <div
            ref={feedRef}
            className="space-y-1 max-h-[240px] overflow-y-auto scrollbar-custom pr-1"
          >
            <AnimatePresence initial={false}>
              {battleEvents.slice(-30).map((event, i) => (
                <motion.div
                  key={`${event.gen}-${event.type}-${event.agentId}-${i}`}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                  className={`text-[10px] font-mono py-1 px-2 rounded-md border ${
                    event.type === 'kill'
                      ? 'text-red-400/80 bg-red-500/[0.04] border-red-500/[0.08]'
                      : event.type === 'new-best'
                      ? 'text-[#00ff88] bg-[#00ff88]/[0.04] border-[#00ff88]/[0.08]'
                      : event.type === 'born'
                      ? 'text-[#8B5CF6]/80 bg-[#8B5CF6]/[0.04] border-[#8B5CF6]/[0.08]'
                      : 'text-[#06B6D4]/70 bg-[#06B6D4]/[0.03] border-[#06B6D4]/[0.06]'
                  }`}
                >
                  <span className="text-[#484F58] mr-1.5">G{event.gen}</span>
                  {event.message}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TopAgentsChart({ battleEvents, generation }: { battleEvents: BattleEvent[]; generation: number }) {
  // Get the best surviving agents from recent events
  const survivors = battleEvents
    .filter(e => e.type === 'survive' && e.gen >= generation - 2)
    .sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0))
    .slice(0, 5);

  if (survivors.length === 0) {
    return <div className="text-[10px] text-[#484F58] font-mono">Waiting for data...</div>;
  }

  const maxPnl = Math.max(...survivors.map(s => Math.abs(s.pnl ?? 0)), 1);

  return (
    <div className="space-y-1.5">
      {survivors.map((s, i) => {
        const pnl = (s.pnl ?? 0) / 100;
        const width = Math.min(Math.abs(s.pnl ?? 0) / maxPnl * 100, 100);
        return (
          <div key={`${s.agentId}-${i}`} className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[#484F58] w-8 text-right">#{s.agentId}</span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  background: pnl >= 0
                    ? `linear-gradient(90deg, rgba(0,255,136,0.3), rgba(0,255,136,0.6))`
                    : `linear-gradient(90deg, rgba(239,68,68,0.3), rgba(239,68,68,0.6))`,
                }}
              />
            </div>
            <span className={`text-[9px] font-mono w-14 text-right ${pnl >= 0 ? 'text-[#00ff88]' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
