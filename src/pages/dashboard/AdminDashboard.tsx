import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import MetricCard, { MetricCardSkeleton } from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Globe, Users, DollarSign, Server, Sparkles, CreditCard,
  Building2, Search, AlertTriangle
} from 'lucide-react';

interface PlatformStats {
  mrr: number;
  gestoresAtivos: number;
  emTrial: number;
  contasMeta: number;
  aiAnalyses: number;
  apiCostBrl: number;
  starterCount: number;
  proCount: number;
  agencyCount: number;
  starterMrr: number;
  proMrr: number;
  agencyMrr: number;
}

interface TenantRow {
  id: string;
  full_name: string | null;
  email: string;
  plan: string | null;
  plan_status: string | null;
  created_at: string | null;
  accountCount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Fetch gestores
      const { data: gestores } = await supabase
        .from('profiles')
        .select('id, full_name, email, plan, plan_status, created_at')
        .eq('role', 'admin_gestor');

      const all = gestores || [];
      const active = all.filter(g => g.plan_status === 'active');
      const trial = all.filter(g => g.plan_status === 'trial');

      const planPrices: Record<string, number> = { starter: 97, pro: 197, agency: 397 };
      const starterG = active.filter(g => g.plan === 'starter');
      const proG = active.filter(g => g.plan === 'pro');
      const agencyG = active.filter(g => g.plan === 'agency');

      const mrr = active.reduce((s, g) => s + (planPrices[g.plan || ''] || 0), 0);

      // Meta accounts count
      const { count: metaCount } = await supabase
        .from('meta_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      // AI analyses this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: aiCount } = await supabase
        .from('ai_analyses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth);

      // API cost
      const monthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const { data: usage } = await supabase
        .from('api_usage')
        .select('claude_cost_usd')
        .eq('month_year', monthYear);
      const totalCostUsd = (usage || []).reduce((s, r) => s + (Number(r.claude_cost_usd) || 0), 0);

      setStats({
        mrr,
        gestoresAtivos: active.length,
        emTrial: trial.length,
        contasMeta: metaCount || 0,
        aiAnalyses: aiCount || 0,
        apiCostBrl: totalCostUsd * 5.8,
        starterCount: starterG.length,
        proCount: proG.length,
        agencyCount: agencyG.length,
        starterMrr: starterG.length * 97,
        proMrr: proG.length * 197,
        agencyMrr: agencyG.length * 397,
      });

      // Fetch account counts per gestor
      const { data: accounts } = await supabase
        .from('meta_accounts')
        .select('gestor_id')
        .eq('is_active', true);
      const accMap = new Map<string, number>();
      (accounts || []).forEach(a => accMap.set(a.gestor_id, (accMap.get(a.gestor_id) || 0) + 1));

      setTenants(all.map(g => ({
        id: g.id,
        full_name: g.full_name,
        email: g.email,
        plan: g.plan,
        plan_status: g.plan_status,
        created_at: g.created_at,
        accountCount: accMap.get(g.id) || 0,
      })));

      setLoading(false);
    })();
  }, []);

  const filtered = tenants.filter(t =>
    (t.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const statusMap = (s: string | null): 'active' | 'trial' | 'paused' => {
    if (s === 'active') return 'active';
    if (s === 'trial') return 'trial';
    return 'paused';
  };

  return (
    <AppShell title="Overview">
      <div className="p-5 lg:p-8 space-y-6 max-w-7xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ lineHeight: '1.2' }}>
            Painel Admin Global
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Métricas globais da plataforma</p>
        </div>

        {/* 6 metrics */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <MetricCardSkeleton key={i} />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            <MetricCard label="MRR" value={formatCurrency(stats.mrr)} icon={DollarSign} delay={60} />
            <MetricCard label="Gestores ativos" value={String(stats.gestoresAtivos)} icon={Users} delay={120} />
            <MetricCard label="Em trial" value={String(stats.emTrial)} icon={CreditCard} delay={180} />
            <MetricCard label="Contas Meta" value={String(stats.contasMeta)} icon={Globe} delay={240} />
            <MetricCard label="Análises IA este mês" value={String(stats.aiAnalyses)} icon={Sparkles} delay={300} />
            <MetricCard label="Custo API" value={formatCurrency(stats.apiCostBrl)} icon={Server} delay={360} />
          </div>
        )}

        {/* API cost warning */}
        {stats && stats.apiCostBrl > 580 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20 animate-reveal-up" style={{ animationDelay: '400ms' }}>
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm text-foreground">
              Custo API acima de R$ 580 este mês ({formatCurrency(stats.apiCostBrl)})
            </p>
          </div>
        )}

        {/* Plan distribution */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-reveal-up" style={{ animationDelay: '450ms' }}>
            {[
              { label: 'Starter', count: stats.starterCount, mrr: stats.starterMrr, color: 'text-muted-foreground' },
              { label: 'Pro', count: stats.proCount, mrr: stats.proMrr, color: 'text-primary' },
              { label: 'Agency', count: stats.agencyCount, mrr: stats.agencyMrr, color: 'text-success' },
            ].map(p => (
              <div key={p.label} className="card-surface p-4">
                <p className={`text-sm font-semibold ${p.color}`}>{p.label}</p>
                <p className="text-2xl font-bold font-mono-metric text-foreground mt-1">{p.count}</p>
                <p className="text-xs text-muted-foreground">MRR: {formatCurrency(p.mrr)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tenant list */}
        <div className="animate-reveal-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Tenants</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 h-8 bg-background border-border text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            {filtered.map((t, i) => (
              <div key={t.id} className="card-surface p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground uppercase">Plano</p>
                    <p className="text-sm font-medium text-foreground capitalize">{t.plan || 'trial'}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground uppercase">Contas</p>
                    <p className="text-sm font-mono-metric font-medium text-foreground">{t.accountCount}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] text-muted-foreground uppercase">Criado em</p>
                    <p className="text-xs text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  <StatusBadge status={statusMap(t.plan_status)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
