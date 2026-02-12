import { ReactNode } from 'react';
import { WC3Bar } from './WC3Bar';

interface WC3HeroCardProps {
  name: string;
  origin: string;
  portrait: ReactNode;
  level: number;
  hp: { current: number; max: number };
  mp?: { current: number; max: number };
  stats: { label: string; value: number | string }[];
  abilities?: ReactNode[];
  className?: string;
  compact?: boolean;
}

export function WC3HeroCard({
  name,
  origin,
  portrait,
  level,
  hp,
  mp,
  stats,
  abilities = [],
  className = '',
  compact = false
}: WC3HeroCardProps) {
  return (
    <div className={`wc3-hero-card ${className}`}>
      {/* Portrait */}
      <div className="wc3-hero-portrait">
        {portrait}
        <div className="wc3-hero-level-badge">{level}</div>
      </div>
      
      {/* Info */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Name & Origin */}
        <div>
          <h3 className="text-base font-bold text-wc3-gold mb-0.5">{name}</h3>
          <p className="text-xs text-text-secondary">{origin}</p>
        </div>
        
        {/* HP/MP Bars */}
        <div className="space-y-1">
          <WC3Bar current={hp.current} max={hp.max} type="health" showText={!compact} />
          {mp && <WC3Bar current={mp.current} max={mp.max} type="mana" showText={!compact} />}
        </div>
        
        {!compact && (
          <>
            {/* Stats Grid */}
            {stats.length > 0 && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {stats.map((stat, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-text-secondary">{stat.label}:</span>
                    <span className="text-text-primary font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Abilities */}
            {abilities.length > 0 && (
              <div className="flex gap-1 mt-1">
                {abilities.map((ability, i) => (
                  <div key={i} className="w-8 h-8 bg-black/30 border border-border-medium rounded flex items-center justify-center">
                    {ability}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
