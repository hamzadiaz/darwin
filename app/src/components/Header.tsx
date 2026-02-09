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
        // No Phantom wallet detected — prompt user to install
        window.open('https://phantom.app/', '_blank');
      }
    } catch {
      // Wallet connection rejected or unavailable
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
      className="glass-card rounded-2xl p-3 sm:p-4"
    >
      {/* Top row: Logo + Wallet */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-evolution flex items-center justify-center glow-evolution flex-shrink-0">
            <Dna className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              DARWIN
              <span className="text-[10px] sm:text-xs font-mono text-accent-tertiary bg-accent-tertiary/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                v0.2
              </span>
            </h1>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold hidden sm:block">
              Evolutionary AI Trading Agents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wallet Connect */}
          {walletAddress ? (
            <button
              onClick={copyAddress}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-[10px] sm:text-[11px] font-mono hover:bg-success/20 transition-all"
            >
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </button>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-accent-secondary/20 border border-accent-secondary/30 text-accent-secondary text-[10px] sm:text-[11px] font-bold hover:bg-accent-secondary/30 transition-all disabled:opacity-50"
            >
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
              <span className="sm:hidden">{connecting ? '...' : 'Wallet'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-success font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">Live</span>
          </div>
        </div>
      </div>

      {/* Bottom row: Stats — always visible */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2.5 pt-2.5 border-t border-white/5">
        <Stat icon={<Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-evolution-purple" />} label="Gen" value={`#${generation}`} />
        <Stat icon={<Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-tertiary" />} label="Agents" value={String(agentCount)} />
        <Stat icon={<Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-success" />} label="Alive" value={String(aliveCount)} />
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
