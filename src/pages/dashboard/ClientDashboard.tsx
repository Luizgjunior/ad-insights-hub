import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import MetricCard, { MetricCardSkeleton } from '@/components/ui/MetricCard';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useAccountMetrics } from '@/hooks/useMetrics';
import { formatCurrency, formatROAS, formatNumber, getGreeting } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Target, Calculator, Sparkles, BarChart2 } from 'lucide-react';

const PERIOD_KEY = 'metaflux_client_period';

export default function ClientDashboard() {
  const { profile } = useAuth();
  const { accounts, loading: accLoading } = useMetaAccounts();
  const myAccount = accounts[0];
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>(() =>
    (localStorage.getItem(PERIOD_KEY) as any) || 'week'
  );
  const { current, trends, loading: metricsLoading } = useAccountMetrics(myAccount?.id, period);
  const loading = accLoading || metricsLoading;

  // Gestor branding
  const [gestorBrand, setGestorBrand] = useState<{ name?: string; logo?: string }>({});
  useEffect(() => {
    if (!profile?.gestor_id) return;
    supabase.from('profiles').select('white_label_brand_name, white_label_logo_url').eq('id', profile.gestor_id).single()
      .then(({ data }) => {
        if (data) setGestorBrand({ name: data.white_label_brand_name || undefined, logo: data.white_label_logo_url || undefined });
      });
  }, [profile?.gestor_id]);

  useEffect(() => { localStorage.setItem(PERIOD_KEY, period); }, [period]);

  const firstName = profile?.full_name?.split(' ')[0] || 'Cliente';
  const cpl = current.leads > 0 ? current.spend / current.leads : 0;

  if (!accLoading && !myAccount) {
    return (
      <AppShell title="Início">
        <div className="p-5 lg:p-8 max-w-5xl">
          <EmptyState
            icon={BarChart2}
            title="Conta em configuração"
            description="Seu gestor está configurando sua conta. Em breve você verá seus dados aqui."
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Início">
      <div className="p-5 lg:p-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ lineHeight: '1.2' }}>
              {getGreeting(firstName)}
            </h1>
            {gestorBrand.name && (
              <p className="text-sm text-muted-foreground mt-0.5">Gerenciado por {gestorBrand.name}</p>
            )}
          </div>
          {gestorBrand.logo && (
            <img src={gestorBrand.logo} alt="" className="h-8 w-auto rounded" />
          )}
        </div>

        {/* Period selector */}
        <div className="flex gap-1 animate-reveal-up" style={{ animationDelay: '60ms' }}>
          {(['today', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? 'Esta semana' : 'Este mês'}
            </button>
          ))}
        </div>

        {/* Metrics - business language */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <MetricCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Investimento" value={formatCurrency(current.spend)} trend={trends.spend} trendLabel="vs anterior" icon={DollarSign} delay={120} />
            <MetricCard label="Retorno" value={`${formatROAS(current.roas)} por real`} trend={trends.roas} trendLabel="vs anterior" icon={TrendingUp} delay={180} />
            <MetricCard label="Contatos gerados" value={`${current.leads} pessoas`} trend={trends.leads} trendLabel="vs anterior" icon={Target} delay={240} />
            <MetricCard label="Custo por contato" value={formatCurrency(cpl)} icon={Calculator} delay={300} />
          </div>
        )}

        {/* AI Card */}
        <div className="card-surface p-5 border-primary/30 bg-primary/5 animate-reveal-up" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <h3 className="text-sm font-semibold text-foreground">Análise Inteligente</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {current.spend > 0
              ? `Suas campanhas investiram ${formatCurrency(current.spend)} e geraram ${current.leads} contatos no período. O retorno sobre investimento está em ${formatROAS(current.roas)}.`
              : 'Aguardando dados das campanhas para gerar insights personalizados.'}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
