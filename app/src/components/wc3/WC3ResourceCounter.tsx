import { ReactNode } from 'react';

interface WC3ResourceCounterProps {
  icon: ReactNode;
  value: number | string;
  label?: string;
  className?: string;
}

export function WC3ResourceCounter({ icon, value, label, className = '' }: WC3ResourceCounterProps) {
  return (
    <div className={`wc3-resource-counter ${className}`}>
      {icon}
      <div className="flex flex-col">
        <span className="font-bold leading-none">{value}</span>
        {label && <span className="text-[10px] text-text-muted leading-none">{label}</span>}
      </div>
    </div>
  );
}
