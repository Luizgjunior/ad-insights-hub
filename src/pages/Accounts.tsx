import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink } from 'lucide-react';

const mockAccounts = [
  { id: '1', name: 'Loja Premium', adAccountId: 'act_123456', currency: 'BRL', isActive: true, spend30d: 'R$ 12.450' },
  { id: '2', name: 'Clínica Saúde+', adAccountId: 'act_789012', currency: 'BRL', isActive: true, spend30d: 'R$ 8.200' },
  { id: '3', name: 'EduTech Brasil', adAccountId: 'act_345678', currency: 'BRL', isActive: false, spend30d: 'R$ 0' },
];

export default function Accounts() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contas Meta</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas contas de anúncio conectadas</p>
          </div>
          <Button className="active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            Nova conta
          </Button>
        </div>

        <div className="space-y-3">
          {mockAccounts.map((acc, i) => (
            <Card key={acc.id} className="animate-reveal-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className={`h-2.5 w-2.5 rounded-full ${acc.isActive ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                  <div>
                    <p className="font-semibold">{acc.name}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">{acc.adAccountId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Gasto 30d</p>
                    <p className="font-semibold tabular-nums">{acc.spend30d}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="active:scale-[0.96]">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
