'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dna, Activity, Users, Zap, Wallet, Copy, CheckCircle } from 'lucide-react';

interface HeaderProps {
  generation: number;
  agentCount: number;
  aliveCount: number;
}

export function Header({ generation, agentCount, aliveCount }: HeaderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      // Check for Phantom or any Solana wallet
      const solana = (window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }>; } }).solana;
      if (solana?.isPhantom) {
        const resp = await solana.connect();
        setWalletAddress(resp.publicKey.toString());
      } else {
        // Simulated wallet for demo
        const simAddr = 'DRwN' + Math.random().toString(36).slice(2, 10) + '...' + Math.random().toString(36).slice(2, 6);
        setWalletAddress(simAddr);
      }
    } catch {
      // Demo fallback
      setWalletAddress('DRwN' + Math.random().toString(36).slice(2, 10) + '...demo');
    }
    setConnecting(false);
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
              v0.2
            </span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold">
            Evolutionary AI Trading Agents
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Stat icon={<Zap className="w-3.5 h-3.5 text-evolution-purple" />} label="Generation" value={`#${generation}`} />
        <Stat icon={<Users className="w-3.5 h-3.5 text-accent-tertiary" />} label="Agents" value={String(agentCount)} />
        <Stat icon={<Activity className="w-3.5 h-3.5 text-success" />} label="Alive" value={String(aliveCount)} />

        {/* Wallet Connect */}
        {walletAddress ? (
          <button
            onClick={copyAddress}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-[11px] font-mono hover:bg-success/20 transition-all"
          >
            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </button>
        ) : (
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-secondary/20 border border-accent-secondary/30 text-accent-secondary text-[11px] font-bold hover:bg-accent-secondary/30 transition-all disabled:opacity-50"
          >
            <Wallet className="w-3.5 h-3.5" />
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}

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
