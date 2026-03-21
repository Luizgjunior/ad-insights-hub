import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, getTrendColor } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon?: LucideIcon;
  color?: string;
  delay?: number;
}

export default function MetricCard({ label, value, trend, trendLabel, icon: Icon, delay = 0 }: MetricCardProps) {
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;

  return (
    <div
      className="card-surface p-4 animate-reveal-up group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>
      <p className="text-[28px] font-semibold font-mono-metric text-foreground leading-none">
        {value}
      </p>
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1.5 mt-2 text-xs font-medium', getTrendColor(trend))}>
          <TrendIcon className="h-3 w-3" />
          <span className="font-mono-metric">{Math.abs(trend).toFixed(1)}%</span>
          {trendLabel && <span className="text-muted-foreground font-normal">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="card-surface p-4">
      <div className="skeleton h-3 w-20 mb-4" />
      <div className="skeleton h-7 w-28 mb-2" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}
