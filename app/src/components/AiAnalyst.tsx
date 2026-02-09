'use client';

import { useState, useEffect } from 'react';
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
  return <p className={className}>{displayed}<span className="animate-pulse text-text-muted">|</span></p>;
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
      if (res.ok) setAnalysis(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

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
    <div className="glass-card rounded-xl p-4 sm:p-5 space-y-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-evolution-purple/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-evolution-purple" />
          </div>
          <div>
            <h3 className="section-title text-sm">AI Analyst</h3>
            <p className="text-[10px] text-text-muted font-mono">Gemini Flash</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-evolution-purple/8 border border-evolution-purple/15 text-evolution-purple text-[10px] font-medium hover:bg-evolution-purple/12 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Analyze
        </button>
      </div>

      {/* AI Breeding Decisions */}
      {decision && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <InfoBlock
            icon={<BarChart3 className="w-3 h-3 text-accent-primary" />}
            label="Market Regime"
            labelColor="text-accent-primary"
            extra={<span className={`text-[10px] font-mono font-bold ${regimeColor}`}>
              {aiBreedingResult?.marketRegimeDetection?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </span>}
          />

          <InfoBlock
            icon={<Dna className="w-3 h-3 text-evolution-purple" />}
            label="AI Breeding Decision"
            labelColor="text-evolution-purple"
            extra={<span className="text-[9px] font-mono text-text-muted">{(decision.confidence * 100).toFixed(0)}%</span>}
          >
            {showTyping ? (
              <TypedText text={decision.reasoning} className="text-[11px] text-text-secondary leading-relaxed" />
            ) : (
              <p className="text-[11px] text-text-secondary leading-relaxed">{decision.reasoning}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-evolution-purple/8 text-evolution-purple font-mono">
                #{decision.parentA} × #{decision.parentB}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-primary/8 text-accent-primary font-mono">
                {decision.strategyFocus}
              </span>
            </div>
          </InfoBlock>

          {aiBreedingResult?.evolutionStrategy && (
            <InfoBlock
              icon={<Target className="w-3 h-3 text-accent-tertiary" />}
              label="Evolution Strategy"
              labelColor="text-accent-tertiary"
            >
              <p className="text-[11px] text-text-secondary leading-relaxed">{aiBreedingResult.evolutionStrategy}</p>
            </InfoBlock>
          )}

          {Object.keys(decision.mutationBias).length > 0 && (
            <InfoBlock
              icon={<Sparkles className="w-3 h-3 text-yellow-400" />}
              label="Mutation Bias"
              labelColor="text-yellow-400"
            >
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(decision.mutationBias).map(([gene, bias]) => (
                  <div key={gene} className="flex items-center justify-between text-[10px]">
                    <span className="text-text-muted">{gene}</span>
                    <span className={`font-mono font-bold ${Number(bias) > 0 ? 'text-success' : Number(bias) < 0 ? 'text-danger' : 'text-text-muted'}`}>
                      {Number(bias) > 0 ? '↑' : Number(bias) < 0 ? '↓' : '—'} {Math.abs(Number(bias)).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </InfoBlock>
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {loading && !analysis && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-6">
            <div className="text-center">
              <Loader2 className="w-5 h-5 animate-spin text-evolution-purple mx-auto mb-2" />
              <p className="text-[11px] text-text-muted">Analyzing genome...</p>
            </div>
          </motion.div>
        )}

        {analysis && (
          <motion.div key="analysis" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <InfoBlock
              icon={<Sparkles className="w-3 h-3 text-accent-primary" />}
              label="Strategy"
              labelColor="text-accent-primary"
              extra={<span className={`text-[9px] font-mono ${confidenceColor}`}>{analysis.confidence}</span>}
            >
              {showTyping ? (
                <TypedText text={analysis.strategyDescription} className="text-[11px] text-text-secondary leading-relaxed" />
              ) : (
                <p className="text-[11px] text-text-secondary leading-relaxed">{analysis.strategyDescription}</p>
              )}
            </InfoBlock>

            <InfoBlock icon={<TrendingUp className="w-3 h-3 text-success" />} label="Market Insight" labelColor="text-success">
              <p className="text-[11px] text-text-secondary leading-relaxed">{analysis.marketInsight}</p>
            </InfoBlock>

            <InfoBlock icon={<Lightbulb className="w-3 h-3 text-yellow-400" />} label="Mutation Advice" labelColor="text-yellow-400">
              <p className="text-[11px] text-text-secondary leading-relaxed">{analysis.mutationSuggestion}</p>
            </InfoBlock>
          </motion.div>
        )}

        {!analysis && !loading && !decision && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
            <Brain className="w-7 h-7 text-text-muted/15 mx-auto mb-2" />
            <p className="text-[11px] text-text-muted">Click Analyze for AI insights</p>
            <p className="text-[10px] text-text-muted/50 mt-0.5">Auto-analyzes every 5 gens</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoBlock({ icon, label, labelColor, extra, children }: {
  icon: React.ReactNode; label: string; labelColor: string; extra?: React.ReactNode; children?: React.ReactNode;
}) {
  return (
    <div className="p-3 rounded-lg bg-bg-elevated/25 border border-white/[0.03]">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className={`text-[10px] font-medium uppercase tracking-wider ${labelColor}`}>{label}</span>
        {extra && <span className="ml-auto">{extra}</span>}
      </div>
      {children}
    </div>
  );
}
