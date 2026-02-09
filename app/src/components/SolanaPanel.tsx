'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Zap, Link2, CheckCircle, Loader2, Shield, Globe, Wallet } from 'lucide-react';
import { PROGRAM_ID } from '@/lib/solana';

interface OnChainRecord {
  txSignature: string;
  generation: number;
  winnerGenome: number[];
  winnerPnl: number;
  timestamp: number;
  explorerUrl: string;
}

interface SolanaPanelProps {
  generationsComplete: number;
  isRunning: boolean;
  bestPnl: number;
  bestAgentId: number;
}

export function SolanaPanel({ generationsComplete, isRunning, bestPnl, bestAgentId }: SolanaPanelProps) {
  const [records, setRecords] = useState<OnChainRecord[]>([]);
  const [syncing, setSyncing] = useState(false);

  const syncToChain = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/solana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'record-winner' }),
      });
      const data = await res.json();
      if (data.records) setRecords(data.records);
    } catch { /* ignore */ }
    setSyncing(false);
  };

  useEffect(() => {
    fetch('/api/solana?action=records')
      .then(r => r.json())
      .then(d => { if (d.records) setRecords(d.records); })
      .catch(() => {});
  }, [generationsComplete]);

  const connected = records.length > 0;

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="glass-card rounded-xl p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 border border-[#9945FF]/20 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-6 h-6 text-[#14F195]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white">Solana Integration</h2>
              <span className="text-[9px] font-mono text-[#14F195]/70 bg-[#14F195]/8 px-2 py-0.5 rounded-full border border-[#14F195]/15">DEVNET</span>
            </div>
            <p className="text-[12px] text-[#8B949E] leading-relaxed">
              Record your winning evolved strategies on-chain. Each winner&apos;s genome, generation, and PnL is permanently stored on Solana.
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg p-3 border border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-3.5 h-3.5 text-[#9945FF]" />
              <p className="text-[9px] uppercase tracking-wider text-[#484F58] font-bold">Program ID</p>
            </div>
            <p className="text-[11px] font-mono text-[#8B949E] truncate">{PROGRAM_ID}</p>
          </div>
          <div className="rounded-lg p-3 border border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-[#14F195]" />
              <p className="text-[9px] uppercase tracking-wider text-[#484F58] font-bold">Network</p>
            </div>
            <p className="text-[11px] font-mono text-[#8B949E]">Devnet</p>
          </div>
          <div className="rounded-lg p-3 border border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#F59E0B]" />
              <p className="text-[9px] uppercase tracking-wider text-[#484F58] font-bold">Status</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#14F195]' : 'bg-[#484F58]/40'}`} />
              <p className="text-[11px] font-mono text-[#8B949E]">{connected ? `${records.length} on-chain` : 'Not connected'}</p>
            </div>
          </div>
        </div>

        {/* Solscan Link */}
        <a
          href={`https://solscan.io/account/${PROGRAM_ID}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#9945FF]/80 hover:text-[#9945FF] transition-colors mb-6"
        >
          View on Solscan <ExternalLink className="w-3 h-3" />
        </a>

        {/* CTA */}
        <button
          onClick={syncToChain}
          disabled={syncing || generationsComplete === 0}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: generationsComplete > 0 ? 'linear-gradient(135deg, #14F195, #00cc6a)' : 'rgba(255,255,255,0.04)',
            color: generationsComplete > 0 ? '#000' : '#484F58',
            boxShadow: generationsComplete > 0 ? '0 0 24px rgba(20,241,149,0.2)' : 'none',
          }}
        >
          {syncing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Recording on Solana...</>
          ) : (
            <><Zap className="w-4 h-4" /> Record Winners On-Chain</>
          )}
        </button>

        {generationsComplete === 0 && (
          <p className="text-center text-[11px] text-[#484F58] mt-3">
            Run evolution first, then record your winning strategies on-chain.
          </p>
        )}
      </div>

      {/* On-Chain Records */}
      <AnimatePresence>
        {records.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-5"
          >
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#484F58] font-bold mb-3 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#14F195]" />
              On-Chain Records
            </h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-custom">
              {records.map((rec, i) => (
                <motion.div
                  key={rec.txSignature}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg row-hover"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-3.5 h-3.5 text-[#14F195]/70" />
                    <div>
                      <span className="text-[11px] font-mono text-[#c9d1d9]">Gen {rec.generation}</span>
                      <span className={`ml-2 text-[11px] font-mono font-bold ${rec.winnerPnl >= 0 ? 'text-[#14F195]' : 'text-red-400'}`}>
                        {rec.winnerPnl >= 0 ? '+' : ''}{(rec.winnerPnl / 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <a href={rec.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-[#9945FF]/60 hover:text-[#9945FF] transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
