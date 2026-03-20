import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import MetricCard, { MetricCardSkeleton } from '@/components/ui/MetricCard';
import EmptyState from '@/components/ui/EmptyState';
import AlertBadge from '@/components/ui/AlertBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import { useGestorMetrics } from '@/hooks/useMetrics';
import { usePlan } from '@/hooks/usePlan';
import { formatCurrency, formatROAS, formatNumber, getGreeting, getInitials, daysUntil } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DollarSign, TrendingUp, Target, Users,
  Sparkles, FileText, UserPlus, Plus, Shield
} from 'lucide-react';

export default function GestorDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { alerts } = useAlerts();
  const { accountsWithScore, totals, loading, activeCount } = useGestorMetrics();
  const { isTrial, getDaysUntilExpiry, getMaxAccounts } = usePlan();
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved).slice(0, 5);

  const firstName = profile?.full_name?.split(' ')[0] || 'Gestor';
  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());

  const trialDays = getDaysUntilExpiry();
  const maxAccounts = getMaxAccounts();

  // ROAS color
  const roasColor = totals.roas >= 2.5 ? 'text-success' : totals.roas >= 1.5 ? 'text-warning' : 'text-danger';

  return (
    <AppShell title="Visão Geral">
      <div className="p-5 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ lineHeight: '1.2' }}>
            {getGreeting(firstName)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{today}</p>
        </div>

        {/* Trial banner */}
        {isTrial && trialDays !== null && trialDays > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20 animate-reveal-up" style={{ animationDelay: '60ms' }}>
            <span className="text-sm">🎯</span>
            <p className="text-sm text-foreground flex-1">
              Você está no trial — <span className="font-semibold">{trialDays} dias restantes</span>
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate('/settings/plano')} className="border-warning/30 text-warning hover:bg-warning/10">
              Fazer upgrade
            </Button>
          </div>
        )}

        {/* Metrics */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[1, 2, 3, 4].map(i => <MetricCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <MetricCard label="Gasto total" value={formatCurrency(totals.spend)} icon={DollarSign} delay={60} />
            <MetricCard label="ROAS médio" value={formatROAS(totals.roas)} icon={TrendingUp} delay={120} />
            <MetricCard label="Leads" value={formatNumber(totals.leads)} icon={Target} delay={180} />
            <MetricCard label="Contas ativas" value={`${activeCount} de ${maxAccounts}`} icon={Users} delay={240} />
          </div>
        )}

        {/* Unresolved alerts banner */}
        {unresolvedAlerts.length > 0 && (
          <div className="animate-reveal-up" style={{ animationDelay: '300ms' }}>
            <h3 className="text-sm font-semibold text-foreground mb-2">Alertas não resolvidos</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
              {unresolvedAlerts.map(alert => (
                <div key={alert.id} className="card-surface p-3 min-w-[260px] flex items-start gap-2.5 shrink-0">
                  <AlertBadge severity={alert.severity} className="mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{alert.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(alert.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accounts section */}
        <div className="animate-reveal-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Suas contas</h3>
            {!loading && accountsWithScore.length > 0 && (
              <div className="hidden lg:flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 border-border text-xs">
                  <Sparkles className="h-3 w-3" />Gerar análise IA
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-border text-xs">
                  <FileText className="h-3 w-3" />Novo relatório
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-border text-xs">
                  <UserPlus className="h-3 w-3" />Convidar cliente
                </Button>
              </div>
            )}
          </div>

          {!loading && accountsWithScore.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="Conecte sua primeira conta Meta Ads"
              description="Adicione uma conta de anúncio para começar a monitorar suas campanhas."
              actionLabel="Conectar conta"
              onAction={() => navigate('/settings/meta')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accountsWithScore.map((acc, i) => (
                <button
                  key={acc.id}
                  onClick={() => navigate(`/gestor/cliente/${acc.id}`)}
                  className="card-surface p-4 text-left transition-all hover:border-[rgba(255,255,255,0.12)] animate-reveal-up active:scale-[0.98]"
                  style={{ animationDelay: `${(i + 5) * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: acc.scoreColor + '30', color: acc.scoreColor }}
                    >
                      {getInitials(acc.client_name || acc.account_name || 'NA')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {acc.client_name || acc.account_name || acc.ad_account_id}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">{acc.ad_account_id}</p>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: acc.scoreColor + '18', color: acc.scoreColor }}
                    >
                      {acc.scoreLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Gasto</span>
                      <p className="font-mono-metric font-medium text-foreground">{formatCurrency(acc.metrics.spend)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ROAS</span>
                      <p className="font-mono-metric font-medium text-foreground">{formatROAS(acc.metrics.roas)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Leads</span>
                      <p className="font-mono-metric font-medium text-foreground">{acc.metrics.leads}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${acc.score}%`, backgroundColor: acc.scoreColor }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FAB mobile */}
        <button
          onClick={() => navigate('/settings/meta')}
          className="lg:hidden fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </AppShell>
  );
}
