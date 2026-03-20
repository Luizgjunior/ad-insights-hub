import AppShell from '@/components/layout/AppShell';
import MetricCard from '@/components/ui/MetricCard';
import { Globe, Users, DollarSign, Server } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <AppShell title="Overview">
      <div className="p-5 lg:p-8 space-y-6 max-w-7xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ lineHeight: '1.2' }}>
            Painel Admin Global
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Métricas globais da plataforma</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <MetricCard label="Gestores ativos" value="24" trend={12.5} icon={Users} delay={60} />
          <MetricCard label="Contas Meta" value="87" trend={8.3} icon={Globe} delay={120} />
          <MetricCard label="MRR" value="R$ 8.740" trend={15.2} icon={DollarSign} delay={180} />
          <MetricCard label="API calls/mês" value="142k" trend={-3.1} icon={Server} delay={240} />
        </div>
      </div>
    </AppShell>
  );
}
