import { cn } from '@/lib/utils';

type StatusType = 'active' | 'paused' | 'error' | 'trial' | 'warning';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: 'Ativa', className: 'bg-success/12 text-success' },
  paused: { label: 'Pausada', className: 'bg-muted text-muted-foreground' },
  error: { label: 'Erro', className: 'bg-danger/12 text-danger' },
  trial: { label: 'Trial', className: 'bg-primary/12 text-primary' },
  warning: { label: 'Atenção', className: 'bg-warning/12 text-warning' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold badge-pill',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
