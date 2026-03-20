import AppShell from '@/components/layout/AppShell';
import AlertBadge from '@/components/ui/AlertBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useAlerts } from '@/hooks/useAlerts';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const severityBorder: Record<string, string> = {
  critical: 'border-l-2 border-l-danger',
  warning: 'border-l-2 border-l-warning',
  info: 'border-l-2 border-l-primary',
};

// Mock alerts for UI display while no real data
const mockAlerts = [
  { id: '1', title: 'ROAS caiu 25% na campanha "Leads Março"', body: 'O ROAS caiu de 3.2× para 2.4× nas últimas 24h. Considere pausar os conjuntos de anúncio com pior performance.', severity: 'critical' as const, alert_type: 'roas_drop' as const, is_read: false, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '2', title: 'Frequência acima de 4.0 no conjunto "Retargeting"', body: 'O público está saturado. Renove os criativos ou expanda o público-alvo.', severity: 'warning' as const, alert_type: 'high_frequency' as const, is_read: false, created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: '3', title: 'CPL subiu 35% no "Lookalike 1%"', body: 'O custo por lead passou de R$12 para R$16,20. Avalie os criativos e segmentação.', severity: 'warning' as const, alert_type: 'cpl_spike' as const, is_read: true, created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: '4', title: 'Token de acesso expira em 3 dias', body: 'Renove o token da conta "Loja Premium" para manter a sincronização de dados.', severity: 'info' as const, alert_type: 'token_expiring' as const, is_read: true, created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
];

export default function AlertsList() {
  const { alerts: dbAlerts, unreadCount: dbUnread, markAsRead, markAllAsRead } = useAlerts();
  const displayAlerts = dbAlerts.length > 0 ? dbAlerts : mockAlerts;
  const unreadCount = dbAlerts.length > 0 ? dbUnread : mockAlerts.filter(a => !a.is_read).length;

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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Alertas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} não lidos</p>
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

        {displayAlerts.length === 0 ? (
          <EmptyState icon={Bell} title="Nenhum alerta" description="Você será notificado sobre problemas nas campanhas" />
        ) : (
          <div className="space-y-2">
            {displayAlerts.map((alert, i) => (
              <div
                key={alert.id}
                className={`card-surface p-4 animate-reveal-up ${severityBorder[alert.severity] || ''} ${alert.is_read ? 'opacity-50' : ''}`}
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
                onClick={() => !alert.is_read && markAsRead(alert.id)}
              >
                <div className="flex items-start gap-3">
                  <AlertBadge severity={alert.severity} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    {'body' in alert && alert.body && (
                      <p className="text-xs text-muted-foreground mt-1 text-pretty leading-relaxed">{alert.body}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {formatTime(alert.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
