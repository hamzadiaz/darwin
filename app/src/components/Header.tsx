'use client';

import { useState } from 'react';
import { Activity, Users, Zap, Wallet, Copy, CheckCircle } from 'lucide-react';

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
    <div className="flex items-center gap-4">
      {/* Stats */}
      <div className="hidden md:flex items-center gap-4">
        <HeaderStat icon={<Zap className="w-3.5 h-3.5 text-[#8B5CF6]" />} label="Gen" value={`${generation}`} />
        <div className="w-px h-4 bg-white/[0.06]" />
        <HeaderStat icon={<Users className="w-3.5 h-3.5 text-[#06B6D4]" />} label="Pop" value={`${agentCount}`} />
        <div className="w-px h-4 bg-white/[0.06]" />
        <HeaderStat icon={<Activity className="w-3.5 h-3.5 text-[#00ff88]" />} label="Alive" value={`${aliveCount}`} />
      </div>

      {/* Wallet */}
      {walletAddress ? (
        <button
          onClick={copyAddress}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff88]/8 border border-[#00ff88]/15 text-[#00ff88] text-[11px] font-mono hover:bg-[#00ff88]/12 transition-colors cursor-pointer"
        >
          {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
        </button>
      ) : (
        <button
          onClick={connectWallet}
          disabled={connecting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[11px] font-medium hover:bg-[#8B5CF6]/15 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{connecting ? 'Connecting...' : 'Connect'}</span>
        </button>
      )}
    </div>
  );
}

function HeaderStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <div>
        <p className="text-[9px] text-[#484F58] leading-none">{label}</p>
        <p className="text-xs font-mono font-semibold text-white leading-none">{value}</p>
      </div>
    </div>
  );
}
