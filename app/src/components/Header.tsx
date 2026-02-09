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
      const solana = (window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }>; } }).solana;
      if (solana?.isPhantom) {
        const resp = await solana.connect();
        setWalletAddress(resp.publicKey.toString());
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch { /* */ }
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-4"
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg gradient-evolution flex items-center justify-center glow-evolution">
          <Dna className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-text-primary">DARWIN</h1>
            <span className="text-[10px] font-mono text-accent-tertiary/80 bg-accent-tertiary/8 px-1.5 py-0.5 rounded">v0.2</span>
          </div>
          <p className="text-[10px] text-text-muted hidden sm:block">Evolutionary Trading Agents</p>
        </div>
      </div>

      {/* Center: Key Stats */}
      <div className="hidden md:flex items-center gap-6">
        <HeaderStat icon={<Zap className="w-3.5 h-3.5 text-evolution-purple" />} label="Generation" value={`${generation}`} />
        <div className="w-px h-5 bg-border" />
        <HeaderStat icon={<Users className="w-3.5 h-3.5 text-accent-tertiary" />} label="Population" value={`${agentCount}`} />
        <div className="w-px h-5 bg-border" />
        <HeaderStat icon={<Activity className="w-3.5 h-3.5 text-success" />} label="Alive" value={`${aliveCount}`} />
      </div>

      {/* Right: Wallet */}
      <div className="flex items-center gap-3">
        {walletAddress ? (
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/8 border border-success/15 text-success text-[11px] font-mono hover:bg-success/12 transition-colors cursor-pointer"
          >
            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </button>
        ) : (
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary text-[11px] font-medium hover:bg-accent-secondary/15 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
            <span className="sm:hidden">{connecting ? '...' : 'Wallet'}</span>
          </button>
        )}
      </div>
    </motion.header>
  );
}

function HeaderStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[10px] text-text-muted leading-none mb-0.5">{label}</p>
        <p className="text-sm font-mono font-semibold text-text-primary leading-none">{value}</p>
      </div>
    </div>
  );
}
