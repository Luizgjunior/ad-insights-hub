import AppShell from '@/components/layout/AppShell';
import MetricCard from '@/components/ui/MetricCard';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, TrendingUp, Target, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const mockData = [
  { date: '14/03', spend: 120, leads: 14 },
  { date: '15/03', spend: 145, leads: 18 },
  { date: '16/03', spend: 130, leads: 12 },
  { date: '17/03', spend: 160, leads: 22 },
  { date: '18/03', spend: 155, leads: 19 },
  { date: '19/03', spend: 140, leads: 16 },
  { date: '20/03', spend: 135, leads: 20 },
];

export default function ClientDashboard() {
  const { profile } = useAuth();

  return (
    <AppShell title="Início">
      <div className="p-5 lg:p-8 space-y-6 max-w-5xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ lineHeight: '1.2' }}>
            Olá, {profile?.full_name?.split(' ')[0] || 'Cliente'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Resumo das suas campanhas</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Gasto total" value="R$ 985" trend={-3.1} icon={DollarSign} delay={60} />
          <MetricCard label="ROAS" value="2,8×" trend={5.4} icon={TrendingUp} delay={120} />
          <MetricCard label="Leads" value="121" trend={8.2} icon={Target} delay={180} />
          <MetricCard label="Impressões" value="89,2k" trend={2.1} icon={Eye} delay={240} />
        </div>

        <div className="card-surface p-5 animate-reveal-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Gasto e Leads (7 dias)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8888AA' }} stroke="transparent" />
                <YAxis tick={{ fontSize: 11, fill: '#8888AA' }} stroke="transparent" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F0F0F8',
                  }}
                />
                <Area type="monotone" dataKey="spend" stroke="#1877F2" fill="url(#gSpend)" strokeWidth={2} name="Gasto" />
                <Area type="monotone" dataKey="leads" stroke="#00D4AA" fill="url(#gRevenue)" strokeWidth={2} name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
