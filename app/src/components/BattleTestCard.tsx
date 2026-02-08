'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Loader2, Trophy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { TradingPair } from '@/lib/engine/market';

interface BattleTestPeriodResult {
  periodId: string;
  label: string;
  totalPnlPct: number;
  totalTrades: number;
  winRate: number;
  candleCount: number;
  startDate: string;
  endDate: string;
  passed: boolean;
}

interface BattleTestResult {
  genome: number[];
  periods: BattleTestPeriodResult[];
  averagePnl: number;
  passedCount: number;
  totalPeriods: number;
  battleTested: boolean;
  timestamp: number;
}

interface Props {
  genome: number[] | null;
  agentId: number;
  symbol: TradingPair;
}

export function BattleTestCard({ genome, agentId, symbol }: Props) {
  const [result, setResult] = useState<BattleTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    if (!genome) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'battle-test', genome, symbol }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Battle test failed');
    }
    setLoading(false);
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-evolution-purple" />
          Battle Test
        </h3>
        <button
          onClick={runTest}
          disabled={loading || !genome}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-evolution-purple/20 border border-evolution-purple/30 text-evolution-purple text-xs font-bold hover:bg-evolution-purple/30 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
          {loading ? 'Testing...' : 'Run Battle Test'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-danger bg-danger/10 rounded-lg p-2 mb-3 border border-danger/20">
          ⚠️ {error}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Header */}
            <div className={`flex items-center gap-2 p-3 rounded-xl border ${
              result.battleTested
                ? 'bg-success/10 border-success/30'
                : 'bg-warning/10 border-warning/30'
            }`}>
              <Trophy className={`w-5 h-5 ${result.battleTested ? 'text-success' : 'text-warning'}`} />
              <div>
                <p className="text-xs font-bold text-text-primary">
                  Battle Test Results — Agent #{agentId}
                </p>
                <p className={`text-[11px] font-bold ${result.battleTested ? 'text-success' : 'text-warning'}`}>
                  Overall: {result.averagePnl > 0 ? '+' : ''}{result.averagePnl.toFixed(1)}% avg
                  {result.battleTested ? ' — BATTLE TESTED ✅' : ' — NEEDS WORK ⚠️'}
                </p>
              </div>
            </div>

            {/* Per-period results */}
            <div className="space-y-1.5">
              {result.periods.map((p) => (
                <div
                  key={p.periodId}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-bg-primary/60 border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    {p.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                    )}
                    <div>
                      <p className="text-[11px] font-bold text-text-primary">{p.label}</p>
                      <p className="text-[9px] text-text-muted font-mono">
                        {p.startDate} → {p.endDate} · {p.candleCount} candles
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold font-mono ${p.totalPnlPct >= 0 ? 'text-success' : 'text-danger'}`}>
                      {p.totalPnlPct > 0 ? '+' : ''}{p.totalPnlPct.toFixed(1)}%
                    </p>
                    <p className="text-[9px] text-text-muted">
                      {p.totalTrades} trades · {p.winRate.toFixed(0)}% WR
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-text-muted text-center">
              Passed {result.passedCount}/{result.totalPeriods} periods
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !loading && (
        <p className="text-[11px] text-text-muted">
          Test the best genome across multiple market regimes (bull, bear, crash) to verify it&apos;s not overfitted.
        </p>
      )}
    </div>
  );
}
