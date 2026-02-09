'use client';

import { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradeMarker {
  time: number;
  price: number;
  type: 'entry' | 'exit';
  agentId: number;
  pnl?: number;
}

interface CandleChartProps {
  candles: Candle[];
  markers?: TradeMarker[];
}

const AGENT_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

function CandleChartInner({ candles, markers = [] }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import('lightweight-charts').createChart> | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    let disposed = false;

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode, CandlestickSeries, createSeriesMarkers }) => {
      if (disposed || !containerRef.current) return;

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: 'rgba(139, 148, 158, 0.7)',
          fontSize: 10,
        },
        grid: {
          vertLines: { color: 'rgba(240, 246, 252, 0.02)' },
          horzLines: { color: 'rgba(240, 246, 252, 0.02)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: 'rgba(240, 246, 252, 0.08)', width: 1, style: 2 },
          horzLine: { color: 'rgba(240, 246, 252, 0.08)', width: 1, style: 2 },
        },
        rightPriceScale: {
          borderColor: 'rgba(240, 246, 252, 0.04)',
        },
        timeScale: {
          borderColor: 'rgba(240, 246, 252, 0.04)',
          timeVisible: true,
        },
      });

      chartRef.current = chart;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });

      const chartData = candles.map((c) => ({
        time: c.time as import('lightweight-charts').UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      candleSeries.setData(chartData);

      if (markers.length > 0) {
        const seriesMarkers = markers
          .filter((m) => m.time >= candles[0].time && m.time <= candles[candles.length - 1].time)
          .sort((a, b) => a.time - b.time)
          .map((m) => {
            const color = AGENT_COLORS[(m.agentId - 1) % AGENT_COLORS.length];
            return {
              time: m.time as import('lightweight-charts').UTCTimestamp,
              position: m.type === 'entry' ? 'belowBar' as const : 'aboveBar' as const,
              color,
              shape: m.type === 'entry' ? 'arrowUp' as const : 'arrowDown' as const,
              text: m.type === 'entry'
                ? `#${m.agentId} BUY`
                : `#${m.agentId} ${m.pnl !== undefined ? (m.pnl >= 0 ? '+' : '') + m.pnl.toFixed(1) + '%' : 'SELL'}`,
              size: 1,
            };
          });

        createSeriesMarkers(candleSeries, seriesMarkers);
      }

      chart.timeScale().fitContent();

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry && chartRef.current) {
          chartRef.current.applyOptions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
        chart.remove();
      };
    });

    return () => {
      disposed = true;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, markers]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="glass-card rounded-xl p-4 sm:p-5 h-full min-h-[320px] sm:min-h-[420px] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-tertiary/10 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-accent-tertiary" />
          </div>
          <div>
            <h3 className="section-title text-sm">Market Arena</h3>
            <p className="text-[10px] text-text-muted">
              {candles.length > 0
                ? `${candles.length} candles · Real data`
                : 'Waiting for data...'}
            </p>
          </div>
        </div>
        {markers.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] text-text-muted font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Buy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-danger" /> Sell
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 min-h-0" />

      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-text-muted text-xs">Start evolution to load chart data</p>
        </div>
      )}
    </motion.div>
  );
}

export const CandleChart = memo(CandleChartInner);
