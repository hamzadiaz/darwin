'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { ChartPlaceholder } from '@/components/ChartPlaceholder';
import { Leaderboard } from '@/components/Leaderboard';
import { GenerationTimeline } from '@/components/GenerationTimeline';
import { StatsCards } from '@/components/StatsCards';
import { generateMockAgents, generateMockGenerations } from '@/lib/utils';

export default function Dashboard() {
  const generation = 12;
  const agents = useMemo(() => generateMockAgents(20, generation), []);
  const generations = useMemo(() => generateMockGenerations(generation + 1), []);

  const aliveAgents = agents.filter((a) => a.isAlive);
  const bestPnl = Math.max(...agents.map((a) => a.totalPnl), 0);
  const avgWinRate = Math.round(
    agents.reduce((s, a) => s + a.winRate, 0) / agents.length,
  );
  const totalDeaths = agents.filter((a) => !a.isAlive).length * (generation + 1);

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
          agentCount={agents.length}
          aliveCount={aliveAgents.length}
        />

        {/* Stats Cards */}
        <StatsCards
          bestPnl={bestPnl}
          avgWinRate={avgWinRate}
          totalGenerations={generation + 1}
          totalDeaths={totalDeaths}
        />

        {/* Main Content: Chart + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <ChartPlaceholder />
          </div>
          <div className="lg:col-span-1">
            <Leaderboard agents={agents} />
          </div>
        </div>

        {/* Generation Timeline */}
        <GenerationTimeline generations={generations} />

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
