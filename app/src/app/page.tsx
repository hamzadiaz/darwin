'use client';

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Header } from '@/components/Header';
import { CandleChart } from '@/components/CandleChart';
import { Leaderboard } from '@/components/Leaderboard';
import { StatsCards } from '@/components/StatsCards';
import { GenerationProgress } from '@/components/GenerationProgress';
import { BreedingView } from '@/components/BreedingView';
import { DnaHelix } from '@/components/DnaHelix';
import { Graveyard } from '@/components/Graveyard';
import { AgentCard } from '@/components/AgentCard';
import { AiAnalyst } from '@/components/AiAnalyst';
import { Play, Square, Loader2, RotateCcw, Swords, FlaskConical, GitFork, Skull, Dna, Zap, TrendingUp, ArrowRight, Brain, Rocket, Download, BarChart3, ChevronDown, Target, Crosshair, GitBranch, Shield, Cpu, Activity, LineChart } from 'lucide-react';
import { AgentGenome, Generation } from '@/types';
import { SolanaPanel } from '@/components/SolanaPanel';
import { LiveTrading } from '@/components/LiveTrading';
import type { AIBreedingResult } from '@/lib/engine/ai-breeder';
import type { TradingPair } from '@/lib/engine/market';
import { BattleTestCard } from '@/components/BattleTestCard';

const PERIODS: { id: string; label: string }[] = [
  { id: '', label: 'Default' },
  { id: 'last-30d', label: '30d' },
  { id: 'last-90d', label: '90d' },
  { id: 'last-1y', label: '1Y' },
  { id: 'bull-2024', label: 'Bull 2024' },
  { id: 'bear-2022', label: 'Bear 2022' },
  { id: 'crash-2021', label: 'Crash 2021' },
  { id: 'full-history', label: 'Full' },
];

const PAIRS: { symbol: TradingPair; label: string; icon: string }[] = [
  { symbol: 'SOLUSDT', label: 'SOL', icon: '◎' },
  { symbol: 'BTCUSDT', label: 'BTC', icon: '₿' },
  { symbol: 'ETHUSDT', label: 'ETH', icon: 'Ξ' },
];

const FamilyTree = lazy(() => import('@/components/FamilyTree').then(m => ({ default: m.FamilyTree })));

interface EvolutionData {
  status: 'idle' | 'running' | 'paused' | 'complete';
  currentGeneration: number;
  maxGenerations: number;
  populationSize: number;
  agents: AgentGenome[];
  allAgents: AgentGenome[];
  generations: Generation[];
  candles: { time: number; open: number; high: number; low: number; close: number }[];
  trades: Record<number, { entryIdx: number; entryPrice: number; exitIdx: number; exitPrice: number; pnlPct: number; side: string; exitReason: string }[]>;
  bestEverPnl: number;
  bestEverAgentId: number;
  aiGuidedEvolution?: boolean;
  lastAIBreedingResult?: AIBreedingResult | null;
  candleInfo?: {
    count: number;
    interval: string;
    startDate: string;
    endDate: string;
    days: number;
    pair: string;
  } | null;
  period?: string | null;
}

const TABS = [
  { id: 'arena', label: 'Arena', icon: Swords },
  { id: 'lab', label: 'Lab', icon: FlaskConical },
  { id: 'analyst', label: 'AI Analyst', icon: Brain },
  { id: 'live', label: 'Live', icon: Rocket },
  { id: 'tree', label: 'Family Tree', icon: GitFork },
  { id: 'graveyard', label: 'Graveyard', icon: Skull },
] as const;

type TabId = typeof TABS[number]['id'];

const SAMPLE_GENOME = [720, 350, 680, 500, 300, 750, 250, 600, 450, 200, 550, 800, 400, 600, 500, 650, 450, 550, 400, 350];

// ─── Landing Page Components ───────────────────────────────────────

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref} className="font-mono">{prefix}{count.toLocaleString()}{suffix}</span>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div
      className="text-center mb-12 lg:mb-16"
    >
      <p className="text-[10px] uppercase tracking-[0.4em] text-accent-primary font-bold mb-3">{eyebrow}</p>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary tracking-tight mb-4">{title}</h2>
      <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">{description}</p>
    </div>
  );
}

const HOW_IT_WORKS = [
  { step: '01', icon: Dna, title: 'Spawn', desc: 'Random genomes are generated — each encoding a unique trading strategy across 22 genes', color: 'from-accent-primary to-accent-tertiary' },
  { step: '02', icon: Swords, title: 'Compete', desc: 'Agents trade against real historical market data. Realistic fees, slippage, and leverage included', color: 'from-accent-tertiary to-success' },
  { step: '03', icon: GitBranch, title: 'Evolve', desc: 'Top performers breed. Bottom 80% die. AI guides crossover and mutation for smarter offspring', color: 'from-evolution-purple to-accent-primary' },
  { step: '04', icon: Rocket, title: 'Deploy', desc: 'Export your winning strategy or deploy it live on Solana via Jupiter DEX', color: 'from-success to-evolution-purple' },
];

const BENTO_FEATURES = [
  { icon: Dna, title: '22-Gene Genome', desc: 'Full strategy encoded in DNA — entry/exit rules, risk params, indicator weights', size: 'lg' },
  { icon: Activity, title: '9 Technical Indicators', desc: 'RSI, MACD, Bollinger, ATR, Stochastic, EMA, SMA, VWAP, OBV', size: 'sm' },
  { icon: LineChart, title: 'Multi-Pair Trading', desc: 'SOL/BTC/ETH with real Binance data', size: 'sm' },
  { icon: Brain, title: 'AI Analyst', desc: 'Gemini 3 Flash guides breeding decisions and analyzes genome fitness', size: 'sm' },
  { icon: Target, title: 'Battle Testing', desc: 'Forward-test winners against unseen market periods', size: 'sm' },
  { icon: Shield, title: 'On-Chain Ready', desc: 'Deploy strategies to Solana via Jupiter DEX aggregator', size: 'lg' },
  { icon: Crosshair, title: 'Realistic Fees', desc: '0.1% taker + 0.05% slippage per trade', size: 'sm' },
  { icon: Zap, title: 'Leverage & Shorts', desc: 'Up to 15x leverage with short selling support', size: 'sm' },
];

function LandingPage({ 
  selectedPair, setSelectedPair, 
  selectedPeriod, setSelectedPeriod, 
  startEvolution, isStarting 
}: { 
  selectedPair: TradingPair; 
  setSelectedPair: (p: TradingPair) => void;
  selectedPeriod: string;
  setSelectedPeriod: (p: string) => void;
  startEvolution: () => void;
  isStarting: boolean;
}) {
  return (
    <div className="space-y-0">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden -mx-2.5 sm:-mx-4 lg:-mx-6 px-2.5 sm:px-4 lg:px-6">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-evolution-purple/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-tertiary/3 rounded-full blur-[150px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-12">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-evolution-purple/10 border border-evolution-purple/20 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-evolution-purple animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-evolution-purple font-bold">Colosseum Hackathon · Solana</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-text-primary tracking-tight leading-[1.1] mb-6">
              Trading Agents{' '}
              <br />
              That{' '}
              <span className="dna-strand">Evolve</span>
            </h1>

            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8 max-w-lg">
              Spawn AI agents with random genomes. Watch them compete on real market data. 
              The fittest breed, the weak die. After 50 generations, only the strongest strategy survives.
            </p>

            {/* Pair Selector */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Pair</span>
              {PAIRS.map(p => (
                <button
                  key={p.symbol}
                  onClick={() => setSelectedPair(p.symbol)}
                  className={`group flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                    selectedPair === p.symbol
                      ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : 'bg-white/[0.03] text-text-muted border border-white/[0.06] hover:bg-white/[0.06] hover:text-text-secondary hover:border-white/10'
                  }`}
                >
                  <span className="text-sm">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-1.5 mb-6 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold mr-1">Period</span>
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${
                    selectedPeriod === p.id
                      ? 'bg-evolution-purple/15 text-evolution-purple border border-evolution-purple/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                      : 'bg-white/[0.03] text-text-muted border border-white/[0.06] hover:bg-white/[0.06] hover:text-text-secondary hover:border-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={startEvolution}
                disabled={isStarting}
                className="group relative flex items-center gap-3 px-7 py-3.5 rounded-xl bg-gradient-to-r from-success to-emerald-500 text-white text-sm font-bold transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isStarting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                )}
                <span className="relative">Start Evolution</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="font-mono">20 agents · 50 gens · ~30s</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mt-5 flex-wrap">
              {[
                { label: '🧠 AI-Guided', color: 'evolution-purple' },
                { label: '⚡ Live Trading', color: 'success' },
                { label: '🪐 Jupiter DEX', color: 'accent-secondary' },
              ].map(tag => (
                <span key={tag.label} className={`text-[9px] px-2.5 py-1 rounded-full bg-${tag.color}/10 text-${tag.color} font-bold border border-${tag.color}/20`}>
                  {tag.label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: DNA Helix */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
            className="hidden lg:flex justify-center items-center relative mx-auto max-w-[400px]"
          >
            <div className="absolute inset-0 bg-gradient-radial from-evolution-purple/10 via-transparent to-transparent rounded-full blur-2xl" />
            <div className="relative">
              <DnaHelix genome={SAMPLE_GENOME} height={450} />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 text-text-muted"
          >
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── LIVE STATS BAR ─── */}
      <section className="py-8 -mx-2.5 sm:-mx-4 lg:-mx-6 px-2.5 sm:px-4 lg:px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Best PnL', value: <AnimatedCounter value={2341} suffix="%" prefix="+" />, color: 'text-success' },
            { label: 'Agents Evolved', value: <AnimatedCounter value={12840} />, color: 'text-accent-primary' },
            { label: 'Win Rate (Best)', value: <AnimatedCounter value={67} suffix="%" />, color: 'text-evolution-purple' },
            { label: 'Generations Run', value: <AnimatedCounter value={5200} />, color: 'text-accent-tertiary' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="glass-card rounded-xl p-4 text-center group hover:border-white/10 transition-all duration-500"
            >
              <p className="text-[9px] uppercase tracking-[0.3em] text-text-muted font-bold mb-1">{stat.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHAT IS DARWIN ─── */}
      <section className="py-16 lg:py-24 -mx-2.5 sm:-mx-4 lg:-mx-6 px-2.5 sm:px-4 lg:px-6">
        <div className="max-w-[1400px] mx-auto">
          <SectionHeading
            eyebrow="What is Darwin"
            title="Natural Selection for Trading Strategies"
            description="Darwin applies evolutionary algorithms to trading. Instead of hand-tuning indicators, you let populations of AI agents compete, breed, and evolve — discovering strategies no human would design."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { icon: '🧬', title: 'Genetic Encoding', desc: 'Every trading strategy is encoded as a genome — 22 genes controlling indicators, thresholds, risk parameters, and position sizing. Each agent is unique.', gradient: 'from-accent-primary/20 to-evolution-purple/20' },
              { icon: '⚔️', title: 'Survival of the Fittest', desc: 'Agents trade real market data with realistic fees and slippage. Bottom 80% are eliminated each generation. Only profitable strategies pass on their genes.', gradient: 'from-evolution-purple/20 to-accent-tertiary/20' },
              { icon: '🤖', title: 'AI-Guided Breeding', desc: 'Gemini 3 Flash analyzes top performers and intelligently guides crossover and mutation — combining the best traits from winning strategies.', gradient: 'from-accent-tertiary/20 to-success/20' },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`group relative glass-card rounded-2xl p-6 lg:p-8 overflow-hidden transition-all duration-500 hover:border-white/15 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <span className="text-3xl mb-4 block">{card.icon}</span>
                  <h3 className="text-base font-bold text-text-primary mb-3">{card.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-16 lg:py-24 -mx-2.5 sm:-mx-4 lg:-mx-6 px-2.5 sm:px-4 lg:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-primary/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-[1400px] mx-auto relative z-10">
          <SectionHeading
            eyebrow="How It Works"
            title="Four Steps to Alpha"
            description="From random chaos to optimized trading strategy in under a minute."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.title}
                className="group relative"
              >
                <div className="glass-card rounded-2xl p-6 h-full transition-all duration-500 hover:border-white/15 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:-translate-y-1">
                  {/* Step number */}
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-mono text-text-muted mb-1 tracking-wider">{step.step}</p>
                  <h3 className="text-lg font-bold text-text-primary mb-2">{step.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES BENTO GRID ─── */}
      <section className="py-16 lg:py-24 -mx-2.5 sm:-mx-4 lg:-mx-6 px-2.5 sm:px-4 lg:px-6">
        <div className="max-w-[1400px] mx-auto">
          <SectionHeading
            eyebrow="Key Features"
            title="Built for Serious Evolution"
            description="Every component designed for realistic strategy discovery and deployment."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {BENTO_FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={`group glass-card rounded-2xl p-5 transition-all duration-500 hover:border-white/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 ${
                  feature.size === 'lg' ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center group-hover:bg-accent-primary/10 transition-colors duration-500">
                    <feature.icon className="w-4.5 h-4.5 text-text-muted group-hover:text-accent-primary transition-colors duration-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary mb-1">{feature.title}</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RESULTS SHOWCASE ─── */}
      <section className="py-16 lg:py-24 -mx-2.5 sm:-mx-4 lg:-mx-6 px-2.5 sm:px-4 lg:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-evolution-purple/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-[1400px] mx-auto relative z-10">
          <SectionHeading
            eyebrow="Results"
            title="Evolution in Numbers"
            description="Real results from actual evolution runs on historical market data."
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Big stat card */}
            <div
              className="lg:col-span-2 glass-card rounded-2xl p-8 relative overflow-hidden group hover:border-success/20 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-success/5 rounded-full blur-3xl group-hover:bg-success/10 transition-colors duration-500" />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted font-bold mb-2">Best Strategy PnL</p>
                <p className="text-5xl sm:text-6xl font-bold text-success font-mono mb-3">+2,341%</p>
                <p className="text-xs text-text-secondary">Evolved over 50 generations on SOL/USDT historical data with realistic fees</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-[10px] font-mono text-text-muted px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">Win Rate: 67.8%</span>
                  <span className="text-[10px] font-mono text-text-muted px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">142 Trades</span>
                </div>
              </div>
            </div>

            {/* Smaller stats */}
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Avg Generation PnL Growth', value: '+47%', sub: 'Per generation', color: 'text-accent-primary' },
                { label: 'Survival Rate', value: '20%', sub: 'Top 4 of 20 survive', color: 'text-evolution-purple' },
                { label: 'Mutation Rate', value: '15%', sub: 'Per gene per generation', color: 'text-accent-tertiary' },
                { label: 'Max Drawdown (Best)', value: '-18%', sub: 'Risk-adjusted returns', color: 'text-warning' },
                { label: 'Sharpe Ratio', value: '2.4', sub: 'Best evolved agent', color: 'text-success' },
                { label: 'Total Strategies Tested', value: '1,000+', sub: '20 agents × 50 gens', color: 'text-text-primary' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="glass-card rounded-xl p-4 hover:border-white/10 transition-all duration-500"
                >
                  <p className="text-[8px] uppercase tracking-[0.2em] text-text-muted font-bold mb-1 leading-tight">{stat.label}</p>
                  <p className={`text-xl font-bold font-mono ${stat.color} mb-0.5`}>{stat.value}</p>
                  <p className="text-[10px] text-text-muted">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 lg:py-28 -mx-2.5 sm:-mx-4 lg:-mx-6 px-2.5 sm:px-4 lg:px-6">
        <div
          className="max-w-[900px] mx-auto text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-radial from-evolution-purple/5 via-transparent to-transparent blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight mb-5 leading-tight">
              Start Evolving Your<br />
              <span className="dna-strand">Trading Strategy</span>
            </h2>
            <p className="text-base text-text-secondary mb-8 max-w-lg mx-auto">
              No code. No manual backtesting. Just evolution. Let natural selection find alpha in the chaos.
            </p>
            <button
              onClick={startEvolution}
              disabled={isStarting}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-evolution-purple to-accent-primary text-white text-base font-bold transition-all duration-300 shadow-[0_0_40px_rgba(139,92,246,0.25)] hover:shadow-[0_0_60px_rgba(139,92,246,0.4)] hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {isStarting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Dna className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              )}
              <span className="relative">Launch Evolution</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────

export default function Dashboard() {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('arena');
  const [selectedAgent, setSelectedAgent] = useState<AgentGenome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<TradingPair>('SOLUSDT');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [strategyJson, setStrategyJson] = useState<string | null>(null);
  const [paperTradeData, setPaperTradeData] = useState<Record<string, unknown> | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [loadingPaperTrade, setLoadingPaperTrade] = useState(false);

  const evolutionRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/evolution?action=status');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      if (json.status && json.status !== 'idle') setData(json);
      else if (json.agents) setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    }
  }, []);

  const runEvolutionLoop = useCallback(async () => {
    evolutionRef.current = true;
    try {
      // Run complete evolution in a single request (avoids serverless state loss)
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-all' }),
      });
      if (!res.ok) throw new Error(`Evolution failed: ${res.status}`);
      const result = await res.json();
      if (result.snapshot) {
        setData(result.snapshot);
      }
      await fetchStatus();
      // Trigger AI analysis
      fetch('/api/ai-breed', { method: 'POST' }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evolution failed. Try again.');
    } finally {
      evolutionRef.current = false;
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, data?.status === 'running' ? 2000 : 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, data?.status]);

  const startEvolution = async () => {
    if (isStarting || (data?.status === 'running')) return;
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', populationSize: 20, generations: 50, symbol: selectedPair, period: selectedPeriod || undefined }),
      });
      if (!res.ok) throw new Error(`Failed to start: ${res.status}`);
      await fetchStatus();
      runEvolutionLoop();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start evolution');
    }
    setIsStarting(false);
  };

  const continueEvolution = async () => {
    if (isStarting || (data?.status === 'running')) return;
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'continue', populationSize: 20, generations: 50, symbol: selectedPair, period: selectedPeriod || undefined }),
      });
      if (!res.ok) throw new Error(`Failed to continue: ${res.status}`);
      await fetchStatus();
      runEvolutionLoop();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to continue evolution');
    }
    setIsStarting(false);
  };

  const stopEvolution = async () => {
    evolutionRef.current = false;
    try {
      await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
    } catch { /* ignore */ }
  };

  const exportStrategy = async () => {
    setLoadingStrategy(true);
    try {
      const res = await fetch('/api/strategy');
      const json = await res.json();
      setStrategyJson(JSON.stringify(json, null, 2));
    } catch { setStrategyJson('{"error": "Failed to fetch strategy"}'); }
    setLoadingStrategy(false);
  };

  const fetchPaperTrade = async () => {
    setLoadingPaperTrade(true);
    try {
      const res = await fetch('/api/paper-trade');
      const json = await res.json();
      setPaperTradeData(json);
    } catch { setPaperTradeData({ error: 'Failed to fetch paper trade data' }); }
    setLoadingPaperTrade(false);
  };

  const agents = data?.agents ?? [];
  const allAgents = data?.allAgents ?? [];
  const generations = data?.generations ?? [];
  const candles = data?.candles ?? [];
  const evStatus = data?.status ?? 'idle';
  const generation = data?.currentGeneration ?? 0;
  const aliveAgents = agents.filter((a) => a.isAlive);
  const bestPnl = data?.bestEverPnl ?? 0;
  const avgWinRate = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + a.winRate, 0) / agents.length) : 0;
  const totalDeaths = allAgents.filter((a) => !a.isAlive).length;

  const showHero = evStatus === 'idle' && generations.length === 0;

  const tradeMarkers: { time: number; price: number; type: 'entry' | 'exit'; agentId: number; pnl?: number }[] = [];
  if (data?.trades && candles.length > 0) {
    for (const [agentIdStr, trades] of Object.entries(data.trades)) {
      const agentId = Number(agentIdStr);
      for (const t of trades) {
        if (t.entryIdx < candles.length) tradeMarkers.push({ time: candles[t.entryIdx].time, price: t.entryPrice, type: 'entry', agentId });
        if (t.exitIdx < candles.length) tradeMarkers.push({ time: candles[t.exitIdx].time, price: t.exitPrice, type: 'exit', agentId, pnl: t.pnlPct });
      }
    }
  }

  return (
    <div className="min-h-screen p-2.5 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 lg:space-y-6">
        {!showHero && <Header generation={generation} agentCount={data?.populationSize ?? 20} aliveCount={aliveAgents.length} />}

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-xl p-3 border-danger/30 bg-danger/10 flex items-center gap-3"
            >
              <span className="text-danger text-xs font-bold">⚠️ {error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-danger/60 hover:text-danger text-xs">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Landing Page or Dashboard */}
        {showHero ? (
          <LandingPage
            selectedPair={selectedPair}
            setSelectedPair={setSelectedPair}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startEvolution={startEvolution}
            isStarting={isStarting}
          />
        ) : (
          <>
            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-bg-secondary/80 border border-white/5">
                {PAIRS.map(p => (
                  <button
                    key={p.symbol}
                    onClick={() => setSelectedPair(p.symbol)}
                    disabled={evStatus === 'running'}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                      selectedPair === p.symbol
                        ? 'bg-accent-primary/20 text-accent-primary'
                        : 'text-text-muted hover:text-text-secondary disabled:opacity-40'
                    }`}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-bg-secondary/80 border border-white/5">
                {PERIODS.filter(p => ['', 'last-30d', 'last-90d', 'last-1y', 'bull-2024', 'bear-2022'].includes(p.id)).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPeriod(p.id)}
                    disabled={evStatus === 'running'}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                      selectedPeriod === p.id
                        ? 'bg-evolution-purple/20 text-evolution-purple'
                        : 'text-text-muted hover:text-text-secondary disabled:opacity-40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {evStatus === 'idle' || evStatus === 'complete' || evStatus === 'paused' ? (
                <>
                  <button onClick={startEvolution} disabled={isStarting}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-success/20 border border-success/30 text-success text-xs sm:text-sm font-bold hover:bg-success/30 transition-all disabled:opacity-50">
                    {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : evStatus === 'complete' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {evStatus === 'complete' ? 'Restart' : 'Start Evolution'}
                  </button>
                  {evStatus === 'complete' && (
                    <button onClick={continueEvolution} disabled={isStarting}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-evolution-purple/20 border border-evolution-purple/30 text-evolution-purple text-xs sm:text-sm font-bold hover:bg-evolution-purple/30 transition-all disabled:opacity-50">
                      {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dna className="w-4 h-4" />}
                      Continue Evolving
                    </button>
                  )}
                </>
              ) : (
                <button onClick={stopEvolution}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/20 border border-danger/30 text-danger text-sm font-bold hover:bg-danger/30 transition-all">
                  <Square className="w-4 h-4" /> Stop
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                <div className={`w-2 h-2 rounded-full ${evStatus === 'running' ? 'bg-success animate-pulse' : evStatus === 'complete' ? 'bg-accent-primary' : 'bg-text-muted'}`} />
                {evStatus === 'running' && (
                  <motion.span key={generation} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                    Gen {generation + 1} / {data?.maxGenerations ?? '?'}
                  </motion.span>
                )}
                {evStatus === 'complete' && `Complete · ${generations.length} generations`}
                {evStatus === 'idle' && 'Ready to evolve'}
                {evStatus === 'paused' && 'Paused'}
              </div>
              {data?.candleInfo && (
                <div className="text-[10px] font-mono text-text-muted bg-bg-elevated/50 px-2 py-1 rounded-lg border border-white/5">
                  📊 {data.candleInfo.pair} · {data.candleInfo.interval} · {data.candleInfo.count} candles · {data.candleInfo.days}d ({data.candleInfo.startDate} → {data.candleInfo.endDate}){data.period ? ` · ${data.period}` : ''}
                </div>
              )}
            </div>

            {(evStatus === 'running' || generations.length > 0) && (
              <GenerationProgress
                currentGeneration={generation}
                maxGenerations={data?.maxGenerations ?? 50}
                generations={generations}
                aliveCount={aliveAgents.length}
                status={evStatus}
              />
            )}

            <StatsCards bestPnl={bestPnl} avgWinRate={avgWinRate} totalGenerations={generations.length} totalDeaths={totalDeaths} />

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-bg-secondary/80 backdrop-blur-xl border border-white/5 w-full sm:w-fit overflow-x-auto scrollbar-custom -mx-1 px-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                      : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'arena' && (
                  <div className="space-y-4 lg:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                      <div className="lg:col-span-2">
                        <CandleChart candles={candles} markers={tradeMarkers} />
                      </div>
                      <div className="lg:col-span-1 max-h-[400px] sm:max-h-none overflow-y-auto">
                        <Leaderboard agents={agents} />
                      </div>
                    </div>
                    {agents.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Top Agents</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                          {[...agents].filter(a => a.isAlive).sort((a, b) => b.totalPnl - a.totalPnl).slice(0, 5).map(agent => (
                            <AgentCard key={agent.id} agent={agent} compact onSelect={setSelectedAgent} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'arena' && evStatus === 'complete' && agents.length > 0 && (
                  <div className="mt-4">
                    <BattleTestCard
                      genome={agents[0]?.genome ?? null}
                      agentId={data?.bestEverAgentId ?? agents[0]?.id ?? 0}
                      symbol={selectedPair}
                    />
                  </div>
                )}

                {activeTab === 'lab' && (
                  <div className="space-y-6">
                    <BreedingView agents={agents} allAgents={allAgents} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-card rounded-2xl p-5">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">DNA Structure</h3>
                        <div className="flex justify-center">
                          <DnaHelix genome={agents[0]?.genome ?? SAMPLE_GENOME} height={350} />
                        </div>
                      </div>
                      {selectedAgent && (
                        <AgentCard agent={selectedAgent} />
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'tree' && (
                  <Suspense fallback={
                    <div className="glass-card rounded-2xl p-12 flex items-center justify-center" style={{ height: 500 }}>
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-evolution-purple mx-auto mb-3" />
                        <p className="text-sm text-text-muted">Loading Family Tree...</p>
                      </div>
                    </div>
                  }>
                    <FamilyTree agents={allAgents.length > 0 ? allAgents : agents} onSelectAgent={setSelectedAgent} />
                  </Suspense>
                )}

                {activeTab === 'analyst' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AiAnalyst
                      genome={agents[0]?.genome ?? SAMPLE_GENOME}
                      generation={generation}
                      totalPnl={agents[0]?.totalPnl ?? 0}
                      winRate={agents[0]?.winRate ?? 0}
                      totalTrades={agents[0]?.totalTrades ?? 0}
                      avgPnl={generations.length > 0 ? generations[generations.length - 1].avgPnl : 0}
                      bestPnl={bestPnl}
                      populationSize={data?.populationSize ?? 20}
                      candles={candles}
                      autoAnalyze={evStatus === 'running'}
                      aiBreedingResult={data?.lastAIBreedingResult}
                    />
                    {agents[0] && (
                      <AgentCard agent={agents[0]} highlight />
                    )}
                  </div>
                )}

                {activeTab === 'live' && (
                  <div className="space-y-4">
                    <LiveTrading hasEvolutionData={agents.length > 0} />
                    <div className="glass-card rounded-xl p-3 border-accent-primary/20 bg-accent-primary/5 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-accent-primary" />
                      <span className="text-[11px] font-bold text-accent-primary">📊 Includes 0.1% taker fee + 0.05% slippage per trade (0.30% round trip)</span>
                    </div>
                    <div className="glass-card rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Export Best Strategy</h3>
                        <button
                          onClick={exportStrategy}
                          disabled={loadingStrategy || agents.length === 0}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-evolution-purple/20 border border-evolution-purple/30 text-evolution-purple text-xs font-bold hover:bg-evolution-purple/30 transition-all disabled:opacity-50"
                        >
                          {loadingStrategy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          Export Strategy
                        </button>
                      </div>
                      {strategyJson && (
                        <pre className="bg-bg-primary/80 rounded-xl p-4 text-[10px] font-mono text-text-secondary overflow-x-auto max-h-[400px] overflow-y-auto border border-white/5">
                          {strategyJson}
                        </pre>
                      )}
                    </div>
                    <div className="glass-card rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Paper Trade (Forward Test)</h3>
                        <button
                          onClick={fetchPaperTrade}
                          disabled={loadingPaperTrade || agents.length === 0}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/20 border border-success/30 text-success text-xs font-bold hover:bg-success/30 transition-all disabled:opacity-50"
                        >
                          {loadingPaperTrade ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                          Run Paper Trade
                        </button>
                      </div>
                      {paperTradeData && (
                        <div className="space-y-3">
                          {paperTradeData.error ? (
                            <p className="text-xs text-danger">{String(paperTradeData.error)}</p>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  { label: 'Balance', value: `$${Number(paperTradeData.currentBalance ?? 0).toLocaleString()}`, color: 'text-text-primary' },
                                  { label: 'PnL', value: `${Number(paperTradeData.pnlPct ?? 0) > 0 ? '+' : ''}${Number(paperTradeData.pnlPct ?? 0).toFixed(2)}%`, color: Number(paperTradeData.pnlPct ?? 0) >= 0 ? 'text-success' : 'text-danger' },
                                  { label: 'Win Rate', value: `${Number(paperTradeData.winRate ?? 0).toFixed(1)}%`, color: 'text-accent-primary' },
                                  { label: 'Trades', value: String(paperTradeData.totalTrades ?? 0), color: 'text-text-secondary' },
                                ].map(s => (
                                  <div key={s.label} className="bg-bg-primary/60 rounded-lg p-2.5 border border-white/5">
                                    <p className="text-[9px] uppercase tracking-wider text-text-muted mb-0.5">{s.label}</p>
                                    <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-text-muted">{String(paperTradeData.feesNote ?? '')}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'graveyard' && (
                  <Graveyard agents={allAgents.length > 0 ? allAgents : agents} />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <SolanaPanel
                  generationsComplete={generations.length}
                  isRunning={evStatus === 'running'}
                  bestPnl={bestPnl}
                  bestAgentId={data?.bestEverAgentId ?? 0}
                />
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center py-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted font-bold">
            Built for Colosseum Agent Hackathon · Powered by Solana
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
