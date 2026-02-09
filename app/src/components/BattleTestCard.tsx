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
    <div className="glass-card rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-evolution-purple/10 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-evolution-purple" />
          </div>
          <h3 className="section-title text-sm">Battle Test</h3>
        </div>
        <button
          onClick={runTest}
          disabled={loading || !genome}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-evolution-purple/10 border border-evolution-purple/20 text-evolution-purple text-[11px] font-medium hover:bg-evolution-purple/15 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
          {loading ? 'Testing...' : 'Run Test'}
        </button>
      </div>

      {error && (
        <div className="text-[11px] text-danger bg-danger/8 rounded-lg px-3 py-2 mb-3 border border-danger/15">
          {error}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Summary */}
            <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${
              result.battleTested
                ? 'bg-success/[0.04] border-success/15'
                : 'bg-warning/[0.04] border-warning/15'
            }`}>
              <Trophy className={`w-4 h-4 ${result.battleTested ? 'text-success' : 'text-warning'}`} />
              <div>
                <p className="text-xs font-medium text-text-primary">
                  Agent #{agentId} — {result.passedCount}/{result.totalPeriods} passed
                </p>
                <p className={`text-[11px] font-mono font-bold ${result.battleTested ? 'text-success' : 'text-warning'}`}>
                  {result.averagePnl > 0 ? '+' : ''}{result.averagePnl.toFixed(1)}% avg
                  {result.battleTested ? ' · BATTLE TESTED' : ' · NEEDS WORK'}
                </p>
              </div>
            </div>

            {/* Period Results */}
            <div className="space-y-1">
              {result.periods.map((p) => (
                <div
                  key={p.periodId}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-elevated/40 row-hover"
                >
                  <div className="flex items-center gap-2">
                    {p.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success/80" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-warning/80" />
                    )}
                    <div>
                      <p className="text-[11px] font-medium text-text-primary">{p.label}</p>
                      <p className="text-[9px] text-text-muted font-mono">
                        {p.startDate} → {p.endDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-mono font-bold ${p.totalPnlPct >= 0 ? 'text-success' : 'text-danger'}`}>
                      {p.totalPnlPct > 0 ? '+' : ''}{p.totalPnlPct.toFixed(1)}%
                    </p>
                    <p className="text-[9px] text-text-muted font-mono">
                      {p.totalTrades}t · {p.winRate.toFixed(0)}% WR
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !loading && (
        <p className="text-[11px] text-text-muted">
          Test the best genome across multiple market regimes to verify it&apos;s not overfitted.
        </p>
      )}
    </div>
  );
}
