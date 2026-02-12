import { ReactNode } from 'react';

interface WC3CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  dialog?: boolean;
}

export function WC3Card({ children, className = '', elevated = false, dialog = false }: WC3CardProps) {
  const baseClass = dialog ? 'wc3-dialog' : elevated ? 'wc3-card-elevated' : 'wc3-card';
  
  return (
    <div className={`${baseClass} ${className}`}>
      {children}
    </div>
  );
}
