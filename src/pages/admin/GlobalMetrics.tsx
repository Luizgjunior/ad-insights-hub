import AppShell from '@/components/layout/AppShell';
import MetricCard from '@/components/ui/MetricCard';
import { Globe, Users, DollarSign, Server, TrendingUp } from 'lucide-react';

export default function GlobalMetrics() {
  return (
    <AppShell title="Métricas Globais">
      <div className="p-5 lg:p-8 space-y-6 max-w-7xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Métricas Globais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão consolidada de toda a plataforma</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <MetricCard label="Total gestores" value="24" trend={12.5} icon={Users} delay={60} />
          <MetricCard label="Contas Meta" value="87" trend={8.3} icon={Globe} delay={120} />
          <MetricCard label="MRR total" value="R$ 8.740" trend={15.2} icon={DollarSign} delay={180} />
          <MetricCard label="Gasto ads total" value="R$ 124k" trend={6.7} icon={TrendingUp} delay={240} />
        </div>
      </div>
    </AppShell>
  );
}
