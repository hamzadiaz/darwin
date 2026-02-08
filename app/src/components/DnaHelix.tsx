'use client';

import { motion } from 'framer-motion';
import { GENE_NAMES } from '@/types';

interface DnaHelixProps {
  genome?: number[];
  merging?: boolean;
  height?: number;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export function DnaHelix({ genome, merging = false, height = 300 }: DnaHelixProps) {
  const pairs = 12;
  const spacing = height / (pairs + 1);

  return (
    <div className="relative flex justify-center" style={{ height }}>
      <motion.div
        className="relative"
        style={{ width: 120, height }}
        animate={merging ? { scale: [1, 0.8, 1.1, 1], opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      >
        {Array.from({ length: pairs }, (_, i) => {
          const y = spacing * (i + 1);
          const phase = (i / pairs) * Math.PI * 2;
          const xLeft = 60 + Math.sin(phase) * 40;
          const xRight = 60 - Math.sin(phase) * 40;
          const color = COLORS[i % COLORS.length];
          const val = genome ? genome[i] : 500;
          const opacity = 0.4 + (val / 1000) * 0.6;

          return (
            <motion.div key={i} className="absolute" style={{ top: 0, left: 0, width: '100%', height: '100%' }}>
              {/* Left strand node */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 8, height: 8,
                  left: xLeft - 4, top: y - 4,
                  background: color, opacity,
                  boxShadow: `0 0 8px ${color}`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.4, type: 'spring' }}
              />
              {/* Right strand node */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 8, height: 8,
                  left: xRight - 4, top: y - 4,
                  background: color, opacity,
                  boxShadow: `0 0 8px ${color}`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08 + 0.04, duration: 0.4, type: 'spring' }}
              />
              {/* Bridge */}
              <motion.div
                className="absolute"
                style={{
                  height: 2,
                  top: y - 1,
                  left: Math.min(xLeft, xRight),
                  width: Math.abs(xLeft - xRight),
                  background: `linear-gradient(90deg, ${color}40, ${color}80, ${color}40)`,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.08 + 0.1, duration: 0.3 }}
              />
              {/* Gene label */}
              {genome && (
                <motion.span
                  className="absolute text-[8px] font-mono text-text-muted whitespace-nowrap"
                  style={{
                    top: y - 6,
                    left: xLeft > xRight ? xLeft + 10 : xRight + 10,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                >
                  {GENE_NAMES[i]?.split(' ')[0]}
                </motion.span>
              )}
            </motion.div>
          );
        })}

        {/* Strand lines */}
        <svg className="absolute inset-0" width={120} height={height} style={{ pointerEvents: 'none' }}>
          <motion.path
            d={Array.from({ length: pairs }, (_, i) => {
              const y = spacing * (i + 1);
              const x = 60 + Math.sin((i / pairs) * Math.PI * 2) * 40;
              return `${i === 0 ? 'M' : 'L'}${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(59,130,246,0.3)"
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <motion.path
            d={Array.from({ length: pairs }, (_, i) => {
              const y = spacing * (i + 1);
              const x = 60 - Math.sin((i / pairs) * Math.PI * 2) * 40;
              return `${i === 0 ? 'M' : 'L'}${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(139,92,246,0.3)"
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
