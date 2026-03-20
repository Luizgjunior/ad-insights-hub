import AppShell from '@/components/layout/AppShell';
import MetricCard, { MetricCardSkeleton } from '@/components/ui/MetricCard';
import { useAuth } from '@/contexts/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import AlertBadge from '@/components/ui/AlertBadge';
import {
  DollarSign, Eye, MousePointerClick, Target,
  Users, TrendingUp, ShoppingCart, Megaphone, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { date: '14/03', spend: 320, revenue: 890 },
  { date: '15/03', spend: 410, revenue: 1240 },
  { date: '16/03', spend: 380, revenue: 1100 },
  { date: '17/03', spend: 450, revenue: 1450 },
  { date: '18/03', spend: 520, revenue: 1680 },
  { date: '19/03', spend: 480, revenue: 1520 },
  { date: '20/03', spend: 390, revenue: 1350 },
];

const mockInsights = [
  { id: 1, text: 'ROAS da campanha "Leads" caiu 25%. Considere pausar os anúncios com CTR abaixo de 0.8%.', type: 'alert' as const },
  { id: 2, text: 'O criativo de vídeo 15s supera o carrossel em 40% de CTR. Replique o formato nos outros conjuntos.', type: 'suggestion' as const },
  { id: 3, text: 'Budget da campanha "Conversão" será esgotado em 2 dias no ritmo atual.', type: 'alert' as const },
];

export default function GestorDashboard() {
  const { profile } = useAuth();
  const { alerts } = useAlerts();
  const recentAlerts = alerts.slice(0, 3);

  return (
    <AppShell title="Visão Geral">
      <div className="p-5 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ lineHeight: '1.2' }}>
            Olá, {profile?.full_name?.split(' ')[0] || 'Gestor'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral das suas campanhas — 20 de março, 2026
          </p>
        </div>

        {/* Metrics row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <MetricCard label="Gasto total" value="R$ 2.950" trend={-4.2} trendLabel="vs ontem" icon={DollarSign} delay={60} />
          <MetricCard label="Receita" value="R$ 9.230" trend={12.5} trendLabel="vs ontem" icon={ShoppingCart} delay={120} />
          <MetricCard label="ROAS" value="3,13×" trend={8.1} trendLabel="vs ontem" icon={TrendingUp} delay={180} />
          <MetricCard label="Leads" value="147" trend={-2.3} trendLabel="vs ontem" icon={Target} delay={240} />
        </div>

        {/* Metrics row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <MetricCard label="Impressões" value="284,5k" trend={5.7} icon={Eye} delay={300} />
          <MetricCard label="Cliques" value="8.421" trend={3.2} icon={MousePointerClick} delay={360} />
          <MetricCard label="Alcance" value="198,2k" trend={7.4} icon={Users} delay={420} />
          <MetricCard label="Campanhas ativas" value="12" icon={Megaphone} delay={480} />
        </div>

        {/* Chart + AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          <div className="lg:col-span-3 card-surface p-5 animate-reveal-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Gasto vs Receita (7 dias)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1877F2" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8888AA' }} stroke="transparent" />
                  <YAxis tick={{ fontSize: 11, fill: '#8888AA' }} stroke="transparent" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1A24',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                      fontSize: '12px',
                      color: '#F0F0F8',
                    }}
                  />
                  <Area type="monotone" dataKey="spend" stroke="#1877F2" fill="url(#gSpend)" strokeWidth={2} name="Gasto" />
                  <Area type="monotone" dataKey="revenue" stroke="#00D4AA" fill="url(#gRevenue)" strokeWidth={2} name="Receita" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 card-surface p-5 animate-reveal-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Insights da IA</h3>
            </div>
            <div className="space-y-3">
              {mockInsights.map(insight => (
                <div key={insight.id} className="p-3 rounded-lg bg-background border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <div className="card-surface p-5 animate-reveal-up" style={{ animationDelay: '600ms' }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Alertas recentes</h3>
            <div className="space-y-2">
              {recentAlerts.map(alert => (
                <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                  <AlertBadge severity={alert.severity} />
                  <p className="text-sm text-foreground flex-1">{alert.title}</p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
