import { useState } from 'react';
import { Bell, BellOff, CheckCircle, X, Shield } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AlertBadge from '@/components/ui/AlertBadge';
import EmptyState from '@/components/ui/EmptyState';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'unread' | 'critical';

export default function AlertsDrawer({ isOpen, onClose }: AlertsDrawerProps) {
  const { alerts, unreadCount, markAsRead, markAllAsRead, resolveAlert } = useAlerts();
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.is_read;
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[380px] bg-background border-border p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-foreground">Alertas</SheetTitle>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-muted-foreground h-7">
              <CheckCircle className="h-3 w-3" />
              Marcar todos
            </Button>
          </div>
          <div className="flex gap-1 mt-2">
            {(['all', 'unread', 'critical'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  filter === tab
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'all' ? 'Todos' : tab === 'unread' ? 'Não lidos' : 'Críticos'}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(100vh-120px)] p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12">
              <EmptyState icon={BellOff} title="Tudo em ordem!" description="Nenhum alerta por aqui" />
            </div>
          ) : (
            filtered.map(alert => (
              <div
                key={alert.id}
                className={cn(
                  'card-surface p-3 cursor-pointer',
                  !alert.is_read && 'border-l-2 border-l-primary'
                )}
                onClick={() => !alert.is_read && markAsRead(alert.id)}
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    'h-2 w-2 rounded-full mt-1.5 shrink-0',
                    alert.severity === 'critical' && 'bg-danger animate-pulse',
                    alert.severity === 'warning' && 'bg-warning',
                    alert.severity === 'info' && 'bg-primary'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    {alert.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.body}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">{formatTime(alert.created_at)}</span>
                      {'resolveAlert' in alert ? null : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-muted-foreground hover:text-success"
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
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
