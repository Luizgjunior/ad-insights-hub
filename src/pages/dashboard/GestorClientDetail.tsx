import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import MetricCard, { MetricCardSkeleton } from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import AlertBadge from '@/components/ui/AlertBadge';
import { useMetaAccount } from '@/hooks/useMetaAccounts';
import { useAccountMetrics } from '@/hooks/useMetrics';
import { useAlerts } from '@/hooks/useAlerts';
import { formatCurrency, formatROAS, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, DollarSign, TrendingUp, Target, Eye,
  BarChart2, Sparkles, FileText, Bell, RefreshCw, Loader2
} from 'lucide-react';

export default function GestorClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account, loading: accLoading } = useMetaAccount(id || '');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const { current, trends, loading: metricsLoading } = useAccountMetrics(id, period);
  const { alerts } = useAlerts();
  const accountAlerts = alerts.filter(a => a.meta_account_id === id);
  const loading = accLoading || metricsLoading;

  return (
    <AppShell title={account?.account_name || 'Detalhes da Conta'}>
      <div className="p-5 lg:p-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 animate-reveal-up">
          <Button variant="ghost" size="icon" onClick={() => navigate('/gestor')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
              {account?.account_name || account?.ad_account_id || 'Carregando...'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">{account?.ad_account_id}</span>
              {account?.is_active !== undefined && (
                <StatusBadge status={account.is_active ? 'active' : 'paused'} />
              )}
            </div>
          </div>
          <div className="flex gap-1">
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
                {p === 'today' ? 'Hoje' : p === 'week' ? '7 dias' : '30 dias'}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <MetricCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Gasto" value={formatCurrency(current.spend)} trend={trends.spend} trendLabel="vs anterior" icon={DollarSign} delay={60} />
            <MetricCard label="ROAS" value={formatROAS(current.roas)} trend={trends.roas} trendLabel="vs anterior" icon={TrendingUp} delay={120} />
            <MetricCard label="Leads" value={formatNumber(current.leads)} trend={trends.leads} trendLabel="vs anterior" icon={Target} delay={180} />
            <MetricCard label="Impressões" value={formatNumber(current.impressions)} trend={trends.impressions} trendLabel="vs anterior" icon={Eye} delay={240} />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="campaigns" className="animate-reveal-up" style={{ animationDelay: '300ms' }}>
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="campaigns" className="gap-1.5"><BarChart2 className="h-3.5 w-3.5" />Campanhas</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />IA & Sugestões</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Relatórios</TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-4">
            <EmptyState
              icon={BarChart2}
              title="Sincronize as campanhas"
              description="Clique em sincronizar para buscar as campanhas desta conta no Meta Ads."
              actionLabel="Sincronizar campanhas"
              onAction={() => {}}
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <div className="card-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Score da Conta</h3>
                <Button size="sm" variant="outline" className="gap-1.5 border-border">
                  <Sparkles className="h-3.5 w-3.5" />
                  Gerar nova análise
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    <path
                      d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={current.roas >= 2 ? '#00D4AA' : current.roas >= 1 ? '#FFB800' : '#FF4757'}
                      strokeWidth="3"
                      strokeDasharray={`${Math.min(100, (current.roas / 5) * 100)}, 100`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold font-mono-metric text-foreground">
                    {formatROAS(current.roas)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Gasto: {formatCurrency(current.spend)}</p>
                  <p>Leads: {current.leads}</p>
                  <p>CTR: {current.ctr.toFixed(2)}%</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Nenhuma análise de IA disponível ainda. Gere uma análise para receber insights personalizados.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <EmptyState
              icon={FileText}
              title="Nenhum relatório"
              description="Relatórios desta conta aparecerão aqui quando gerados."
              actionLabel="Gerar relatório semanal"
              onAction={() => {}}
            />
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            {accountAlerts.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Nenhum alerta"
                description="Não há alertas para esta conta no momento."
              />
            ) : (
              <div className="space-y-2">
                {accountAlerts.map(alert => (
                  <div key={alert.id} className="card-surface p-4 flex items-start gap-3">
                    <AlertBadge severity={alert.severity} className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                      {alert.body && <p className="text-xs text-muted-foreground mt-1">{alert.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
