import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  trend?: number
  trendLabel?: string
  icon?: LucideIcon
  loading?: boolean
  className?: string
  delay?: number
}

export function MetricCardSkeleton() {
  return (
    <div className="card-surface p-4 space-y-3">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-6 w-28 rounded" />
      <div className="skeleton h-2.5 w-16 rounded" />
    </div>
  )
}

export default function MetricCard({
  label, value, trend, trendLabel, icon: Icon, loading, className, delay
}: MetricCardProps) {
  if (loading) return <MetricCardSkeleton />

  const trendClass = trend == null ? '' : trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'
  const trendSign  = trend != null && trend > 0 ? '+' : ''

  return (
    <div
      className={cn('card-surface p-4 space-y-2 animate-reveal-up', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        {Icon && <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />}
      </div>
      <div className="metric-value">{value}</div>
      {trend != null && (
        <div className={`metric-trend ${trendClass}`}>
          {trendSign}{Math.abs(trend).toFixed(1)}%
          {trendLabel && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> {trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
