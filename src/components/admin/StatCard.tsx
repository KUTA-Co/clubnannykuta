import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  color?: "sage" | "dark" | "cream";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "cream"
}: StatCardProps) {
  const colorStyles = {
    sage: {
      bg: "bg-[#8BA99E]",
      text: "text-white",
      subtext: "text-white/70",
      icon: "bg-white/20 text-white"
    },
    dark: {
      bg: "bg-[#1A1A1A]",
      text: "text-white",
      subtext: "text-white/60",
      icon: "bg-white/10 text-white"
    },
    cream: {
      bg: "bg-white",
      text: "text-[#1A1A1A]",
      subtext: "text-[#1A1A1A]/60",
      icon: "bg-[#8BA99E]/10 text-[#8BA99E]"
    }
  };

  const styles = colorStyles[color];

  return (
    <div className={`${styles.bg} rounded-2xl p-6 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${styles.subtext}`}>{title}</p>
          <p className={`text-3xl font-bold font-heading mt-1 ${styles.text}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm mt-1 ${styles.subtext}`}>{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
              {trend.isPositive ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${styles.icon} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
