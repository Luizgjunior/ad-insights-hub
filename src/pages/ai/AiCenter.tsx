import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useAiAnalysis } from '@/hooks/useAiAnalysis';
import AiInsightCard from '@/components/ui/AiInsightCard';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import type { AiAnalysis } from '@/types';
import {
  Sparkles, Lightbulb, Clock, Loader2, Zap, ChevronDown,
  TrendingUp, Eye, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Tab = 'analyses' | 'suggestions' | 'history';

export default function AiCenter() {
  const { profile } = useAuth();
  const { accounts } = useMetaAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('analyses');
  const [history, setHistory] = useState<AiAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewAnalysis, setViewAnalysis] = useState<AiAnalysis | null>(null);

  // Set first account as default
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  const { analysis, loading, fetchLatestAnalysis, runDailyAnalysis, runWeeklyAnalysis, canGenerateAnalysis } =
    useAiAnalysis(selectedAccountId);

  // Fetch latest when account changes
  useEffect(() => {
    if (selectedAccountId) {
      fetchLatestAnalysis();
    }
  }, [selectedAccountId]);

  // Fetch history
  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'suggestions') {
      loadHistory();
    }
  }, [activeTab, selectedAccountId]);

  async function loadHistory() {
    setHistoryLoading(true);
    let query = supabase
      .from('ai_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (selectedAccountId) {
      query = query.eq('meta_account_id', selectedAccountId);
    }

    const { data } = await query;
    if (data) {
      setHistory(data.map(d => ({
        id: d.id,
        meta_account_id: d.meta_account_id || '',
        analysis_type: d.analysis_type as AiAnalysis['analysis_type'],
        model_used: d.model_used || undefined,
        period_start: d.period_start || undefined,
        period_end: d.period_end || undefined,
        insights: d.insights as AiAnalysis['insights'],
        summary_text: d.summary_text || undefined,
        cost_usd: d.cost_usd || undefined,
        created_at: d.created_at || '',
      })));
    }
    setHistoryLoading(false);
  }

  async function handleRunAnalysis(type: 'daily' | 'weekly') {
    if (!selectedAccountId) return;
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    const metrics = {
      accountName: account.account_name || account.ad_account_id,
      adAccountId: account.ad_account_id,
      period: type === 'daily' ? 'Hoje' : 'Últimos 7 dias',
      spend: 0,
      leads: 0,
      roas: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      frequency: 0,
      impressions: 0,
      clicks: 0,
      clientId: account.client_id,
    };

    // Try to get real metrics
    const now = new Date();
    const start = new Date();
    if (type === 'weekly') start.setDate(now.getDate() - 7);

    const { data: metricsData } = await supabase
      .from('metrics_daily')
      .select('*')
      .eq('meta_account_id', selectedAccountId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', now.toISOString().split('T')[0]);

    if (metricsData && metricsData.length > 0) {
      metrics.spend = metricsData.reduce((s, m) => s + (m.spend || 0), 0);
      metrics.leads = metricsData.reduce((s, m) => s + (m.leads || 0), 0);
      metrics.impressions = metricsData.reduce((s, m) => s + (m.impressions || 0), 0);
      metrics.clicks = metricsData.reduce((s, m) => s + (m.clicks || 0), 0);
      metrics.roas = metrics.spend > 0
        ? metricsData.reduce((s, m) => s + (m.revenue || 0), 0) / metrics.spend
        : 0;
      metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
      metrics.cpc = metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0;
      metrics.cpm = metrics.impressions > 0 ? (metrics.spend / metrics.impressions) * 1000 : 0;
      const freqs = metricsData.filter(m => (m.frequency || 0) > 0);
      metrics.frequency = freqs.length > 0 ? freqs.reduce((s, m) => s + (m.frequency || 0), 0) / freqs.length : 0;
    }

    if (type === 'daily') {
      await runDailyAnalysis(metrics);
    } else {
      await runWeeklyAnalysis(metrics);
    }
  }

  // Collect all suggestions from history
  const allSuggestions = history.flatMap(a => {
    const ins = (a.insights as any) || {};
    const sug: string[] = ins.suggestions || [];
    return sug.map(s => ({
      text: s,
      accountId: a.meta_account_id,
      date: a.created_at,
      analysisId: a.id,
    }));
  });

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'analyses', label: 'Análises', icon: TrendingUp },
    { key: 'suggestions', label: 'Sugestões', icon: Lightbulb },
    { key: 'history', label: 'Histórico', icon: Clock },
  ];

  return (
    <AppShell title="Inteligência IA">
      <div className="p-4 lg:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Inteligência IA</h1>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Beta</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">
                {profile?.ai_credits_remaining ?? 0} créditos restantes
              </span>
            </div>
          </div>
        </div>

        {/* Account selector */}
        {accounts.length > 0 && (
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-full sm:w-72 bg-card border-border">
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.account_name || a.ad_account_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-card rounded-lg p-1 w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'analyses' && (
          <div className="space-y-4">
            {accounts.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Nenhuma conta conectada"
                description="Conecte uma conta Meta Ads para gerar análises com IA."
              />
            ) : (
              <>
                {analysis ? (
                  <AiInsightCard analysis={analysis} />
                ) : (
                  <div className="card-surface p-8 text-center">
                    <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma análise gerada ainda para esta conta.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique em um dos botões abaixo para gerar.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleRunAnalysis('daily')}
                    disabled={loading || !canGenerateAnalysis()}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analisando campanhas...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar análise diária
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRunAnalysis('weekly')}
                    disabled={loading || !canGenerateAnalysis()}
                    variant="outline"
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analisando campanhas...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Gerar análise semanal
                      </>
                    )}
                  </Button>
                </div>

                {!canGenerateAnalysis() && (
                  <p className="text-xs text-danger text-center">
                    Créditos insuficientes. Faça upgrade do seu plano para continuar.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            {allSuggestions.length === 0 ? (
              <EmptyState
                icon={Lightbulb}
                title="Nenhuma sugestão ainda"
                description="Gere análises para receber sugestões personalizadas."
              />
            ) : (
              allSuggestions.map((s, i) => (
                <div key={i} className="card-surface p-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 shrink-0">
                    <Lightbulb className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{s.text}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      {s.date ? new Date(s.date).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Sem histórico"
                description="Análises geradas aparecerão aqui."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">Data</th>
                      <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">Tipo</th>
                      <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">Score</th>
                      <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">Modelo</th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(a => {
                      const score = (a.insights as any)?.score ?? '—';
                      return (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                          <td className="text-sm text-foreground py-2.5 px-3 font-mono">
                            {a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="text-[10px]">
                              {a.analysis_type === 'daily' ? 'Diária' : a.analysis_type === 'weekly' ? 'Semanal' : a.analysis_type}
                            </Badge>
                          </td>
                          <td className="text-sm font-mono text-foreground py-2.5 px-3">{score}</td>
                          <td className="text-xs text-muted-foreground py-2.5 px-3">{a.model_used || '—'}</td>
                          <td className="text-right py-2.5 px-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewAnalysis(a)}
                              className="h-7 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View analysis modal */}
      <Dialog open={!!viewAnalysis} onOpenChange={() => setViewAnalysis(null)}>
        <DialogContent className="max-w-lg bg-surface border-border">
          <DialogHeader>
            <DialogTitle>Detalhes da Análise</DialogTitle>
          </DialogHeader>
          {viewAnalysis && <AiInsightCard analysis={viewAnalysis} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
