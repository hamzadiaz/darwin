'use client';

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { CandleChart } from '@/components/CandleChart';
import { Leaderboard } from '@/components/Leaderboard';
import { StatsCards } from '@/components/StatsCards';
import { GenerationProgress } from '@/components/GenerationProgress';
import { BreedingView } from '@/components/BreedingView';
import { DnaHelix } from '@/components/DnaHelix';
import { Graveyard } from '@/components/Graveyard';
import { AgentCard } from '@/components/AgentCard';
import { Play, Square, Loader2, RotateCcw, Swords, FlaskConical, GitFork, Skull, Dna, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { AgentGenome, Generation } from '@/types';
import { SolanaPanel } from '@/components/SolanaPanel';

// Lazy load heavy components
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
}

const TABS = [
  { id: 'arena', label: 'Arena', icon: Swords },
  { id: 'lab', label: 'Lab', icon: FlaskConical },
  { id: 'tree', label: 'Family Tree', icon: GitFork },
  { id: 'graveyard', label: 'Graveyard', icon: Skull },
] as const;

type TabId = typeof TABS[number]['id'];

// Sample genome for the hero section
const SAMPLE_GENOME = [720, 350, 680, 500, 300, 750, 250, 600, 450, 200, 550, 800];

const FEATURES = [
  { icon: '🧬', title: '12-Gene Genome', desc: 'Each agent encodes a full trading strategy in 12 genes' },
  { icon: '⚔️', title: 'Arena Battles', desc: 'Agents compete on real SOL/USDC market data' },
  { icon: '🔀', title: 'Crossover & Mutation', desc: 'Top agents breed; random mutations prevent local optima' },
  { icon: '💀', title: 'Natural Selection', desc: 'Bottom 80% die each generation — only the fittest survive' },
];

export default function Dashboard() {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('arena');
  const [selectedAgent, setSelectedAgent] = useState<AgentGenome | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Step-driven evolution: client drives each generation to avoid serverless timeout
  const runEvolutionLoop = useCallback(async () => {
    evolutionRef.current = true;
    let retries = 0;
    while (evolutionRef.current) {
      try {
        const res = await fetch('/api/evolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'step' }),
        });
        if (!res.ok) throw new Error(`Step failed: ${res.status}`);
        const stepResult = await res.json();
        retries = 0;

        await fetchStatus();

        if (stepResult.status === 'complete') {
          evolutionRef.current = false;
          break;
        }

        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        retries++;
        if (retries > 5) {
          setError('Evolution failed after 5 retries. Try again.');
          evolutionRef.current = false;
          break;
        }
        await new Promise(r => setTimeout(r, 1000 * retries));
      }
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, data?.status === 'running' ? 2000 : 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, data?.status]);

  const startEvolution = async () => {
    if (isStarting || (data?.status === 'running')) return; // Prevent double-start
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', populationSize: 20, generations: 50 }),
      });
      if (!res.ok) throw new Error(`Failed to start: ${res.status}`);
      await fetchStatus();
      runEvolutionLoop();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start evolution');
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

  // Trade markers for chart
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
    <div className="min-h-screen p-4 lg:p-6 max-w-[1600px] mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 lg:space-y-6">
        <Header generation={generation} agentCount={data?.populationSize ?? 20} aliveCount={aliveAgents.length} />

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

        {/* Hero Section — shown when idle */}
        {showHero ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Hero Card */}
            <div className="glass-card rounded-3xl p-8 lg:p-12 relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-evolution-purple/20 via-accent-tertiary/10 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-success/10 to-transparent rounded-full blur-3xl" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.3em] text-evolution-purple font-bold mb-2">
                      Evolutionary Finance on Solana
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight mb-4 leading-tight">
                      🧬 Trading Agents That
                      <span className="dna-strand"> Evolve</span>
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-md">
                      Spawn 20 AI agents with random trading strategies. Watch them compete on real SOL market data.
                      The fittest breed. The weak die. After 50 generations, only the strongest strategy survives.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-4 flex-wrap"
                  >
                    <button
                      onClick={startEvolution}
                      disabled={isStarting}
                      className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-success/90 to-success/70 text-white text-sm font-bold hover:from-success hover:to-success/80 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] disabled:opacity-50"
                    >
                      {isStarting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      )}
                      Start Evolution
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="font-mono">20 agents · 50 generations · ~30s</span>
                    </div>
                  </motion.div>
                </div>

                {/* Sample DNA Helix */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="flex justify-center"
                >
                  <DnaHelix genome={SAMPLE_GENOME} height={320} />
                </motion.div>
              </div>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="glass-card rounded-2xl p-4 card-hover"
                >
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1">{f.title}</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {evStatus === 'idle' || evStatus === 'complete' || evStatus === 'paused' ? (
                <button onClick={startEvolution} disabled={isStarting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/20 border border-success/30 text-success text-sm font-bold hover:bg-success/30 transition-all disabled:opacity-50">
                  {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : evStatus === 'complete' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {evStatus === 'complete' ? 'Restart Evolution' : 'Start Evolution'}
                </button>
              ) : (
                <button onClick={stopEvolution}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/20 border border-danger/30 text-danger text-sm font-bold hover:bg-danger/30 transition-all">
                  <Square className="w-4 h-4" /> Stop
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                <div className={`w-2 h-2 rounded-full ${evStatus === 'running' ? 'bg-success animate-pulse' : evStatus === 'complete' ? 'bg-accent-primary' : 'bg-text-muted'}`} />
                {evStatus === 'running' && (
                  <motion.span
                    key={generation}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Gen {generation + 1} / {data?.maxGenerations ?? '?'}
                  </motion.span>
                )}
                {evStatus === 'complete' && `Complete · ${generations.length} generations`}
                {evStatus === 'idle' && 'Ready to evolve'}
                {evStatus === 'paused' && 'Paused'}
              </div>
            </div>

            {/* Generation Progress */}
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
            <div className="flex gap-1 p-1 rounded-xl bg-bg-secondary/80 backdrop-blur-xl border border-white/5 w-fit overflow-x-auto scrollbar-custom">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
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

            {/* Tab Content — only render active tab */}
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                      <div className="lg:col-span-2">
                        <CandleChart candles={candles} markers={tradeMarkers} />
                      </div>
                      <div className="lg:col-span-1">
                        <Leaderboard agents={agents} />
                      </div>
                    </div>
                    {agents.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Top Agents</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {[...agents].filter(a => a.isAlive).sort((a, b) => b.totalPnl - a.totalPnl).slice(0, 5).map(agent => (
                            <AgentCard key={agent.id} agent={agent} compact onSelect={setSelectedAgent} />
                          ))}
                        </div>
                      </div>
                    )}
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

                {activeTab === 'graveyard' && (
                  <Graveyard agents={allAgents.length > 0 ? allAgents : agents} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Solana Integration */}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center py-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted font-bold">
            Built for Colosseum Agent Hackathon · Powered by Solana
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
