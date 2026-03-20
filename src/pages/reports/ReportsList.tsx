import AppShell from '@/components/layout/AppShell';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { FileText, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockReports = [
  { id: '1', title: 'Relatório Semanal — 10 a 16 Mar', type: 'weekly', status: 'active' as const, date: '17/03/2026' },
  { id: '2', title: 'Relatório Mensal — Fevereiro 2026', type: 'monthly', status: 'active' as const, date: '01/03/2026' },
  { id: '3', title: 'Relatório Semanal — 17 a 20 Mar', type: 'weekly', status: 'warning' as const, date: '20/03/2026' },
];

const statusLabels: Record<string, string> = {
  active: 'Pronto',
  warning: 'Gerando...',
  error: 'Erro',
};

export default function ReportsList() {
  return (
    <AppShell title="Relatórios">
      <div className="p-5 lg:p-8 space-y-5 max-w-4xl">
        <div className="flex items-center justify-between animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Relatórios</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Relatórios gerados automaticamente com IA</p>
          </div>
          <Button className="active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            Novo relatório
          </Button>
        </div>

        {mockReports.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhum relatório" description="Relatórios serão gerados automaticamente" />
        ) : (
          <div className="space-y-2">
            {mockReports.map((report, i) => (
              <div
                key={report.id}
                className="card-surface p-4 flex items-center justify-between gap-4 animate-reveal-up"
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{report.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={report.status} />
                  {report.status === 'active' && (
                    <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors active:scale-95">
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
