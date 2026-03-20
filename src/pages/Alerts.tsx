import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockAlerts = [
  { id: '1', title: 'ROAS caiu 25% na campanha "Leads Março"', body: 'O ROAS da campanha caiu de 3.2x para 2.4x nas últimas 24h.', severity: 'critical', isRead: false, createdAt: '2h atrás' },
  { id: '2', title: 'Frequência acima de 4.0 no conjunto "Retargeting"', body: 'Considere renovar os criativos ou expandir o público.', severity: 'warning', isRead: false, createdAt: '4h atrás' },
  { id: '3', title: 'CPL subiu 35% no conjunto "Lookalike 1%"', body: 'O custo por lead passou de R$12 para R$16.20.', severity: 'warning', isRead: true, createdAt: '8h atrás' },
  { id: '4', title: 'Token de acesso expira em 3 dias', body: 'Renove o token da conta "Loja Premium" para manter a sincronização.', severity: 'info', isRead: true, createdAt: '1d atrás' },
];

const severityStyles: Record<string, string> = {
  critical: 'border-l-4 border-l-destructive',
  warning: 'border-l-4 border-l-warning',
  info: 'border-l-4 border-l-info',
};

export default function Alerts() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
            <p className="text-muted-foreground mt-1">{mockAlerts.filter(a => !a.isRead).length} não lidos</p>
          </div>
          <Button variant="outline" className="active:scale-[0.98]">
            <CheckCircle className="h-4 w-4" />
            Marcar todos como lidos
          </Button>
        </div>

        <div className="space-y-3">
          {mockAlerts.map((alert, i) => (
            <Card
              key={alert.id}
              className={`animate-reveal-up ${severityStyles[alert.severity]} ${alert.isRead ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${(i + 1) * 80}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <p className="text-sm text-muted-foreground text-pretty">{alert.body}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{alert.createdAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
