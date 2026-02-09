'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Zap, Link2, CheckCircle, Loader2 } from 'lucide-react';
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

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-secondary/10 flex items-center justify-center">
            <Link2 className="w-3.5 h-3.5 text-accent-secondary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="section-title text-sm">Solana</h3>
              <span className="text-[9px] font-mono text-accent-secondary/70 bg-accent-secondary/8 px-1.5 py-0.5 rounded">DEVNET</span>
            </div>
            <p className="text-[10px] text-text-muted font-mono">{PROGRAM_ID.slice(0, 8)}...{PROGRAM_ID.slice(-4)}</p>
          </div>
        </div>
        <a
          href={`https://solscan.io/account/${PROGRAM_ID}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-accent-primary/70 hover:text-accent-primary transition-colors flex items-center gap-1"
        >
          Solscan <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      <button
        onClick={syncToChain}
        disabled={syncing || generationsComplete === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-secondary/8 border border-accent-secondary/15 text-accent-secondary text-[11px] font-medium hover:bg-accent-secondary/12 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {syncing ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing...</>
        ) : (
          <><Zap className="w-3.5 h-3.5" /> Record Winners On-Chain</>
        )}
      </button>

      <AnimatePresence>
        {records.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-1.5"
          >
            <p className="text-[10px] text-text-muted font-medium mb-1">On-Chain Records</p>
            <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-custom">
              {records.map((rec, i) => (
                <motion.div
                  key={rec.txSignature}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-bg-elevated/30 row-hover"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-success/70" />
                    <span className="text-[11px] font-mono text-text-secondary">Gen {rec.generation}</span>
                    <span className={`text-[11px] font-mono font-bold ${rec.winnerPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                      {rec.winnerPnl >= 0 ? '+' : ''}{(rec.winnerPnl / 100).toFixed(1)}%
                    </span>
                  </div>
                  <a href={rec.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-accent-primary/60 hover:text-accent-primary">
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <div className={`w-1.5 h-1.5 rounded-full ${records.length > 0 ? 'bg-success/70' : 'bg-text-muted/40'}`} />
        {records.length > 0 
          ? `${records.length} generation${records.length > 1 ? 's' : ''} on-chain`
          : 'Run evolution then sync to Solana'
        }
      </div>
    </div>
  );
}
