import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import MetricCard from '@/components/MetricCard';
import { DollarSign, Eye, MousePointerClick, Target, Users, TrendingUp, ShoppingCart, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { date: '14/03', spend: 320, revenue: 890, roas: 2.78 },
  { date: '15/03', spend: 410, revenue: 1240, roas: 3.02 },
  { date: '16/03', spend: 380, revenue: 1100, roas: 2.89 },
  { date: '17/03', spend: 450, revenue: 1450, roas: 3.22 },
  { date: '18/03', spend: 520, revenue: 1680, roas: 3.23 },
  { date: '19/03', spend: 480, revenue: 1520, roas: 3.17 },
  { date: '20/03', spend: 390, revenue: 1350, roas: 3.46 },
];

const mockAlerts = [
  { id: 1, title: 'ROAS caiu 25% na campanha "Leads Março"', severity: 'critical' as const, time: '2h atrás' },
  { id: 2, title: 'Frequência alta no conjunto "Retargeting Site"', severity: 'warning' as const, time: '4h atrás' },
  { id: 3, title: 'Token de acesso expira em 3 dias', severity: 'info' as const, time: '6h atrás' },
];

const severityStyles = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-info/10 text-info border-info/20',
};

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold tracking-tight text-balance" style={{ lineHeight: '1.2' }}>
            Olá, {profile?.full_name?.split(' ')[0] || 'Gestor'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das suas campanhas — 20 de março, 2026
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Gasto total" value="R$ 2.950" change={-4.2} icon={DollarSign} delay={60} />
          <MetricCard title="Receita" value="R$ 9.230" change={12.5} icon={ShoppingCart} delay={120} />
          <MetricCard title="ROAS" value="3.13x" change={8.1} icon={TrendingUp} delay={180} />
          <MetricCard title="Leads" value="147" change={-2.3} icon={Target} delay={240} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Impressões" value="284.5k" change={5.7} icon={Eye} delay={300} />
          <MetricCard title="Cliques" value="8.421" change={3.2} icon={MousePointerClick} delay={360} />
          <MetricCard title="Alcance" value="198.2k" change={7.4} icon={Users} delay={420} />
          <MetricCard title="Campanhas ativas" value="12" icon={Megaphone} delay={480} />
        </div>

        {/* Chart + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 animate-reveal-up" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Gasto vs Receita (7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <defs>
                      <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(220 70% 45%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(220 70% 45%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160 60% 40%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(160 60% 40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(220 15% 90%)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '13px',
                      }}
                    />
                    <Area type="monotone" dataKey="spend" stroke="hsl(220 70% 45%)" fill="url(#gradSpend)" strokeWidth={2} name="Gasto" />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(160 60% 40%)" fill="url(#gradRevenue)" strokeWidth={2} name="Receita" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-reveal-up" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Alertas recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-3 text-sm ${severityStyles[alert.severity]}`}
                >
                  <p className="font-medium leading-snug">{alert.title}</p>
                  <p className="text-xs mt-1 opacity-70">{alert.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
