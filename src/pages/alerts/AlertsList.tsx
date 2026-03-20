import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AlertBadge from '@/components/ui/AlertBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useAlerts } from '@/hooks/useAlerts';
import { Bell, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'unresolved' | 'critical';

export default function AlertsList() {
  const { alerts, unreadCount, markAsRead, markAllAsRead, resolveAlert } = useAlerts();
  const [filter, setFilter] = useState<FilterTab>('all');

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && !a.is_resolved).length;
  const infoCount = alerts.filter(a => a.severity === 'info' && !a.is_resolved).length;

  const filtered = alerts.filter(a => {
    if (filter === 'unresolved') return !a.is_resolved;
    if (filter === 'critical') return a.severity === 'critical';
    return true;
  });

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'agora';
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  return (
    <AppShell title="Alertas">
      <div className="p-5 lg:p-8 space-y-5 max-w-4xl">
        <div className="flex items-center justify-between animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Central de Alertas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {criticalCount} críticos · {warningCount} avisos · {infoCount} informativos
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="active:scale-[0.97] border-border text-muted-foreground hover:text-foreground"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Marcar todos como lidos
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-1 animate-reveal-up" style={{ animationDelay: '60ms' }}>
          {([
            { key: 'all' as FilterTab, label: 'Todos' },
            { key: 'unresolved' as FilterTab, label: 'Não resolvidos' },
            { key: 'critical' as FilterTab, label: 'Críticos' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Bell} title="Nenhum alerta" description="Você será notificado sobre problemas nas campanhas" />
        ) : (
          <div className="space-y-2">
            {filtered.map((alert, i) => (
              <div
                key={alert.id}
                className={cn(
                  'card-surface p-4 animate-reveal-up',
                  alert.severity === 'critical' && 'border-l-2 border-l-danger',
                  alert.severity === 'warning' && 'border-l-2 border-l-warning',
                  alert.severity === 'info' && 'border-l-2 border-l-primary',
                  alert.is_read && 'opacity-60'
                )}
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
                onClick={() => !alert.is_read && markAsRead(alert.id)}
              >
                <div className="flex items-start gap-3">
                  <AlertBadge severity={alert.severity} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    {alert.body && (
                      <p className="text-xs text-muted-foreground mt-1 text-pretty leading-relaxed">{alert.body}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-muted-foreground">{formatTime(alert.created_at)}</span>
                      {!alert.is_resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-muted-foreground hover:text-success px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveAlert(alert.id);
                          }}
                        >
                          <Shield className="h-3 w-3" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
