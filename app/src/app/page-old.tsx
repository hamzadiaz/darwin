'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Dna, Swords, GitBranch, Rocket, ArrowRight, Brain, Target, Crosshair, Shield, Activity, LineChart, Zap, ChevronDown, Wallet } from 'lucide-react';
import { EvolutionCanvas } from '@/components/EvolutionCanvas';

const EVOLVE_WORDS = ['Evolve', 'Adapt', 'Survive', 'Dominate'];

function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % EVOLVE_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative">
      <AnimatePresence mode="wait">
        <motion.span
          key={EVOLVE_WORDS[index]}
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="bg-gradient-to-r from-[#00ff88] via-[#06B6D4] to-[#00ff88] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x inline-block"
        >
          {EVOLVE_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-12 lg:mb-20"
    >
      <p className="text-[10px] uppercase tracking-[0.4em] text-[#00ff88] font-bold mb-4">{eyebrow}</p>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-5">{title}</h2>
      <p className="text-sm sm:text-base text-[#8B949E] max-w-2xl mx-auto leading-relaxed">{description}</p>
    </motion.div>
  );
}

const HOW_IT_WORKS = [
  { step: '01', icon: Dna, title: 'Spawn', desc: 'Random genomes are generated — each encoding a unique trading strategy across 22 genes', color: 'from-[#00ff88] to-[#06B6D4]' },
  { step: '02', icon: Swords, title: 'Compete', desc: 'Agents trade against real historical market data. Realistic fees, slippage, and leverage included', color: 'from-[#06B6D4] to-[#8B5CF6]' },
  { step: '03', icon: GitBranch, title: 'Evolve', desc: 'Top performers breed. Bottom 80% die. AI guides crossover and mutation for smarter offspring', color: 'from-[#8B5CF6] to-[#00ff88]' },
  { step: '04', icon: Rocket, title: 'Deploy', desc: 'Export your winning strategy or deploy it live on Solana via Jupiter DEX', color: 'from-[#00ff88] to-[#8B5CF6]' },
];

const BENTO_FEATURES = [
  { icon: Dna, title: '22-Gene Genome', desc: 'Full strategy encoded in DNA — entry/exit rules, risk params, indicator weights', size: 'lg' },
  { icon: Activity, title: '9 Technical Indicators', desc: 'EMA, RSI, MACD, Bollinger Bands, Stochastic, Donchian, OBV, VWAP, ATR', size: 'sm' },
  { icon: LineChart, title: 'Multi-Pair Trading', desc: 'SOL/BTC/ETH with real Binance data', size: 'sm' },
  { icon: Brain, title: 'AI Analyst', desc: 'Gemini 3 Flash guides breeding decisions and analyzes genome fitness', size: 'sm' },
  { icon: Target, title: 'Battle Testing', desc: 'Forward-test winners against unseen market periods', size: 'sm' },
  { icon: Shield, title: 'On-Chain Ready', desc: 'Deploy strategies to Solana via Jupiter DEX aggregator', size: 'lg' },
  { icon: Crosshair, title: 'Realistic Fees', desc: '0.1% taker + 0.05% slippage per trade', size: 'sm' },
  { icon: Zap, title: 'Leverage & Shorts', desc: 'Up to 10x leverage with short selling support', size: 'sm' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00ff88] to-[#06B6D4] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.2)]">
              <Dna className="w-[18px] h-[18px] text-black" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">DARWIN</h1>
              <p className="text-[9px] text-[#484F58] hidden sm:block uppercase tracking-[0.2em]">Evolutionary Trading</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" className="text-[11px] text-[#8B949E] hover:text-white transition-colors hidden sm:block">Docs</a>
            <Link
              href="/app"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-[11px] font-semibold hover:bg-[#00ff88]/15 transition-all cursor-pointer"
            >
              Launch App
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Full-screen evolution canvas background */}
        <div className="absolute inset-0 pointer-events-none">
          <EvolutionCanvas />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[900px] h-[900px] bg-[#00ff88]/[0.04] rounded-full blur-[180px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[700px] h-[700px] bg-[#8B5CF6]/[0.05] rounded-full blur-[160px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-[1100px] mx-auto w-full text-center px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-10"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8B5CF6]/20"
              style={{ background: 'rgba(139,92,246,0.06)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#8B5CF6] font-bold">Colosseum Hackathon · Solana</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight leading-[0.95] mb-4">
              Trading Agents
            </h1>
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95] mb-8">
              That <RotatingWord />
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-lg sm:text-xl text-[#8B949E] leading-relaxed mb-14 max-w-2xl mx-auto"
          >
            Spawn AI agents with random genomes. Watch them compete on real market data.
            The fittest breed, the weak die. Only the strongest strategy survives.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center justify-center gap-6 flex-wrap mb-12"
          >
            <Link
              href="/app"
              className="group relative flex items-center gap-3 px-10 py-5 rounded-2xl text-black text-base font-bold transition-all duration-300 shadow-[0_0_40px_rgba(0,255,136,0.3)] hover:shadow-[0_0_80px_rgba(0,255,136,0.5)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)' }}
            >
              <Rocket className="w-5 h-5" />
              <span>Launch Evolution</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-2xl border-2 border-[#00ff88]/30 animate-ping opacity-20 pointer-events-none" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-[#484F58]">
              <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="font-mono">20 agents · 50 gens · ~30s</span>
            </div>
          </motion.div>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="flex items-center justify-center gap-3 flex-wrap mb-16"
          >
            {[
              { label: 'AI-Guided Breeding', color: '#8B5CF6' },
              { label: 'Live Solana Trading', color: '#00ff88' },
              { label: 'Jupiter DEX', color: '#06B6D4' },
            ].map(tag => (
              <span
                key={tag.label}
                className="text-[10px] px-3 py-1.5 rounded-full font-bold border"
                style={{
                  color: tag.color,
                  borderColor: `${tag.color}25`,
                  background: `${tag.color}0a`,
                }}
              >
                {tag.label}
              </span>
            ))}
          </motion.div>

          {/* Social proof stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="flex items-center justify-center gap-8 sm:gap-12"
          >
            {[
              { value: '10⁶⁶', label: 'Possible Strategies' },
              { value: '1,000+', label: 'Tested Per Run' },
              { value: '22', label: 'Gene Genome' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold font-mono text-white">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#484F58] mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 text-[#484F58]"
          >
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── LIVE STATS BAR ─── */}
      <section className="py-10 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '22-Gene Genome', value: <AnimatedCounter value={22} suffix=" genes" />, color: 'text-[#00ff88]' },
            { label: 'Technical Indicators', value: <AnimatedCounter value={9} />, color: 'text-[#06B6D4]' },
            { label: 'Population Size', value: <AnimatedCounter value={20} suffix=" agents" />, color: 'text-[#8B5CF6]' },
            { label: 'Generations', value: <AnimatedCounter value={50} suffix=" per run" />, color: 'text-[#00ff88]' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl p-5 text-center border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}
            >
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#484F58] font-bold mb-2">{stat.label}</p>
              <p className={`text-3xl sm:text-4xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── WHAT IS DARWIN ─── */}
      <section className="py-20 lg:py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <SectionHeading
            eyebrow="What is Darwin"
            title="Natural Selection for Trading Strategies"
            description="Darwin applies evolutionary algorithms to trading. Instead of hand-tuning indicators, you let populations of AI agents compete, breed, and evolve — discovering strategies no human would design."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              { icon: Dna, title: 'Genetic Encoding', desc: 'Every trading strategy is encoded as a genome — 22 genes controlling indicators, thresholds, risk parameters, and position sizing. Each agent is unique.', gradient: 'from-[#00ff88]/10 to-[#06B6D4]/10' },
              { icon: Swords, title: 'Survival of the Fittest', desc: 'Agents trade real market data with realistic fees and slippage. Bottom 80% are eliminated each generation. Only profitable strategies pass on their genes.', gradient: 'from-[#8B5CF6]/10 to-[#06B6D4]/10' },
              { icon: Brain, title: 'AI-Guided Breeding', desc: 'Gemini 3 Flash analyzes top performers and intelligently guides crossover and mutation — combining the best traits from winning strategies.', gradient: 'from-[#06B6D4]/10 to-[#00ff88]/10' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative rounded-xl p-7 lg:p-9 overflow-hidden transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12]"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:border-[#00ff88]/20 transition-colors">
                    <card.icon className="w-5 h-5 text-[#00ff88]" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-3">{card.title}</h3>
                  <p className="text-sm text-[#8B949E] leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 lg:py-32 px-6 relative">
        <div className="max-w-[1400px] mx-auto relative z-10">
          <SectionHeading
            eyebrow="How It Works"
            title="Four Steps to Alpha"
            description="From random chaos to optimized trading strategy in under a minute."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="rounded-xl p-6 h-full transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12] hover:-translate-y-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} mb-5 shadow-lg`}>
                    <step.icon className="w-4.5 h-4.5 text-black" />
                  </div>
                  <p className="text-[10px] font-mono text-[#484F58] mb-1">{step.step}</p>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-[#8B949E] leading-relaxed">{step.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-white/[0.08] to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES BENTO GRID ─── */}
      <section className="py-20 lg:py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <SectionHeading
            eyebrow="Key Features"
            title="Built for Serious Evolution"
            description="Every component designed for realistic strategy discovery and deployment."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {BENTO_FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`group rounded-xl p-5 transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12] ${
                  feature.size === 'lg' ? 'lg:col-span-2' : ''
                }`}
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:border-[#00ff88]/20 transition-colors">
                    <feature.icon className="w-4 h-4 text-[#484F58] group-hover:text-[#00ff88] transition-colors duration-200" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-[11px] text-[#484F58] leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RESULTS SHOWCASE ─── */}
      <section className="py-20 lg:py-32 px-6 relative">
        <div className="max-w-[1400px] mx-auto relative z-10">
          <SectionHeading
            eyebrow="Results"
            title="Evolution in Numbers"
            description="Real results from actual evolution runs on historical market data."
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 rounded-xl p-9 relative overflow-hidden group border border-white/[0.06] hover:border-[#00ff88]/15 transition-all duration-300"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#00ff88]/[0.04] rounded-full blur-[60px]" />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#484F58] font-bold mb-3">Search Space</p>
                <p className="text-6xl sm:text-7xl font-bold text-[#00ff88] font-mono mb-4">10<sup className="text-3xl">66</sup></p>
                <p className="text-xs text-[#8B949E] leading-relaxed">Possible genome combinations — far too large for brute force. Evolution finds the needle in the haystack.</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[#484F58] px-2.5 py-1 rounded-lg border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>22 genes × 1001 values</span>
                  <span className="text-[10px] font-mono text-[#484F58] px-2.5 py-1 rounded-lg border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>9 indicators</span>
                </div>
              </div>
            </motion.div>

            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Best PnL Achieved', value: '+1,179%', sub: 'SOL/USDT 4h · with continue', color: 'text-[#00ff88]' },
                { label: 'Bull Market Peak', value: '+6,042%', sub: 'Bull Run 2024 · 10×', color: 'text-[#8B5CF6]' },
                { label: 'Best Win Rate', value: '75%', sub: 'Top evolved agents', color: 'text-[#06B6D4]' },
                { label: 'Max Leverage', value: '10×', sub: 'With liquidation modeling', color: 'text-[#F59E0B]' },
                { label: 'Battle Tested', value: '3/4', sub: 'Periods passed', color: 'text-[#06B6D4]' },
                { label: 'Strategies/Run', value: '1,000+', sub: '20 agents × 50 gens', color: 'text-white' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <p className="text-[8px] uppercase tracking-[0.15em] text-[#484F58] font-bold mb-1.5 leading-tight">{stat.label}</p>
                  <p className={`text-xl font-bold font-mono ${stat.color} mb-0.5`}>{stat.value}</p>
                  <p className="text-[10px] text-[#484F58]">{stat.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 rounded-xl px-5 py-3 border border-[#F59E0B]/15 flex items-center gap-3"
            style={{ background: 'rgba(245,158,11,0.04)' }}
          >
            <span className="text-[10px] text-[#F59E0B]/80">⚠️ Simulated returns on historical data. Real-world results will differ due to liquidity, slippage, and market impact.</span>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 lg:py-36 px-6">
        <div className="max-w-[900px] mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-radial from-[#8B5CF6]/[0.04] via-transparent to-transparent blur-[80px] pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
              Start Evolving Your<br />
              <span className="bg-gradient-to-r from-[#00ff88] to-[#06B6D4] bg-clip-text text-transparent">Trading Strategy</span>
            </h2>
            <p className="text-base text-[#8B949E] mb-10 max-w-lg mx-auto">
              No code. No manual backtesting. Just evolution. Let natural selection find alpha in the chaos.
            </p>
            <Link
              href="/app"
              className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-xl text-black text-base font-bold transition-all duration-200 shadow-[0_0_40px_rgba(0,255,136,0.25)] hover:shadow-[0_0_60px_rgba(0,255,136,0.35)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)' }}
            >
              <Dna className="w-5 h-5" />
              <span>Launch App</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-8 border-t border-white/[0.04]">
        <p className="text-[10px] text-[#484F58]/60">
          Built for Colosseum Agent Hackathon · Powered by Solana
        </p>
      </div>
    </div>
  );
}
