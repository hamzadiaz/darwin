'use client';

import { motion } from 'framer-motion';
import { GENE_NAMES, GENOME_SIZE } from '@/types';

interface GenomeRadarProps {
  genome: number[];
  compareGenome?: number[];
  size?: number;
  label?: string;
  compareLabel?: string;
}

export function GenomeRadar({ genome, compareGenome, size = 200, label, compareLabel }: GenomeRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const levels = 4;
  const n = Math.min(genome.length, GENOME_SIZE);

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, val: number) => ({
    x: cx + Math.cos(angle(i)) * r * ((val ?? 500) / 1000),
    y: cy + Math.sin(angle(i)) * r * ((val ?? 500) / 1000),
  });

  const toPath = (values: number[]) =>
    Array.from({ length: n }, (_, i) => values[i] ?? 500)
      .map((v, i) => point(i, v))
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
      .join(' ') + ' Z';

  const shortNames = GENE_NAMES.slice(0, n).map(name => {
    const parts = name.split(' ');
    if (parts.length > 1) return parts.map(p => p[0]).join('');
    return name.slice(0, 3);
  });

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid */}
      {Array.from({ length: levels }, (_, l) => {
        const lr = r * ((l + 1) / levels);
        const pts = Array.from({ length: n }, (_, i) => {
          const a = angle(i);
          return `${cx + Math.cos(a) * lr},${cy + Math.sin(a) * lr}`;
        }).join(' ');
        return <polygon key={l} points={pts} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={0.5} />;
      })}

      {/* Axes */}
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle(i)) * r} y2={cy + Math.sin(angle(i)) * r} stroke="rgba(148,163,184,0.08)" strokeWidth={0.5} />
      ))}

      {/* Labels */}
      {Array.from({ length: n }, (_, i) => {
        const lp = { x: cx + Math.cos(angle(i)) * (r + 14), y: cy + Math.sin(angle(i)) * (r + 14) };
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" className="fill-text-muted" style={{ fontSize: size > 150 ? 6 : 4, fontFamily: 'var(--font-mono)' }}>
            {shortNames[i]}
          </text>
        );
      })}

      {/* Compare genome */}
      {compareGenome && (
        <motion.path
          d={toPath(compareGenome)}
          fill="rgba(239,68,68,0.1)"
          stroke="#EF4444"
          strokeWidth={1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8 }}
        />
      )}

      {/* Main genome */}
      <motion.path
        d={toPath(genome)}
        fill="rgba(59,130,246,0.15)"
        stroke="#3B82F6"
        strokeWidth={1.5}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Dots */}
      {Array.from({ length: n }, (_, i) => {
        const p = point(i, genome[i] ?? 500);
        return (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2}
            fill="#3B82F6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
          />
        );
      })}

      {/* Legend */}
      {label && (
        <text x={4} y={size - 4} className="fill-accent-primary" style={{ fontSize: 7, fontFamily: 'var(--font-mono)' }}>{label}</text>
      )}
      {compareLabel && (
        <text x={4} y={size - 14} className="fill-danger" style={{ fontSize: 7, fontFamily: 'var(--font-mono)' }}>{compareLabel}</text>
      )}
    </svg>
  );
}
