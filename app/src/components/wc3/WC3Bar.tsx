interface WC3BarProps {
  current: number;
  max: number;
  type?: 'health' | 'mana' | 'energy';
  showText?: boolean;
  large?: boolean;
  className?: string;
}

export function WC3Bar({ 
  current, 
  max, 
  type = 'health', 
  showText = true,
  large = false,
  className = ''
}: WC3BarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const fillClass = `wc3-bar-fill--${type}`;
  
  return (
    <div className={`wc3-bar ${large ? 'wc3-bar--large' : ''} ${className}`}>
      <div 
        className={`wc3-bar-fill ${fillClass}`}
        style={{ width: `${percentage}%` }}
      />
      <div className="wc3-bar-segments" />
      {showText && (
        <div className="wc3-bar-text">
          {Math.round(current)} / {max}
        </div>
      )}
    </div>
  );
}
