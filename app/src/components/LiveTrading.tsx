'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Square, TrendingUp, TrendingDown, Minus, DollarSign,
  Activity, Zap, ExternalLink, AlertTriangle, Loader2, Rocket,
} from 'lucide-react';
import type { LiveAgentState, LiveTrade, TradingMode } from '@/lib/trading/live-agent';

interface LiveTradingProps {
  hasEvolutionData: boolean;
}

export function LiveTrading({ hasEvolutionData }: LiveTradingProps) {
  const [state, setState] = useState<LiveAgentState | null>(null);
  const [mode, setMode] = useState<TradingMode>('paper');
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/live-trading');
      if (res.ok) {
        const data = await res.json();
        if (data.isRunning) setState(data);
      }
    } catch { /* ignore */ }
  }, []);

  // Poll for updates when agent is running
  useEffect(() => {
    fetchState();
    const interval = setInterval(async () => {
      if (state?.isRunning) {
        try {
          const res = await fetch('/api/live-trading', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update' }),
          });
          if (res.ok) setState(await res.json());
        } catch { /* ignore */ }
      }
    }, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [state?.isRunning, fetchState]);

  const deployAgent = async () => {
    setDeploying(true);
    setError(null);
    try {
      const res = await fetch('/api/live-trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deploy', mode }),
      });
      if (!res.ok) throw new Error('Deploy failed');
      const data = await res.json();
      setState(data);
      // Trigger first update
      setTimeout(async () => {
        const r = await fetch('/api/live-trading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update' }),
        });
        if (r.ok) setState(await r.json());
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy');
    }
    setDeploying(false);
  };

  const stopAgent = async () => {
    try {
      const res = await fetch('/api/live-trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch { /* ignore */ }
  };

  const positionIcon = state?.position === 'long'
    ? <TrendingUp className="w-4 h-4 text-success" />
    : state?.position === 'short'
      ? <TrendingDown className="w-4 h-4 text-danger" />
      : <Minus className="w-4 h-4 text-text-muted" />;

  const positionColor = state?.position === 'long' ? 'text-success' : state?.position === 'short' ? 'text-danger' : 'text-text-muted';

  return (
    <div className="space-y-4">
      {/* Deploy Section */}
      {!state?.isRunning ? (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Deploy Live Agent</h3>
              <p className="text-xs text-text-muted">Run the best evolved strategy against live SOL prices</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('paper')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'paper'
                ? 'bg-accent-tertiary/20 text-accent-tertiary border border-accent-tertiary/30'
                : 'bg-white/5 text-text-muted hover:bg-white/10'
                }`}
            >
              📝 Paper Trading
            </button>
            <button
              onClick={() => setMode('live')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'live'
                ? 'bg-danger/20 text-danger border border-danger/30'
                : 'bg-white/5 text-text-muted hover:bg-white/10'
                }`}
            >
              ⚡ Live Trading
            </button>
          </div>

          {mode === 'live' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20">
              <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
              <p className="text-xs text-danger">Live trading executes real swaps on Jupiter DEX. Use at your own risk.</p>
            </div>
          )}

          {!hasEvolutionData && (
            <p className="text-xs text-text-muted">⚠️ Run evolution first to generate a genome, or a random one will be used.</p>
          )}

          <button
            onClick={deployAgent}
            disabled={deploying}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-accent-primary/80 to-evolution-purple/80 text-white text-sm font-bold hover:from-accent-primary hover:to-evolution-purple transition-all disabled:opacity-50"
          >
            {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Deploy Agent ({mode === 'paper' ? 'Paper' : 'Live'})
          </button>

          {error && <p className="text-xs text-danger">⚠️ {error}</p>}
        </div>
      ) : (
        <>
          {/* Live Dashboard */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-success animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Live Agent</h3>
                  <p className="text-[10px] text-text-muted font-mono">
                    {state.mode === 'paper' ? '📝 Paper Mode' : '⚡ Live Mode'} · Updated {state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : 'never'}
                  </p>
                </div>
              </div>
              <button
                onClick={stopAgent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/20 border border-danger/30 text-danger text-[10px] font-bold hover:bg-danger/30 transition-all"
              >
                <Square className="w-3 h-3" /> Stop
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="SOL Price"
                value={state.currentPrice > 0 ? `$${state.currentPrice.toFixed(2)}` : '—'}
                icon={<DollarSign className="w-3.5 h-3.5 text-accent-primary" />}
              />
              <StatCard
                label="Position"
                value={state.position.toUpperCase()}
                icon={positionIcon}
                valueClass={positionColor}
              />
              <StatCard
                label="Portfolio"
                value={`$${state.portfolioValue.toFixed(2)}`}
                icon={<DollarSign className="w-3.5 h-3.5 text-accent-secondary" />}
              />
              <StatCard
                label="Total PnL"
                value={`${state.totalPnl >= 0 ? '+' : ''}${state.totalPnl.toFixed(2)}%`}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                valueClass={state.totalPnl >= 0 ? 'text-success' : 'text-danger'}
              />
            </div>

            {/* Signal Strength */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Signal</span>
                <span className={`text-xs font-bold ${state.currentSignal === 'BUY' ? 'text-success' : state.currentSignal === 'SELL' ? 'text-danger' : 'text-text-muted'
                  }`}>
                  {state.currentSignal}
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${state.currentSignal === 'BUY' ? 'bg-success' : state.currentSignal === 'SELL' ? 'bg-danger' : 'bg-text-muted/30'
                    }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, state.signalStrength * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Trade History */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Trade History</h4>
            {state.trades.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">No trades yet — waiting for signals...</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-custom">
                {[...state.trades].reverse().map((trade) => (
                  <TradeRow key={trade.id} trade={trade} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, valueClass = 'text-text-primary' }: {
  label: string; value: string; icon: React.ReactNode; valueClass?: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-sm font-mono font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function TradeRow({ trade }: { trade: LiveTrade }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5"
    >
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${trade.type === 'BUY' ? 'bg-success/20' : 'bg-danger/20'
          }`}>
          {trade.type === 'BUY'
            ? <TrendingUp className="w-3 h-3 text-success" />
            : <TrendingDown className="w-3 h-3 text-danger" />}
        </div>
        <div>
          <span className={`text-xs font-bold ${trade.type === 'BUY' ? 'text-success' : 'text-danger'}`}>
            {trade.type}
          </span>
          <span className="text-[10px] text-text-muted ml-2">
            @ ${trade.price.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {trade.pnl !== 0 && (
          <span className={`text-xs font-mono font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
            {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}%
          </span>
        )}
        <span className="text-[9px] text-text-muted font-mono">
          {trade.mode === 'paper' ? '📝' : '⚡'}
        </span>
        {trade.jupiterUrl && (
          <a
            href={trade.jupiterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:text-accent-primary/80"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <span className="text-[9px] text-text-muted/50">
          {new Date(trade.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}
