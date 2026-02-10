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
    }, 30000);
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
      if (res.ok) setState(await res.json());
    } catch { /* ignore */ }
  };

  const positionColor = state?.position === 'long' ? 'text-success' : state?.position === 'short' ? 'text-danger' : 'text-text-muted';

  return (
    <div className="space-y-4">
      {!state?.isRunning ? (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-accent-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Deploy Live Agent</h3>
              <p className="text-[11px] text-text-muted">Run the best evolved strategy against live prices</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('paper')}
              className={`px-4 py-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${mode === 'paper'
                ? 'bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary/20'
                : 'bg-bg-elevated/40 text-text-muted hover:bg-bg-elevated/60'
              }`}
            >
              Paper Trading
            </button>
            <button
              onClick={() => setMode('live')}
              className={`px-4 py-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${mode === 'live'
                ? 'bg-danger/10 text-danger border border-danger/20'
                : 'bg-bg-elevated/40 text-text-muted hover:bg-bg-elevated/60'
              }`}
            >
              Live Trading
            </button>
          </div>

          {mode === 'live' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/[0.04] border border-danger/10">
              <AlertTriangle className="w-3.5 h-3.5 text-danger mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-danger/80">Live trading executes real swaps on Jupiter DEX. Use at your own risk.</p>
            </div>
          )}

          {!hasEvolutionData && (
            <p className="text-[11px] text-text-muted">Run evolution first to generate a genome, or a random one will be used.</p>
          )}

          <button
            onClick={deployAgent}
            disabled={deploying}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-accent-primary/80 to-evolution-purple/80 text-white text-[13px] font-semibold hover:from-accent-primary hover:to-evolution-purple transition-all disabled:opacity-50 cursor-pointer"
          >
            {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Deploy Agent ({mode === 'paper' ? 'Paper' : 'Live'})
          </button>

          {error && <p className="text-[11px] text-danger">{error}</p>}
        </div>
      ) : (
        <>
          {/* Live Dashboard */}
          <div className="glass-card rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-success" />
                </div>
                <div>
                  <h3 className="section-title text-sm">Live Agent</h3>
                  <p className="text-[10px] text-text-muted font-mono">
                    {state.mode === 'paper' ? 'Paper' : 'Live'} · {state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={stopAgent}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-danger/8 border border-danger/15 text-danger text-[10px] font-medium hover:bg-danger/12 transition-colors cursor-pointer"
              >
                <Square className="w-3 h-3" /> Stop
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                { label: 'SOL Price', value: state.currentPrice > 0 ? `$${state.currentPrice.toFixed(2)}` : '—', icon: <DollarSign className="w-3 h-3 text-accent-primary" />, cls: 'text-text-primary' },
                { label: 'Position', value: state.position.toUpperCase(), icon: state.position === 'long' ? <TrendingUp className="w-3 h-3 text-success" /> : state.position === 'short' ? <TrendingDown className="w-3 h-3 text-danger" /> : <Minus className="w-3 h-3 text-text-muted" />, cls: positionColor },
                { label: 'Portfolio', value: `$${state.portfolioValue.toFixed(2)}`, icon: <DollarSign className="w-3 h-3 text-accent-secondary" />, cls: 'text-text-primary' },
                { label: 'Total PnL', value: `${state.totalPnl >= 0 ? '+' : ''}${(state.totalPnl / 100).toFixed(2)}%`, icon: <TrendingUp className="w-3 h-3" />, cls: state.totalPnl >= 0 ? 'text-success' : 'text-danger' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg bg-bg-elevated/30">
                  <div className="flex items-center gap-1 mb-1">
                    {s.icon}
                    <span className="text-[9px] text-text-muted uppercase tracking-wider">{s.label}</span>
                  </div>
                  <p className={`text-sm font-mono font-bold ${s.cls}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Signal */}
            <div className="p-3 rounded-lg bg-bg-elevated/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-text-muted">Signal</span>
                <span className={`text-[11px] font-bold ${state.currentSignal === 'BUY' ? 'text-success' : state.currentSignal === 'SELL' ? 'text-danger' : 'text-text-muted'}`}>
                  {state.currentSignal}
                </span>
              </div>
              <div className="w-full bg-bg-primary/60 rounded-full h-1.5">
                <motion.div
                  className={`h-1.5 rounded-full ${state.currentSignal === 'BUY' ? 'bg-success' : state.currentSignal === 'SELL' ? 'bg-danger' : 'bg-text-muted/20'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, state.signalStrength * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Trade History */}
          <div className="glass-card rounded-xl p-4 sm:p-5 space-y-3">
            <h4 className="section-title text-sm">Trade History</h4>
            {state.trades.length === 0 ? (
              <p className="text-[11px] text-text-muted text-center py-4">No trades yet — waiting for signals...</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-custom">
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

function TradeRow({ trade }: { trade: LiveTrade }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between px-2.5 py-2 rounded-lg row-hover"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-5 h-5 rounded flex items-center justify-center ${trade.type === 'BUY' ? 'bg-success/10' : 'bg-danger/10'}`}>
          {trade.type === 'BUY'
            ? <TrendingUp className="w-2.5 h-2.5 text-success" />
            : <TrendingDown className="w-2.5 h-2.5 text-danger" />}
        </div>
        <div>
          <span className={`text-[11px] font-medium ${trade.type === 'BUY' ? 'text-success' : 'text-danger'}`}>
            {trade.type}
          </span>
          <span className="text-[10px] text-text-muted ml-1.5">@ ${trade.price.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {trade.pnl !== 0 && (
          <span className={`text-[11px] font-mono font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
            {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}%
          </span>
        )}
        {trade.jupiterUrl && (
          <a href={trade.jupiterUrl} target="_blank" rel="noopener noreferrer" className="text-accent-primary/60 hover:text-accent-primary">
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
        <span className="text-[9px] text-text-muted/50 font-mono">
          {new Date(trade.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}
