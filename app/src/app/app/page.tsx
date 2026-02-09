'use client';

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
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
import { Play, Square, Loader2, RotateCcw, Swords, FlaskConical, GitFork, Skull, Dna, Zap, TrendingUp, ArrowRight, Brain, Rocket, Download, BarChart3, Target, AlertTriangle } from 'lucide-react';
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

// ─── Run History for generation tracking ───
interface RunRecord {
  runNumber: number;
  generations: number;
  bestPnl: number;
}

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

  // ─── Generation Tracking State ───
  const [runHistory, setRunHistory] = useState<RunRecord[]>([]);
  const [totalGenerationsAllRuns, setTotalGenerationsAllRuns] = useState(0);
  const [currentRunNumber, setCurrentRunNumber] = useState(0);

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
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-all' }),
      });
      if (!res.ok) throw new Error(`Evolution failed: ${res.status}`);
      const result = await res.json();
      if (result.snapshot) setData(result.snapshot);
      await fetchStatus();
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

  // Track total generations
  useEffect(() => {
    if (data?.generations) {
      const prevRunGens = runHistory.reduce((sum, r) => sum + r.generations, 0);
      setTotalGenerationsAllRuns(prevRunGens + data.generations.length);
    }
  }, [data?.generations?.length, runHistory]);

  const startEvolution = async () => {
    if (isStarting || (data?.status === 'running')) return;
    setIsStarting(true);
    setError(null);
    // Reset run history on fresh start
    setRunHistory([]);
    setTotalGenerationsAllRuns(0);
    setCurrentRunNumber(1);
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

    // Save current run to history before continuing
    if (data?.generations && data.generations.length > 0) {
      // Compute best PnL from this run's generations (not from bestEverPnl which may be stale)
      const runBestPnl = Math.max(...data.generations.map(g => g.bestPnl), 0);
      const newRecord: RunRecord = {
        runNumber: currentRunNumber,
        generations: data.generations.length,
        bestPnl: runBestPnl,
      };
      setRunHistory(prev => [...prev, newRecord]);
      setCurrentRunNumber(prev => prev + 1);
    }

    try {
      // Send top genomes from client state (server state may be lost on serverless)
      const topGenomes = data?.agents
        ?.filter((a: AgentGenome) => a.isAlive && a.totalTrades > 0)
        ?.sort((a: AgentGenome, b: AgentGenome) => b.totalPnl - a.totalPnl)
        ?.slice(0, 10)
        ?.map((a: AgentGenome) => [...a.genome]) ?? [];

      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'continue', populationSize: 20, generations: 50, symbol: selectedPair, period: selectedPeriod || data?.period || undefined, seedGenomes: topGenomes }),
      });
      if (!res.ok) throw new Error(`Failed to continue: ${res.status}`);
      const result = await res.json();
      if (result.snapshot) setData(result.snapshot);
      await fetchStatus();
      fetch('/api/ai-breed', { method: 'POST' }).catch(() => {});
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* App Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#06B6D4] flex items-center justify-center shadow-[0_0_16px_rgba(0,255,136,0.15)]">
                <Dna className="w-4 h-4 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-white">DARWIN</h1>
                  <span className="text-[9px] font-mono text-[#06B6D4]/80 bg-[#06B6D4]/8 px-1.5 py-0.5 rounded">v0.2</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Run tracking */}
          {(currentRunNumber > 0 || generations.length > 0) && (
            <div className="hidden md:flex items-center gap-3">
              <div className="text-[10px] font-mono text-[#8B949E] bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                Run #{currentRunNumber || 1} · <span className="text-[#00ff88]">{totalGenerationsAllRuns}</span> total gens
              </div>
            </div>
          )}

          <Header generation={generation} agentCount={data?.populationSize ?? 20} aliveCount={aliveAgents.length} />
        </div>
      </nav>

      <div className="px-4 sm:px-6 max-w-[1440px] mx-auto py-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg px-4 py-2.5 border border-red-500/20 flex items-center gap-3"
                style={{ background: 'rgba(239,68,68,0.06)' }}
              >
                <span className="text-red-400 text-[11px] font-medium">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-400/40 hover:text-red-400 text-xs cursor-pointer">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Disclaimer Banner */}
          <div className="rounded-lg px-4 py-2.5 border border-[#F59E0B]/15 flex items-center gap-2" style={{ background: 'rgba(245,158,11,0.04)' }}>
            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]/60 flex-shrink-0" />
            <span className="text-[10px] text-[#F59E0B]/70">Simulated returns on historical data. Real-world results will differ due to liquidity, slippage, and market impact.</span>
          </div>

          {/* ─── Controls Bar ─── */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Pair & Period selectors */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {PAIRS.map(p => (
                <button
                  key={p.symbol}
                  onClick={() => setSelectedPair(p.symbol)}
                  disabled={evStatus === 'running'}
                  className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all duration-150 cursor-pointer ${
                    selectedPair === p.symbol
                      ? 'bg-[#00ff88]/10 text-[#00ff88]'
                      : 'text-[#484F58] hover:text-[#8B949E] disabled:opacity-40'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {PERIODS.filter(p => ['', 'last-30d', 'last-90d', 'last-1y', 'bull-2024', 'bear-2022'].includes(p.id)).map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPeriod(p.id)}
                  disabled={evStatus === 'running'}
                  className={`px-2 py-1.5 rounded-md text-[10px] font-bold transition-all duration-150 cursor-pointer ${
                    selectedPeriod === p.id
                      ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                      : 'text-[#484F58] hover:text-[#8B949E] disabled:opacity-40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            {evStatus === 'idle' || evStatus === 'complete' || evStatus === 'paused' ? (
              <div className="flex items-center gap-2">
                <button onClick={startEvolution} disabled={isStarting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-[11px] font-semibold hover:bg-[#00ff88]/15 transition-colors disabled:opacity-50 cursor-pointer">
                  {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : evStatus === 'complete' ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {evStatus === 'complete' ? 'Restart' : 'Start'}
                </button>
                {evStatus === 'complete' && (
                  <button onClick={continueEvolution} disabled={isStarting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[11px] font-semibold hover:bg-[#8B5CF6]/15 transition-colors disabled:opacity-50 cursor-pointer">
                    {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Dna className="w-3.5 h-3.5" />}
                    Continue Evolving
                  </button>
                )}
              </div>
            ) : (
              <button onClick={stopEvolution}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold hover:bg-red-500/15 transition-colors cursor-pointer">
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            )}

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-[11px] text-[#484F58] font-mono">
              <div className={`w-1.5 h-1.5 rounded-full ${evStatus === 'running' ? 'bg-[#00ff88] animate-pulse' : evStatus === 'complete' ? 'bg-[#06B6D4]' : 'bg-[#484F58]/40'}`} />
              {evStatus === 'running' && (
                <motion.span key={generation} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Gen {generation + 1}/{data?.maxGenerations ?? '?'}
                </motion.span>
              )}
              {evStatus === 'complete' && `Complete · ${generations.length} gens`}
              {evStatus === 'idle' && 'Ready'}
              {evStatus === 'paused' && 'Paused'}
            </div>

            {/* Candle info */}
            {data?.candleInfo && (
              <div className="text-[10px] font-mono text-[#484F58] px-2 py-1 rounded border border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {data.candleInfo.pair} · {data.candleInfo.interval} · {data.candleInfo.count}c · {data.candleInfo.days}d{data.period ? ` · ${data.period}` : ''}
              </div>
            )}
          </div>

          {/* ─── Run History (Task 4) ─── */}
          {runHistory.length > 0 && (
            <div className="rounded-xl p-4 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#484F58] font-bold mb-3">Run History</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {runHistory.map((run) => (
                  <div key={run.runNumber} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-[#8B949E]">Run #{run.runNumber}</span>
                    <span className="text-[#484F58]">·</span>
                    <span className="text-[#8B949E]">{run.generations} gens</span>
                    <span className="text-[#484F58]">·</span>
                    <span className={run.bestPnl >= 0 ? 'text-[#00ff88]' : 'text-red-400'}>
                      {(() => { const pct = run.bestPnl / 100; const sign = pct >= 0 ? '+' : ''; return Math.abs(pct) >= 1000 ? `${sign}${pct.toLocaleString('en-US', { maximumFractionDigits: 0 })}%` : `${sign}${pct.toFixed(1)}%`; })()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Progress Bar ─── */}
          {(evStatus === 'running' || generations.length > 0) && (
            <GenerationProgress
              currentGeneration={generation}
              maxGenerations={data?.maxGenerations ?? 50}
              generations={generations}
              aliveCount={aliveAgents.length}
              status={evStatus}
            />
          )}

          {/* ─── KPI Stats ─── */}
          {generations.length > 0 && (
            <StatsCards bestPnl={bestPnl} avgWinRate={avgWinRate} totalGenerations={totalGenerationsAllRuns || generations.length} totalDeaths={totalDeaths}
              avgProfitFactor={agents.filter(a => a.isAlive && a.profitFactor != null && a.profitFactor < 900).length > 0 ? +(agents.filter(a => a.isAlive && a.profitFactor != null && a.profitFactor < 900).reduce((s, a) => s + (a.profitFactor ?? 0), 0) / agents.filter(a => a.isAlive && a.profitFactor != null && a.profitFactor < 900).length).toFixed(2) : undefined}
              avgExpectedValue={agents.filter(a => a.isAlive && a.expectedValue != null).length > 0 ? +(agents.filter(a => a.isAlive && a.expectedValue != null).reduce((s, a) => s + (a.expectedValue ?? 0), 0) / agents.filter(a => a.isAlive && a.expectedValue != null).length).toFixed(2) : undefined}
            />
          )}

          {/* ─── Tab Navigation ─── */}
          {generations.length > 0 && (
            <>
              <nav className="flex gap-0.5 p-1 rounded-lg border border-white/[0.06] w-full sm:w-fit overflow-x-auto scrollbar-custom" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-[11px] font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0 cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-white/[0.06] text-white'
                        : 'text-[#484F58] hover:text-[#8B949E] hover:bg-white/[0.02]'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* ─── Tab Content ─── */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'arena' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-3">
                          <CandleChart candles={candles} markers={tradeMarkers} />
                        </div>
                        <div className="lg:col-span-2 max-h-[420px] sm:max-h-none">
                          <Leaderboard agents={agents} />
                        </div>
                      </div>

                      {agents.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-[#484F58] uppercase tracking-wider mb-3">Top Agents</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {[...agents].filter(a => a.isAlive).sort((a, b) => b.totalPnl - a.totalPnl).slice(0, 5).map(agent => (
                              <AgentCard key={agent.id} agent={agent} compact onSelect={setSelectedAgent} />
                            ))}
                          </div>
                        </div>
                      )}

                      {evStatus === 'complete' && agents.length > 0 && (
                        <BattleTestCard
                          genome={agents[0]?.genome ?? null}
                          agentId={data?.bestEverAgentId ?? agents[0]?.id ?? 0}
                          symbol={selectedPair}
                        />
                      )}
                    </div>
                  )}

                  {activeTab === 'lab' && (
                    <div className="space-y-5">
                      <BreedingView agents={agents} allAgents={allAgents} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass-card rounded-xl p-5">
                          <h3 className="section-title text-sm mb-4">DNA Structure</h3>
                          <div className="flex justify-center">
                            <DnaHelix genome={agents[0]?.genome ?? SAMPLE_GENOME} height={320} />
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
                      <div className="glass-card rounded-xl p-12 flex items-center justify-center" style={{ height: 480 }}>
                        <div className="text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6] mx-auto mb-2" />
                          <p className="text-[11px] text-[#484F58]">Loading Family Tree...</p>
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
                      <div className="rounded-lg px-3 py-2 border border-[#06B6D4]/15 flex items-center gap-2" style={{ background: 'rgba(6,182,212,0.04)' }}>
                        <BarChart3 className="w-3.5 h-3.5 text-[#06B6D4]" />
                        <span className="text-[10px] font-medium text-[#06B6D4]/80">Includes 0.1% taker fee + 0.05% slippage per trade (0.30% round trip)</span>
                      </div>

                      <div className="glass-card rounded-xl p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="section-title text-sm">Export Strategy</h3>
                          <button
                            onClick={exportStrategy}
                            disabled={loadingStrategy || agents.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[11px] font-medium hover:bg-[#8B5CF6]/15 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {loadingStrategy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                            Export
                          </button>
                        </div>
                        {strategyJson && (
                          <pre className="rounded-lg p-3 text-[10px] font-mono text-[#8B949E] overflow-x-auto max-h-[360px] overflow-y-auto border border-white/[0.04] scrollbar-custom" style={{ background: 'rgba(10,10,10,0.6)' }}>
                            {strategyJson}
                          </pre>
                        )}
                      </div>

                      <div className="glass-card rounded-xl p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="section-title text-sm">Paper Trade (Forward Test)</h3>
                          <button
                            onClick={fetchPaperTrade}
                            disabled={loadingPaperTrade || agents.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-[11px] font-medium hover:bg-[#00ff88]/15 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {loadingPaperTrade ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                            Run
                          </button>
                        </div>
                        {paperTradeData && (
                          <div className="space-y-3">
                            {paperTradeData.error ? (
                              <p className="text-[11px] text-red-400">{String(paperTradeData.error)}</p>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {[
                                    { label: 'Balance', value: `$${Number(paperTradeData.currentBalance ?? 0).toLocaleString()}`, color: 'text-white' },
                                    { label: 'PnL', value: `${Number(paperTradeData.pnlPct ?? 0) > 0 ? '+' : ''}${Number(paperTradeData.pnlPct ?? 0).toFixed(2)}%`, color: Number(paperTradeData.pnlPct ?? 0) >= 0 ? 'text-[#00ff88]' : 'text-red-400' },
                                    { label: 'Win Rate', value: `${Number(paperTradeData.winRate ?? 0).toFixed(1)}%`, color: 'text-[#06B6D4]' },
                                    { label: 'Trades', value: String(paperTradeData.totalTrades ?? 0), color: 'text-[#8B949E]' },
                                  ].map(s => (
                                    <div key={s.label} className="rounded-lg p-2.5 border border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                      <p className="text-[9px] uppercase tracking-wider text-[#484F58] mb-0.5">{s.label}</p>
                                      <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[10px] text-[#484F58]">{String(paperTradeData.feesNote ?? '')}</p>
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

              {/* ─── Solana Panel ─── */}
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

          {/* Empty state when no evolution has run */}
          {generations.length === 0 && evStatus === 'idle' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00ff88]/10 to-[#06B6D4]/10 border border-white/[0.06] flex items-center justify-center mb-6">
                <Dna className="w-7 h-7 text-[#00ff88]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Ready to Evolve</h2>
              <p className="text-sm text-[#484F58] mb-6 max-w-md">Select a trading pair and period above, then hit Start to begin evolution.</p>
              <button
                onClick={startEvolution}
                disabled={isStarting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-black text-sm font-bold transition-all duration-200 shadow-[0_0_24px_rgba(0,255,136,0.2)] hover:shadow-[0_0_40px_rgba(0,255,136,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)' }}
              >
                {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Evolution
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-6">
            <p className="text-[10px] text-[#484F58]/60">
              Built for Colosseum Agent Hackathon · Powered by Solana
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
