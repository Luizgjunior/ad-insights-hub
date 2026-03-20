import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockReports = [
  { id: '1', title: 'Relatório Semanal — 10 a 16 Mar', type: 'weekly', status: 'ready', createdAt: '17/03/2026' },
  { id: '2', title: 'Relatório Mensal — Fevereiro 2026', type: 'monthly', status: 'ready', createdAt: '01/03/2026' },
  { id: '3', title: 'Relatório Semanal — 17 a 20 Mar', type: 'weekly', status: 'generating', createdAt: '20/03/2026' },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  ready: { label: 'Pronto', variant: 'default' },
  generating: { label: 'Gerando...', variant: 'secondary' },
  error: { label: 'Erro', variant: 'destructive' },
};

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground mt-1">Relatórios gerados automaticamente com IA</p>
          </div>
          <Button className="active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            Novo relatório
          </Button>
        </div>

        <div className="space-y-3">
          {mockReports.map((report, i) => (
            <Card key={report.id} className="animate-reveal-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{report.title}</p>
                    <p className="text-sm text-muted-foreground">{report.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusMap[report.status].variant}>
                    {statusMap[report.status].label}
                  </Badge>
                  {report.status === 'ready' && (
                    <Button variant="ghost" size="icon" className="active:scale-[0.96]">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
