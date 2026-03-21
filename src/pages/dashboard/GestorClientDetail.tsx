import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import MetricCard, { MetricCardSkeleton } from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import AlertBadge from '@/components/ui/AlertBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import { formatCurrency, formatROAS, formatNumber } from '@/lib/utils';
import { getCampaigns, syncMetrics, validateAndSaveMetaAccount } from '@/lib/metaApi';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  ArrowLeft, DollarSign, TrendingUp, Target, Eye,
  BarChart2, Sparkles, FileText, Bell, RefreshCw, Loader2, UserCircle,
  Plus, Shield, Eye as EyeIcon, EyeOff, ChevronDown, ExternalLink, AlertCircle, Trash2
} from 'lucide-react';

interface ClientMetaAccount {
  id: string;
  ad_account_id: string;
  account_name: string | null;
  access_token_encrypted: string;
  is_active: boolean | null;
  currency: string | null;
  token_expires_at: string | null;
}

export default function GestorClientDetail() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [syncing, setSyncing] = useState(false);
  const { alerts } = useAlerts();

  // Fetch client profile
  const { data: client } = useQuery({
    queryKey: ['client-profile', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, plan, plan_status, created_at')
        .eq('id', clientId)
        .single();
      return data;
    },
    enabled: !!clientId,
  });

  // Fetch meta accounts for this client
  const { data: accounts = [] } = useQuery({
    queryKey: ['client-meta-accounts', clientId],
    queryFn: async () => {
      if (!clientId || !user) return [];
      const { data } = await supabase
        .from('meta_accounts')
        .select('id, ad_account_id, account_name, access_token_encrypted, is_active, currency, token_expires_at')
        .eq('client_id', clientId)
        .eq('gestor_id', user.id)
        .eq('is_active', true);
      return (data || []) as ClientMetaAccount[];
    },
    enabled: !!clientId && !!user,
  });

  const accountIds = accounts.map(a => a.id);

  // Fetch metrics for all accounts of this client
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['client-metrics', clientId, period, accountIds],
    queryFn: async () => {
      if (!accountIds.length) return { current: emptyMetrics, trends: emptyTrends };
      const now = new Date();
      let start: string, end: string, prevStart: string;
      if (period === 'today') {
        start = end = now.toISOString().split('T')[0];
        const yesterday = new Date(now.getTime() - 86400000);
        prevStart = yesterday.toISOString().split('T')[0];
      } else if (period === 'week') {
        end = now.toISOString().split('T')[0];
        start = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        prevStart = new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0];
      } else {
        end = now.toISOString().split('T')[0];
        start = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
        prevStart = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0];
      }

      const [{ data: currData }, { data: prevData }] = await Promise.all([
        supabase.from('metrics_daily').select('*').in('meta_account_id', accountIds).gte('date', start).lte('date', end),
        supabase.from('metrics_daily').select('*').in('meta_account_id', accountIds).gte('date', prevStart).lt('date', start),
      ]);

      const current = aggregate(currData || []);
      const previous = aggregate(prevData || []);
      return { current, trends: calcTrends(current, previous) };
    },
    enabled: accountIds.length > 0,
  });

  const current = metricsData?.current || emptyMetrics;
  const trends = metricsData?.trends || emptyTrends;

  // Fetch campaigns from metrics_daily
  const { data: campaigns = [] } = useQuery({
    queryKey: ['client-campaigns', clientId, accountIds],
    queryFn: async () => {
      if (!accountIds.length) return [];
      const { data } = await supabase
        .from('metrics_daily')
        .select('campaign_id, meta_account_id, spend, impressions, clicks, leads, roas')
        .in('meta_account_id', accountIds)
        .not('campaign_id', 'is', null)
        .order('date', { ascending: false })
        .limit(200);
      
      // Group by campaign_id
      const map = new Map<string, { campaign_id: string; spend: number; impressions: number; clicks: number; leads: number; roas: number; count: number }>();
      (data || []).forEach(row => {
        const key = row.campaign_id!;
        const existing = map.get(key) || { campaign_id: key, spend: 0, impressions: 0, clicks: 0, leads: 0, roas: 0, count: 0 };
        existing.spend += Number(row.spend) || 0;
        existing.impressions += Number(row.impressions) || 0;
        existing.clicks += Number(row.clicks) || 0;
        existing.leads += Number(row.leads) || 0;
        existing.roas += Number(row.roas) || 0;
        existing.count++;
        map.set(key, existing);
      });

      return Array.from(map.values()).map(c => ({
        ...c,
        roas: c.count > 0 ? c.roas / c.count : 0,
      }));
    },
    enabled: accountIds.length > 0,
  });

  const clientAlerts = alerts.filter(a => a.client_id === clientId || accountIds.includes(a.meta_account_id || ''));

  const handleSyncCampaigns = useCallback(async () => {
    if (!accounts.length) {
      toast.error('Este cliente não tem contas Meta vinculadas. Adicione uma conta primeiro em Configurações > Meta.');
      return;
    }
    setSyncing(true);
    let totalSynced = 0;
    try {
      for (const acc of accounts) {
        await syncMetrics(acc.id, acc.ad_account_id, acc.access_token_encrypted);
        totalSynced++;
      }
      toast.success(`Campanhas sincronizadas! (${totalSynced} conta${totalSynced !== 1 ? 's' : ''})`);
      queryClient.invalidateQueries({ queryKey: ['client-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['client-campaigns'] });
    } catch {
      toast.error('Erro ao sincronizar. Verifique se o token Meta está válido.');
    } finally {
      setSyncing(false);
    }
  }, [accounts, queryClient]);

  return (
    <AppShell title={client?.full_name || 'Detalhes do Cliente'}>
      <div className="p-5 lg:p-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 animate-reveal-up">
          <Button variant="ghost" size="icon" onClick={() => navigate('/gestor/clientes')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
              {client?.full_name || client?.email || 'Carregando...'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{client?.email}</span>
              {accounts.length > 0 && (
                <StatusBadge status="active" />
              )}
              {accounts.length === 0 && (
                <span className="text-xs text-warning">Sem contas Meta</span>
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
        {metricsLoading ? (
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
            {campaigns.length === 0 ? (
              <div className="card-surface p-8 text-center space-y-4">
                <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {accounts.length === 0 ? 'Sem contas Meta vinculadas' : 'Sincronize as campanhas'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {accounts.length === 0
                      ? 'Adicione uma conta Meta Ads para este cliente em Configurações > Contas Meta.'
                      : 'Clique em sincronizar para buscar as campanhas desta conta no Meta Ads.'}
                  </p>
                </div>
                {accounts.length > 0 && (
                  <Button size="sm" onClick={handleSyncCampaigns} disabled={syncing} className="gap-1.5">
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {syncing ? 'Sincronizando...' : 'Sincronizar campanhas'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''}</span>
                  <Button size="sm" variant="outline" onClick={handleSyncCampaigns} disabled={syncing} className="gap-1.5 border-border">
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Sincronizar
                  </Button>
                </div>
                {campaigns.map((c, i) => (
                  <div key={c.campaign_id} className="card-surface p-4 animate-reveal-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <p className="text-sm font-semibold text-foreground truncate font-mono-metric">{c.campaign_id}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Gasto: {formatCurrency(c.spend)}</span>
                      <span>Clicks: {formatNumber(c.clicks)}</span>
                      <span>Leads: {c.leads}</span>
                      <span>ROAS: {formatROAS(c.roas)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                      stroke={current.roas >= 2 ? '#00D4AA' : current.roas >= 1 ? '#FFB800' : '#FF4757'}
                      strokeWidth="3" strokeDasharray={`${Math.min(100, (current.roas / 5) * 100)}, 100`} />
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
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <div className="card-surface p-8 text-center space-y-3">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Nenhum relatório</h3>
              <p className="text-xs text-muted-foreground">Relatórios desta conta aparecerão aqui quando gerados.</p>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            {clientAlerts.length === 0 ? (
              <div className="card-surface p-8 text-center space-y-3">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Nenhum alerta</h3>
                <p className="text-xs text-muted-foreground">Não há alertas para este cliente no momento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientAlerts.map(alert => (
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

// Helper functions
interface MetricsSummary {
  spend: number; impressions: number; clicks: number; reach: number;
  leads: number; roas: number; ctr: number;
}

const emptyMetrics: MetricsSummary = { spend: 0, impressions: 0, clicks: 0, reach: 0, leads: 0, roas: 0, ctr: 0 };
const emptyTrends = { spend: 0, leads: 0, roas: 0, impressions: 0 };

function aggregate(rows: any[]): MetricsSummary {
  if (!rows.length) return { ...emptyMetrics };
  const sum = (k: string) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const avg = (k: string) => { const v = rows.filter(r => r[k] != null); return v.length ? v.reduce((a: number, r: any) => a + Number(r[k]), 0) / v.length : 0; };
  const spend = sum('spend');
  return { spend, impressions: sum('impressions'), clicks: sum('clicks'), reach: sum('reach'), leads: sum('leads'), roas: spend > 0 ? sum('revenue') / spend : 0, ctr: avg('ctr') };
}

function calcTrends(c: MetricsSummary, p: MetricsSummary) {
  const t = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
  return { spend: t(c.spend, p.spend), leads: t(c.leads, p.leads), roas: t(c.roas, p.roas), impressions: t(c.impressions, p.impressions) };
}
