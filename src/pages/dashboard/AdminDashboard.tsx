import { useEffect, useState } from 'react';
import {
  Users, Building2, DollarSign, Zap,
  TrendingUp, AlertCircle, Activity, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import MetricCard, { MetricCardSkeleton } from '@/components/ui/MetricCard';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { PLAN_CONFIGS } from '@/types';

interface PlatformStats {
  totalGestores: number;
  gestoresAtivos: number;
  gestoresTrial: number;
  gestoresCancelados: number;
  totalContas: number;
  totalAnalises: number;
  custoApiUsd: number;
  planCounts: { starter: number; pro: number; agency: number };
  mrr: number;
  arr: number;
  newThisMonth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const USD_TO_BRL = 5.8;

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('plan, plan_status, created_at')
      .eq('role', 'admin_gestor');

    const all = profiles || [];
    const gestoresAtivos = all.filter(p => p.plan_status === 'active').length;
    const gestoresTrial = all.filter(p => p.plan_status === 'trial').length;
    const gestoresCancelados = all.filter(p => p.plan_status === 'cancelled').length;

    const planCounts = {
      starter: all.filter(p => p.plan === 'starter' && p.plan_status === 'active').length,
      pro: all.filter(p => p.plan === 'pro' && p.plan_status === 'active').length,
      agency: all.filter(p => p.plan === 'agency' && p.plan_status === 'active').length,
    };
    const mrr =
      planCounts.starter * PLAN_CONFIGS.starter.price +
      planCounts.pro * PLAN_CONFIGS.pro.price +
      planCounts.agency * PLAN_CONFIGS.agency.price;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const newThisMonth = all.filter(p => p.created_at && p.created_at >= startOfMonth).length;

    const { count: totalContas } = await supabase
      .from('meta_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalAnalises } = await supabase
      .from('ai_analyses')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    const monthYear = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase
      .from('api_usage')
      .select('claude_cost_usd')
      .eq('month_year', monthYear);
    const custoApiUsd = (usageData || []).reduce((sum, r) => sum + (Number(r.claude_cost_usd) || 0), 0);

    setStats({
      totalGestores: all.length,
      gestoresAtivos,
      gestoresTrial,
      gestoresCancelados,
      totalContas: totalContas || 0,
      totalAnalises: totalAnalises || 0,
      custoApiUsd,
      planCounts,
      mrr,
      arr: mrr * 12,
      newThisMonth,
    });

    setLoading(false);
  }

  const s = stats;

  return (
    <AppShell title="Admin Global">
      <div className="p-5 lg:p-8 space-y-6 max-w-[1100px] mx-auto">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Global</h1>
          <p className="text-sm text-muted-foreground mt-1">Métricas e controle da plataforma</p>
        </div>

        {/* Cost alert */}
        {s && s.custoApiUsd > 100 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20 animate-reveal-up">
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm text-foreground">
              <strong className="text-warning">Atenção:</strong> Custo Claude API este mês atingiu ${s.custoApiUsd.toFixed(2)} (R$ {(s.custoApiUsd * USD_TO_BRL).toFixed(2)}).
            </p>
          </div>
        )}

        {/* Row 1 */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <MetricCardSkeleton key={i} />)}
          </div>
        ) : s && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="MRR" value={formatCurrency(s.mrr)} icon={DollarSign} delay={60} />
            <MetricCard label="ARR projetado" value={formatCurrency(s.arr)} icon={TrendingUp} delay={120} />
            <MetricCard label="Gestores ativos" value={formatNumber(s.gestoresAtivos)} icon={Users} delay={180} />
            <MetricCard label="Em trial" value={formatNumber(s.gestoresTrial)} icon={Activity} delay={240} />
          </div>
        )}

        {/* Row 2 */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <MetricCardSkeleton key={i} />)}
          </div>
        ) : s && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Contas Meta" value={formatNumber(s.totalContas)} icon={Zap} delay={300} />
            <MetricCard label="Análises IA / mês" value={formatNumber(s.totalAnalises)} icon={Activity} delay={360} />
            <MetricCard label="Custo API (R$)" value={formatCurrency(s.custoApiUsd * USD_TO_BRL)} icon={CreditCard} delay={420} />
            <MetricCard label="Novos este mês" value={formatNumber(s.newThisMonth)} icon={Building2} delay={480} />
          </div>
        )}

        {/* Plan distribution */}
        {s && (
          <div className="animate-reveal-up" style={{ animationDelay: '500ms' }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Distribuição de planos</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['starter', 'pro', 'agency'] as const).map(plan => {
                const count = s.planCounts[plan];
                const revenue = count * PLAN_CONFIGS[plan].price;
                const borderColors = { starter: 'border-t-success', pro: 'border-t-primary', agency: 'border-t-warning' };
                const textColors = { starter: 'text-success', pro: 'text-primary', agency: 'text-warning' };
                return (
                  <div key={plan} className={`card-surface p-4 border-t-[3px] ${borderColors[plan]}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${textColors[plan]}`}>
                      {PLAN_CONFIGS[plan].name}
                    </p>
                    <p className="text-3xl font-bold font-mono-metric text-foreground mt-2">
                      {loading ? '—' : count}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(revenue)} MRR
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      R$ {PLAN_CONFIGS[plan].price}/gestor
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-reveal-up" style={{ animationDelay: '550ms' }}>
          {[
            { label: 'Ver todos os tenants', href: '/admin/tenants', icon: Building2 },
            { label: 'Custo por gestor', href: '/admin/custos', icon: CreditCard },
            { label: 'Logs de alertas', href: '/admin/logs', icon: Activity },
          ].map(action => (
            <button
              key={action.href}
              onClick={() => navigate(action.href)}
              className="flex items-center gap-3 p-3 card-surface text-sm font-medium text-foreground hover:border-border-hover transition-all"
            >
              <action.icon className="h-4 w-4 text-primary shrink-0" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
