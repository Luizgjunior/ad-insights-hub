import { cn } from '@/lib/utils';
import type { AlertSeverity } from '@/types';

const severityConfig: Record<AlertSeverity, { className: string }> = {
  info: { className: 'bg-primary/12 text-primary' },
  warning: { className: 'bg-warning/12 text-warning' },
  critical: { className: 'bg-danger/12 text-danger' },
};

interface AlertBadgeProps {
  severity: AlertSeverity;
  label?: string;
  className?: string;
}

export default function AlertBadge({ severity, label, className }: AlertBadgeProps) {
  const config = severityConfig[severity];
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider badge-pill',
      config.className,
      className
    )}>
      {label || severity}
    </span>
  );
}
