'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { CandleChart } from '@/components/CandleChart';
import { Leaderboard } from '@/components/Leaderboard';
import { StatsCards } from '@/components/StatsCards';
import { GenerationProgress } from '@/components/GenerationProgress';
import { BreedingView } from '@/components/BreedingView';
import { DnaHelix } from '@/components/DnaHelix';
import { FamilyTree } from '@/components/FamilyTree';
import { Graveyard } from '@/components/Graveyard';
import { AgentCard } from '@/components/AgentCard';
import { Play, Square, Loader2, RotateCcw, Swords, FlaskConical, GitFork, Skull } from 'lucide-react';
import { AgentGenome, Generation } from '@/types';
import { SolanaPanel } from '@/components/SolanaPanel';

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

export default function Dashboard() {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('arena');
  const [selectedAgent, setSelectedAgent] = useState<AgentGenome | null>(null);

  const evolutionRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/evolution?action=status');
      const json = await res.json();
      if (json.status && json.status !== 'idle') setData(json);
      else if (json.agents) setData(json);
    } catch { /* ignore */ }
  }, []);

  // Step-driven evolution: client drives each generation to avoid serverless timeout
  const runEvolutionLoop = useCallback(async () => {
    evolutionRef.current = true;
    while (evolutionRef.current) {
      try {
        // Step one generation
        const res = await fetch('/api/evolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'step' }),
        });
        const stepResult = await res.json();

        // Fetch full status for UI
        await fetchStatus();

        if (stepResult.status === 'complete') {
          evolutionRef.current = false;
          break;
        }

        // Small delay between steps for UI to breathe
        await new Promise(r => setTimeout(r, 300));
      } catch {
        // Retry after a pause
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, data?.status === 'running' ? 2000 : 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, data?.status]);

  const startEvolution = async () => {
    setIsStarting(true);
    try {
      await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', populationSize: 20, generations: 50 }),
      });
      await fetchStatus();
      // Start the step-driven loop
      runEvolutionLoop();
    } catch { /* ignore */ }
    setIsStarting(false);
  };

  const stopEvolution = async () => {
    evolutionRef.current = false;
    await fetch('/api/evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    });
  };

  const agents = data?.agents ?? [];
  const allAgents = data?.allAgents ?? [];
  const generations = data?.generations ?? [];
  const candles = data?.candles ?? [];
  const status = data?.status ?? 'idle';
  const generation = data?.currentGeneration ?? 0;
  const aliveAgents = agents.filter((a) => a.isAlive);
  const bestPnl = data?.bestEverPnl ?? 0;
  const avgWinRate = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + a.winRate, 0) / agents.length) : 0;
  const totalDeaths = allAgents.filter((a) => !a.isAlive).length;

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

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {status === 'idle' || status === 'complete' || status === 'paused' ? (
            <button onClick={startEvolution} disabled={isStarting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/20 border border-success/30 text-success text-sm font-bold hover:bg-success/30 transition-all disabled:opacity-50">
              {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'complete' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {status === 'complete' ? 'Restart Evolution' : 'Start Evolution'}
            </button>
          ) : (
            <button onClick={stopEvolution}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/20 border border-danger/30 text-danger text-sm font-bold hover:bg-danger/30 transition-all">
              <Square className="w-4 h-4" /> Stop
            </button>
          )}
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
            <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-success animate-pulse' : status === 'complete' ? 'bg-accent-primary' : 'bg-text-muted'}`} />
            {status === 'running' && `Gen ${generation + 1} / ${data?.maxGenerations ?? '?'}`}
            {status === 'complete' && `Complete · ${generations.length} generations`}
            {status === 'idle' && 'Ready to evolve'}
            {status === 'paused' && 'Paused'}
          </div>
        </div>

        {/* Generation Progress */}
        {(status === 'running' || generations.length > 0) && (
          <GenerationProgress
            currentGeneration={generation}
            maxGenerations={data?.maxGenerations ?? 15}
            generations={generations}
            aliveCount={aliveAgents.length}
            status={status}
          />
        )}

        <StatsCards bestPnl={bestPnl} avgWinRate={avgWinRate} totalGenerations={generations.length} totalDeaths={totalDeaths} />

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-bg-secondary/80 backdrop-blur-xl border border-white/5 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
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

        {/* Tab Content */}
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
                {/* Top agents as cards */}
                {agents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Top Agents</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
                      <DnaHelix genome={agents[0]?.genome} height={350} />
                    </div>
                  </div>
                  {selectedAgent && (
                    <AgentCard agent={selectedAgent} />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tree' && (
              <FamilyTree agents={allAgents.length > 0 ? allAgents : agents} onSelectAgent={setSelectedAgent} />
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
              isRunning={status === 'running'}
              bestPnl={bestPnl}
              bestAgentId={data?.bestEverAgentId ?? 0}
            />
          </div>
        </div>

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
