'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { CandleChart } from '@/components/CandleChart';
import { Leaderboard } from '@/components/Leaderboard';
import { GenerationTimeline } from '@/components/GenerationTimeline';
import { StatsCards } from '@/components/StatsCards';
import { Play, Square, Loader2, RotateCcw } from 'lucide-react';
import { AgentGenome, Generation } from '@/types';

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

export default function Dashboard() {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/evolution?action=status');
      const json = await res.json();
      if (json.status && json.status !== 'idle') {
        setData(json);
      } else if (json.agents) {
        setData(json);
      }
    } catch { /* ignore */ }
  }, []);

  // Poll every 500ms while running, 5s otherwise
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, data?.status === 'running' ? 500 : 5000);
    pollRef.current = interval;
    return () => clearInterval(interval);
  }, [fetchStatus, data?.status]);

  const startEvolution = async () => {
    setIsStarting(true);
    try {
      await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', populationSize: 20, generations: 15 }),
      });
      // Immediately start fast polling
      setTimeout(fetchStatus, 200);
    } catch { /* ignore */ }
    setIsStarting(false);
  };

  const stopEvolution = async () => {
    await fetch('/api/evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    });
  };

  const agents = data?.agents ?? [];
  const generations = data?.generations ?? [];
  const candles = data?.candles ?? [];
  const status = data?.status ?? 'idle';
  const generation = data?.currentGeneration ?? 0;

  const aliveAgents = agents.filter((a) => a.isAlive);
  const bestPnl = data?.bestEverPnl ?? 0;
  const avgWinRate = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + a.winRate, 0) / agents.length)
    : 0;
  const totalDeaths = data?.allAgents?.filter((a) => !a.isAlive).length ?? 0;

  // Build trade markers for top 3 agents on the chart
  const tradeMarkers = [];
  if (data?.trades && candles.length > 0) {
    for (const [agentIdStr, trades] of Object.entries(data.trades)) {
      const agentId = Number(agentIdStr);
      for (const t of trades) {
        if (t.entryIdx < candles.length) {
          tradeMarkers.push({
            time: candles[t.entryIdx].time,
            price: t.entryPrice,
            type: 'entry' as const,
            agentId,
          });
        }
        if (t.exitIdx < candles.length) {
          tradeMarkers.push({
            time: candles[t.exitIdx].time,
            price: t.exitPrice,
            type: 'exit' as const,
            agentId,
            pnl: t.pnlPct,
          });
        }
      }
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 lg:space-y-6"
      >
        {/* Header */}
        <Header
          generation={generation}
          agentCount={data?.populationSize ?? 20}
          aliveCount={aliveAgents.length}
        />

        {/* Evolution Controls */}
        <div className="flex items-center gap-3">
          {status === 'idle' || status === 'complete' || status === 'paused' ? (
            <button
              onClick={startEvolution}
              disabled={isStarting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/20 border border-success/30 text-success text-sm font-bold hover:bg-success/30 transition-all disabled:opacity-50"
            >
              {isStarting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : status === 'complete' ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {status === 'complete' ? 'Restart Evolution' : 'Start Evolution'}
            </button>
          ) : (
            <button
              onClick={stopEvolution}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/20 border border-danger/30 text-danger text-sm font-bold hover:bg-danger/30 transition-all"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
            <div className={`w-2 h-2 rounded-full ${
              status === 'running' ? 'bg-success animate-pulse' :
              status === 'complete' ? 'bg-accent-primary' :
              'bg-text-muted'
            }`} />
            {status === 'running' && `Gen ${generation + 1} / ${data?.maxGenerations ?? '?'}`}
            {status === 'complete' && `Complete · ${generations.length} generations`}
            {status === 'idle' && 'Ready to evolve'}
            {status === 'paused' && 'Paused'}
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          bestPnl={bestPnl}
          avgWinRate={avgWinRate}
          totalGenerations={generations.length}
          totalDeaths={totalDeaths}
        />

        {/* Main Content: Chart + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <CandleChart candles={candles} markers={tradeMarkers} />
          </div>
          <div className="lg:col-span-1">
            <Leaderboard agents={agents} />
          </div>
        </div>

        {/* Generation Timeline */}
        {generations.length > 0 && (
          <GenerationTimeline generations={generations} />
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center py-4"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted font-bold">
            Built for Colosseum Agent Hackathon · Powered by Solana
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
