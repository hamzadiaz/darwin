'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, Lightbulb, Loader2, RefreshCw, Dna, Target, BarChart3 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/engine/analyst';
import type { AIBreedingResult } from '@/lib/engine/ai-breeder';

interface AiAnalystProps {
  genome: number[];
  generation: number;
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  avgPnl: number;
  bestPnl: number;
  populationSize: number;
  candles?: { open: number; high: number; low: number; close: number }[];
  autoAnalyze?: boolean;
  aiBreedingResult?: AIBreedingResult | null;
}

/** Typing effect hook */
function useTypingEffect(text: string, speed = 15): string {
  const [displayed, setDisplayed] = useState('');
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    if (text !== currentText) {
      setCurrentText(text);
      setDisplayed('');
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }
  }, [text, speed, currentText]);

  return displayed || text;
}

function TypedText({ text, className = '' }: { text: string; className?: string }) {
  const displayed = useTypingEffect(text);
  return <p className={className}>{displayed}<span className="animate-pulse">|</span></p>;
}

export function AiAnalyst({
  genome, generation, totalPnl, winRate, totalTrades,
  avgPnl, bestPnl, populationSize, candles, autoAnalyze,
  aiBreedingResult,
}: AiAnalystProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastGen, setLastGen] = useState(-1);
  const [showTyping, setShowTyping] = useState(false);

  const runAnalysis = async () => {
    if (loading) return;
    setLoading(true);
    setShowTyping(true);
    try {
      const candleSummary = candles && candles.length > 0 ? {
        startPrice: candles[0].open,
        endPrice: candles[candles.length - 1].close,
        highPrice: Math.max(...candles.map(c => c.high)),
        lowPrice: Math.min(...candles.map(c => c.low)),
        priceChange: ((candles[candles.length - 1].close - candles[0].open) / candles[0].open) * 100,
      } : undefined;

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genome, generation, totalPnl, winRate, totalTrades,
          avgPnl, bestPnl, populationSize, candleSummary,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  // Auto-analyze on generation change
  useEffect(() => {
    if (autoAnalyze && generation !== lastGen && generation > 0 && generation % 5 === 0) {
      setLastGen(generation);
      runAnalysis();
    }
  }, [generation, autoAnalyze]);

  const confidenceColor = analysis?.confidence === 'high' ? 'text-success' :
    analysis?.confidence === 'medium' ? 'text-yellow-400' : 'text-text-muted';

  const decision = aiBreedingResult?.decisions?.[0];
  const regimeColor = aiBreedingResult?.marketRegimeDetection?.includes('trending')
    ? 'text-success' : aiBreedingResult?.marketRegimeDetection?.includes('volatile')
      ? 'text-danger' : 'text-yellow-400';

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-evolution-purple/10 to-transparent rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-evolution-purple/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-evolution-purple" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">AI Analyst</h3>
            <p className="text-[10px] text-text-muted font-mono">Powered by Gemini Flash</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-evolution-purple/20 border border-evolution-purple/30 text-evolution-purple text-[10px] font-bold hover:bg-evolution-purple/30 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Analyze
        </button>
      </div>

      {/* AI Breeding Decisions */}
      {decision && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 relative z-10"
        >
          {/* Market Regime Detection */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BarChart3 className="w-3 h-3 text-accent-primary" />
              <span className="text-[10px] font-bold text-accent-primary uppercase tracking-wider">Market Regime</span>
              <span className={`ml-auto text-[10px] font-mono font-bold ${regimeColor}`}>
                {aiBreedingResult?.marketRegimeDetection?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>

          {/* Breeding Decision */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Dna className="w-3 h-3 text-evolution-purple" />
              <span className="text-[10px] font-bold text-evolution-purple uppercase tracking-wider">AI Breeding Decision</span>
              <span className="ml-auto text-[9px] font-mono text-text-muted">
                confidence: {(decision.confidence * 100).toFixed(0)}%
              </span>
            </div>
            {showTyping ? (
              <TypedText text={decision.reasoning} className="text-xs text-text-secondary leading-relaxed" />
            ) : (
              <p className="text-xs text-text-secondary leading-relaxed">{decision.reasoning}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-evolution-purple/10 text-evolution-purple font-mono">
                Parent #{decision.parentA} × #{decision.parentB}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary font-mono">
                {decision.strategyFocus}
              </span>
            </div>
          </div>

          {/* Evolution Strategy */}
          {aiBreedingResult?.evolutionStrategy && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className="w-3 h-3 text-accent-tertiary" />
                <span className="text-[10px] font-bold text-accent-tertiary uppercase tracking-wider">Evolution Strategy</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{aiBreedingResult.evolutionStrategy}</p>
            </div>
          )}

          {/* Mutation Bias */}
          {Object.keys(decision.mutationBias).length > 0 && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Mutation Bias</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(decision.mutationBias).map(([gene, bias]) => (
                  <div key={gene} className="flex items-center justify-between text-[10px]">
                    <span className="text-text-muted">{gene}</span>
                    <span className={`font-mono font-bold ${Number(bias) > 0 ? 'text-success' : Number(bias) < 0 ? 'text-danger' : 'text-text-muted'}`}>
                      {Number(bias) > 0 ? '↑' : Number(bias) < 0 ? '↓' : '—'} {Math.abs(Number(bias)).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {loading && !analysis && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8"
          >
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-evolution-purple mx-auto mb-2" />
              <p className="text-xs text-text-muted">Analyzing genome...</p>
            </div>
          </motion.div>
        )}

        {analysis && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 relative z-10"
          >
            {/* Strategy Description */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3 h-3 text-accent-primary" />
                <span className="text-[10px] font-bold text-accent-primary uppercase tracking-wider">Strategy</span>
                <span className={`ml-auto text-[9px] font-mono ${confidenceColor}`}>
                  {analysis.confidence} confidence
                </span>
              </div>
              {showTyping ? (
                <TypedText text={analysis.strategyDescription} className="text-xs text-text-secondary leading-relaxed" />
              ) : (
                <p className="text-xs text-text-secondary leading-relaxed">{analysis.strategyDescription}</p>
              )}
            </div>

            {/* Market Insight */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-[10px] font-bold text-success uppercase tracking-wider">Market Insight</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{analysis.marketInsight}</p>
            </div>

            {/* Mutation Suggestion */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Mutation Advice</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{analysis.mutationSuggestion}</p>
            </div>
          </motion.div>
        )}

        {!analysis && !loading && !decision && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-6 text-center"
          >
            <Brain className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
            <p className="text-xs text-text-muted">Click Analyze to get AI insights on the best evolved strategy</p>
            <p className="text-[10px] text-text-muted/50 mt-1">Auto-analyzes every 5 generations</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
