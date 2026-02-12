interface WC3LoadingBarProps {
  progress: number; // 0-100
  text?: string;
  className?: string;
}

export function WC3LoadingBar({ progress, text, className = '' }: WC3LoadingBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`wc3-loading-bar ${className}`}>
      <div className="wc3-loading-bar-fill" style={{ width: `${clampedProgress}%` }}>
        <div className="wc3-loading-bar-glow" />
      </div>
      {text && <div className="wc3-loading-bar-text">{text}</div>}
    </div>
  );
}
