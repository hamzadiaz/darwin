'use client';

import { motion } from 'framer-motion';
import { Dna, Activity, Users, Zap } from 'lucide-react';

interface HeaderProps {
  generation: number;
  agentCount: number;
  aliveCount: number;
}

export function Header({ generation, agentCount, aliveCount }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl gradient-evolution flex items-center justify-center glow-evolution">
          <Dna className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            DARWIN
            <span className="text-xs font-mono text-accent-tertiary bg-accent-tertiary/10 px-2 py-0.5 rounded-full">
              v0.1
            </span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold">
            Evolutionary Trading Agents
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Stat icon={<Zap className="w-3.5 h-3.5 text-evolution-purple" />} label="Generation" value={`#${generation}`} />
        <Stat icon={<Users className="w-3.5 h-3.5 text-accent-tertiary" />} label="Agents" value={String(agentCount)} />
        <Stat icon={<Activity className="w-3.5 h-3.5 text-success" />} label="Alive" value={String(aliveCount)} />
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-success font-bold uppercase tracking-widest text-[10px]">Live</span>
        </div>
      </div>
    </motion.header>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold">{label}</p>
        <p className="text-sm font-mono font-bold text-text-primary tracking-tight">{value}</p>
      </div>
    </div>
  );
}
