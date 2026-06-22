import './GradientText.css';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span className={`gradient-text-animated ${className}`}>
      {children}
    </span>
  );
}
