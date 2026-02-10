'use client';

import { useState } from 'react';
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

  const simulateBreeding = async () => {
    const sorted = [...agents].filter(a => a.isAlive).sort((a, b) => b.totalPnl - a.totalPnl);
    if (sorted.length < 2) return;

    const pA = sorted[0];
    // Pick the first parent with a DIFFERENT genome (not a clone)
    const pB = sorted.find(a => a.id !== pA.id && a.genome.some((g, i) => Math.abs(g - pA.genome[i]) > 10)) || sorted[1];
    setParentA(pA);
    setParentB(pB);
    setStage('parents');

    setTimeout(() => setStage('merge'), 1500);

    try {
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'breed', parentA: pA.id, parentB: pB.id }),
      });
      const data = await res.json();
      
      setTimeout(() => {
        if (data.child) {
          const c = data.child;
          const muts = c.genome.map((g: number, i: number) => Math.abs(g - pA.genome[i]) > 50 && Math.abs(g - pB.genome[i]) > 50 ? i : -1).filter((i: number) => i >= 0);
          setMutations(muts);
          setChild(c);
        } else {
          const childGenome = pA.genome.map((g, i) => {
            const crossed = Math.random() > 0.5 ? g : pB.genome[i];
            return Math.random() < 0.1 ? Math.min(1000, Math.max(0, crossed + (Math.random() - 0.5) * 200)) : crossed;
          });
          const muts = childGenome.map((g, i) => Math.abs(g - pA.genome[i]) > 50 && Math.abs(g - pB.genome[i]) > 50 ? i : -1).filter(i => i >= 0);
          setMutations(muts);
          setChild({
            id: allAgents.length + 1,
            generation: Math.max(pA.generation, pB.generation) + 1,
            parentA: pA.id, parentB: pB.id,
            genome: childGenome, bornAt: Date.now(), diedAt: null,
            totalPnl: 0, totalTrades: 0, winRate: 0, isAlive: true, owner: '',
          });
        }
        setStage('child');
      }, 2000);
    } catch {
      setTimeout(() => {
        const childGenome = pA.genome.map((g, i) => Math.random() > 0.5 ? g : pB.genome[i]);
        setChild({
          id: allAgents.length + 1,
          generation: Math.max(pA.generation, pB.generation) + 1,
          parentA: pA.id, parentB: pB.id,
          genome: childGenome, bornAt: Date.now(), diedAt: null,
          totalPnl: 0, totalTrades: 0, winRate: 0, isAlive: true, owner: '',
        });
        setStage('child');
      }, 2000);
    }
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-evolution-purple/10 flex items-center justify-center">
            <Dna className="w-3.5 h-3.5 text-evolution-purple" />
          </div>
          <h3 className="section-title text-sm">Breeding Lab</h3>
        </div>
        <button
          onClick={() => { setStage('idle'); setTimeout(simulateBreeding, 100); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-evolution-purple/10 border border-evolution-purple/20 text-evolution-purple text-[11px] font-medium hover:bg-evolution-purple/15 transition-colors cursor-pointer"
        >
          <Zap className="w-3 h-3" /> Breed Top 2
        </button>
      </div>

      <div className="relative flex items-center justify-center gap-4 min-h-[360px]">
        <AnimatePresence mode="wait">
          {(stage === 'parents' || stage === 'merge') && parentA && (
            <motion.div
              key="parentA"
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: stage === 'merge' ? -40 : 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              className="w-52"
            >
              <AgentCard agent={parentA} compact />
            </motion.div>
          )}

          {stage === 'merge' && (
            <motion.div
              key="merge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-4"
            >
              <DnaHelix genome={parentA?.genome} merging height={220} />
            </motion.div>
          )}

          {(stage === 'parents' || stage === 'merge') && parentB && (
            <motion.div
              key="parentB"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: stage === 'merge' ? 40 : 0, opacity: 1 }}
              exit={{ x: 200, opacity: 0 }}
              className="w-52"
            >
              <AgentCard agent={parentB} compact />
            </motion.div>
          )}

          {stage === 'child' && child && (
            <motion.div
              key="child"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="relative"
            >
              <div className="w-60">
                <AgentCard agent={child} highlight parentGenome={parentA?.genome} />
              </div>
              {mutations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-2 flex items-center gap-1 justify-center"
                >
                  <Sparkles className="w-3 h-3 text-danger" />
                  <span className="text-[10px] font-mono text-danger">
                    {mutations.length} mutation{mutations.length > 1 ? 's' : ''}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {stage === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Dna className="w-10 h-10 text-text-muted/20 mx-auto mb-3" />
              <p className="text-xs text-text-muted">Click &quot;Breed Top 2&quot; to start</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
