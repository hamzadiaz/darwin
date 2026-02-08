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
    // Fetch existing records
    fetch('/api/solana?action=records')
      .then(r => r.json())
      .then(d => { if (d.records) setRecords(d.records); })
      .catch(() => {});
  }, [generationsComplete]);

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-secondary/20 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-accent-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Solana Devnet</h3>
            <p className="text-[10px] text-text-muted font-mono">Program: {PROGRAM_ID.slice(0, 8)}...{PROGRAM_ID.slice(-4)}</p>
          </div>
        </div>
        <a
          href={`https://solscan.io/account/${PROGRAM_ID}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-accent-primary hover:text-accent-primary/80 transition-colors"
        >
          View on Solscan <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Sync Button */}
      <button
        onClick={syncToChain}
        disabled={syncing || generationsComplete === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-secondary/20 border border-accent-secondary/30 text-accent-secondary text-xs font-bold hover:bg-accent-secondary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {syncing ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing to Solana...</>
        ) : (
          <><Zap className="w-3.5 h-3.5" /> Record Winners On-Chain</>
        )}
      </button>

      {/* Records */}
      <AnimatePresence>
        {records.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">On-Chain Records</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-custom">
              {records.map((rec, i) => (
                <motion.div
                  key={rec.txSignature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-success" />
                    <span className="text-[11px] font-mono text-text-secondary">
                      Gen {rec.generation}
                    </span>
                    <span className={`text-[11px] font-mono font-bold ${rec.winnerPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                      {rec.winnerPnl >= 0 ? '+' : ''}{(rec.winnerPnl / 100).toFixed(1)}%
                    </span>
                  </div>
                  <a
                    href={rec.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:text-accent-primary/80"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status */}
      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <div className={`w-1.5 h-1.5 rounded-full ${records.length > 0 ? 'bg-success' : 'bg-text-muted'}`} />
        {records.length > 0 
          ? `${records.length} generation${records.length > 1 ? 's' : ''} recorded on-chain`
          : 'Run evolution then sync winners to Solana'
        }
      </div>
    </div>
  );
}
