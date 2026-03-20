import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  className?: string;
  delay?: number;
}

export default function MetricCard({ title, value, change, icon: Icon, className, delay = 0 }: MetricCardProps) {
  const TrendIcon = change === undefined || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
  const trendColor = change === undefined || change === 0
    ? 'text-muted-foreground'
    : change > 0
      ? 'text-success'
      : 'text-destructive';

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow',
        'animate-reveal-up',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 mt-1.5 text-sm font-medium', trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="tabular-nums">{Math.abs(change).toFixed(1)}%</span>
          <span className="text-muted-foreground font-normal text-xs">vs ontem</span>
        </div>
      )}
    </div>
  );
}
