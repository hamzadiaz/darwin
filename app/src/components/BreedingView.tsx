'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Zap, Sparkles } from 'lucide-react';
import { AgentGenome } from '@/types';
import { AgentCard } from './AgentCard';
import { DnaHelix } from './DnaHelix';

interface BreedingViewProps {
  agents: AgentGenome[];
  allAgents: AgentGenome[];
}

type BreedingStage = 'idle' | 'parents' | 'merge' | 'child';

export function BreedingView({ agents, allAgents }: BreedingViewProps) {
  const [stage, setStage] = useState<BreedingStage>('idle');
  const [parentA, setParentA] = useState<AgentGenome | null>(null);
  const [parentB, setParentB] = useState<AgentGenome | null>(null);
  const [child, setChild] = useState<AgentGenome | null>(null);
  const [mutations, setMutations] = useState<number[]>([]);

  const simulateBreeding = () => {
    const sorted = [...agents].filter(a => a.isAlive).sort((a, b) => b.totalPnl - a.totalPnl);
    if (sorted.length < 2) return;

    const pA = sorted[0];
    const pB = sorted[1];
    setParentA(pA);
    setParentB(pB);
    setStage('parents');

    setTimeout(() => setStage('merge'), 1500);
    setTimeout(() => {
      // Simulate crossover + mutation
      const childGenome = pA.genome.map((g, i) => {
        const crossed = Math.random() > 0.5 ? g : pB.genome[i];
        return Math.random() < 0.1 ? Math.min(1000, Math.max(0, crossed + (Math.random() - 0.5) * 200)) : crossed;
      });
      const muts = childGenome.map((g, i) => Math.abs(g - pA.genome[i]) > 50 && Math.abs(g - pB.genome[i]) > 50 ? i : -1).filter(i => i >= 0);
      setMutations(muts);
      setChild({
        id: allAgents.length + 1,
        generation: Math.max(pA.generation, pB.generation) + 1,
        parentA: pA.id,
        parentB: pB.id,
        genome: childGenome,
        bornAt: Date.now(),
        diedAt: null,
        totalPnl: 0,
        totalTrades: 0,
        winRate: 0,
        isAlive: true,
        owner: '',
      });
      setStage('child');
    }, 3500);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-evolution-purple/10 flex items-center justify-center">
            <Dna className="w-4 h-4 text-evolution-purple" />
          </div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Breeding Lab</h3>
        </div>
        <button
          onClick={() => { setStage('idle'); setTimeout(simulateBreeding, 100); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-evolution-purple/20 border border-evolution-purple/30 text-evolution-purple text-xs font-bold hover:bg-evolution-purple/30 transition-all"
        >
          <Zap className="w-3 h-3" /> Breed Top 2
        </button>
      </div>

      <div className="relative flex items-center justify-center gap-4 min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* Parent A */}
          {(stage === 'parents' || stage === 'merge') && parentA && (
            <motion.div
              key="parentA"
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: stage === 'merge' ? -40 : 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              className="w-56"
            >
              <AgentCard agent={parentA} compact />
            </motion.div>
          )}

          {/* DNA Merge */}
          {stage === 'merge' && (
            <motion.div
              key="merge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-4"
            >
              <DnaHelix genome={parentA?.genome} merging height={250} />
            </motion.div>
          )}

          {/* Parent B */}
          {(stage === 'parents' || stage === 'merge') && parentB && (
            <motion.div
              key="parentB"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: stage === 'merge' ? 40 : 0, opacity: 1 }}
              exit={{ x: 200, opacity: 0 }}
              className="w-56"
            >
              <AgentCard agent={parentB} compact />
            </motion.div>
          )}

          {/* Child */}
          {stage === 'child' && child && (
            <motion.div
              key="child"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="relative"
            >
              {/* Glow burst */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                initial={{ boxShadow: '0 0 0px rgba(16,185,129,0)' }}
                animate={{ boxShadow: ['0 0 60px rgba(16,185,129,0.4)', '0 0 20px rgba(16,185,129,0.1)'] }}
                transition={{ duration: 1 }}
              />
              <div className="w-64">
                <AgentCard agent={child} highlight parentGenome={parentA?.genome} />
              </div>
              {/* Mutation badges */}
              {mutations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 flex items-center gap-1 justify-center"
                >
                  <Sparkles className="w-3 h-3 text-danger" />
                  <span className="text-[10px] font-mono text-danger">
                    {mutations.length} mutation{mutations.length > 1 ? 's' : ''}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Idle */}
          {stage === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Dna className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-sm text-text-muted">Select two agents or click &quot;Breed Top 2&quot; to start</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
