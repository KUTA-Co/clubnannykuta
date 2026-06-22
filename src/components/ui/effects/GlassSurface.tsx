import { useRef, MouseEvent as ReactMouseEvent } from 'react';
import { Link } from 'react-router-dom';
import './GlassSurface.css';

interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'sage' | 'dark' | 'white' | 'outline' | 'pink';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  to?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function GlassButton({
  children,
  variant = 'sage',
  size = 'md',
  className = '',
  to,
  onClick,
  type = 'button',
  disabled = false
}: GlassButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled) return;

    // Create ripple effect
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.className = 'glass-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    }

    if (onClick) onClick();
  };

  const sizeClasses = {
    sm: 'text-sm py-2 px-4',
    md: 'text-sm md:text-base py-2.5 md:py-3 px-5 md:px-6',
    lg: 'text-sm md:text-lg py-3 md:py-4 px-6 md:px-8 h-12 md:h-14'
  };

  const baseClasses = `glass-button glass-button-${variant} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  if (to) {
    return (
      <Link
        to={to}
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        className={baseClasses}
        onClick={handleClick}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </Link>
    );
  }

  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      type={type}
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}

export function GlassCard({ children, className = '', light = false }: GlassCardProps) {
  return (
    <div className={`glass-card ${light ? 'glass-card-light' : ''} ${className}`}>
      {children}
    </div>
  );
}

interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassSurface({ children, className = '' }: GlassSurfaceProps) {
  return <div className={`glass-surface ${className}`}>{children}</div>;
}
