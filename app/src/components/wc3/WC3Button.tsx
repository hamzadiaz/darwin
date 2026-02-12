import { ReactNode } from 'react';

interface WC3ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  primary?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function WC3Button({ 
  children, 
  onClick, 
  className = '', 
  primary = false,
  disabled = false,
  type = 'button'
}: WC3ButtonProps) {
  const baseClass = primary ? 'wc3-btn-primary' : 'wc3-btn';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

interface WC3CommandButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  hotkey?: string;
  disabled?: boolean;
  cooldown?: number; // 0-1, percentage of cooldown remaining
  className?: string;
}

export function WC3CommandButton({ 
  icon, 
  onClick, 
  hotkey, 
  disabled = false,
  cooldown = 0,
  className = ''
}: WC3CommandButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`wc3-cmd-btn ${className} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {icon}
      {hotkey && <span className="wc3-cmd-btn-hotkey">{hotkey}</span>}
      {cooldown > 0 && (
        <div 
          className="wc3-cmd-btn-cooldown"
          style={{
            background: `conic-gradient(
              rgba(0,0,0,0.7) 0deg,
              rgba(0,0,0,0.7) ${cooldown * 360}deg,
              transparent ${cooldown * 360}deg
            )`
          }}
        />
      )}
    </button>
  );
}
