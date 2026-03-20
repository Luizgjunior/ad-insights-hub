import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useReports } from '@/hooks/useReports';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ReportData } from '@/lib/reportEngine';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import PlanGate from '@/components/ui/PlanGate';
import { Loader2, FileText, Zap } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAccountId?: string;
  onGenerated?: (reportId: string) => void;
}

type ReportType = 'weekly' | 'monthly' | 'custom';

export default function GenerateReportModal({ open, onOpenChange, preselectedAccountId, onGenerated }: Props) {
  const { profile } = useAuth();
  const { accounts } = useMetaAccounts();
  const { generateReport } = useReports();
  const [selectedAccountId, setSelectedAccountId] = useState(preselectedAccountId || '');
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [whiteLabel, setWhiteLabel] = useState(true);
  const [generating, setGenerating] = useState(false);

  const canWhiteLabel = profile?.plan === 'pro' || profile?.plan === 'agency';

  async function handleGenerate() {
    if (!selectedAccountId || !profile) return;
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    setGenerating(true);

    try {
      // Calculate period
      const now = new Date();
      const periodEnd = now.toISOString().split('T')[0];
      let periodStart: string;
      if (reportType === 'monthly') {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        periodStart = d.toISOString().split('T')[0];
      } else {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        periodStart = d.toISOString().split('T')[0];
      }

      // Fetch metrics
      const [{ data: currentMetrics }, { data: prevMetrics }] = await Promise.all([
        supabase
          .from('metrics_daily')
          .select('*')
          .eq('meta_account_id', selectedAccountId)
          .gte('date', periodStart)
          .lte('date', periodEnd),
        supabase
          .from('metrics_daily')
          .select('*')
          .eq('meta_account_id', selectedAccountId)
          .gte('date', (() => {
            const days = Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / 86400000);
            return new Date(new Date(periodStart).getTime() - days * 86400000).toISOString().split('T')[0];
          })())
          .lt('date', periodStart),
      ]);

      const rows = currentMetrics || [];
      const prevRows = prevMetrics || [];

      const sum = (arr: any[], key: string) => arr.reduce((s, r) => s + (Number(r[key]) || 0), 0);
      const avg = (arr: any[], key: string) => {
        const vals = arr.filter(r => r[key] != null);
        return vals.length ? vals.reduce((s: number, r: any) => s + Number(r[key]), 0) / vals.length : 0;
      };

      const spend = sum(rows, 'spend');
      const leads = sum(rows, 'leads');
      const revenue = sum(rows, 'revenue');
      const clicks = sum(rows, 'clicks');
      const impressions = sum(rows, 'impressions');

      const metrics = {
        spend,
        leads,
        roas: spend > 0 ? revenue / spend : 0,
        ctr: avg(rows, 'ctr'),
        cpc: avg(rows, 'cpc'),
        cpm: avg(rows, 'cpm'),
        frequency: avg(rows, 'frequency'),
        impressions,
        clicks,
        cpp: avg(rows, 'cpp'),
      };

      const prevSpend = sum(prevRows, 'spend');
      const prevLeads = sum(prevRows, 'leads');
      const prevRevenue = sum(prevRows, 'revenue');

      const previousMetrics = prevRows.length > 0 ? {
        spend: prevSpend,
        leads: prevLeads,
        roas: prevSpend > 0 ? prevRevenue / prevSpend : 0,
      } : undefined;

      // Fetch latest AI analysis
      const { data: latestAnalysis } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('meta_account_id', selectedAccountId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const insights = (latestAnalysis?.insights as any) || {};

      // Get unique campaigns from metrics
      const campaignIds = [...new Set(rows.filter(r => r.campaign_id).map(r => r.campaign_id))];
      const campaigns = campaignIds.map(cid => {
        const campRows = rows.filter(r => r.campaign_id === cid);
        const cSpend = sum(campRows, 'spend');
        const cRevenue = sum(campRows, 'revenue');
        return {
          name: cid || 'Campanha',
          status: 'ACTIVE',
          spend: cSpend,
          leads: sum(campRows, 'leads'),
          roas: cSpend > 0 ? cRevenue / cSpend : 0,
          ctr: avg(campRows, 'ctr'),
          frequency: avg(campRows, 'frequency'),
        };
      });

      const formatDate = (d: string) => {
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
      };

      const reportData: ReportData = {
        title: `Relatório ${reportType === 'weekly' ? 'Semanal' : 'Mensal'}`,
        period: `${formatDate(periodStart)} a ${formatDate(periodEnd)}`,
        agencyName: (whiteLabel && canWhiteLabel && profile?.white_label_brand_name) || 'MetaFlux',
        agencyLogo: (whiteLabel && canWhiteLabel && profile?.white_label_logo_url) || undefined,
        accountName: account.account_name || account.ad_account_id,
        adAccountId: account.ad_account_id,
        generatedAt: new Date().toLocaleDateString('pt-BR'),
        metrics,
        previousMetrics,
        campaigns,
        aiInsights: {
          score: insights.score ?? 50,
          insights: insights.insights || ['Dados insuficientes para análise completa.'],
          suggestions: insights.suggestions || ['Gere uma análise de IA para obter sugestões detalhadas.'],
          alerts: insights.alerts || [],
          summaryText: latestAnalysis?.summary_text || 'Análise em processamento.',
        },
        periodStart,
        periodEnd,
      };

      const reportId = await generateReport(selectedAccountId, reportData, reportType);
      if (reportId) {
        onOpenChange(false);
        onGenerated?.(reportId);
      }
    } catch (err: any) {
      toast.error('Erro ao gerar relatório.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gerar Relatório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Account selector */}
          <div className="space-y-2">
            <Label>Conta Meta</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="bg-card border-border">
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
          </div>

          {/* Report type */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              {(['weekly', 'monthly'] as ReportType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setReportType(t)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                    reportType === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-border-hover'
                  }`}
                >
                  {t === 'weekly' ? 'Semanal' : 'Mensal'}
                </button>
              ))}
            </div>
          </div>

          {/* White-label toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>White-label</Label>
              <p className="text-xs text-muted-foreground">Usar logo e nome da sua agência</p>
            </div>
            {canWhiteLabel ? (
              <Switch checked={whiteLabel} onCheckedChange={setWhiteLabel} />
            ) : (
              <PlanGate requiredPlan="pro">
                <Switch checked={false} disabled />
              </PlanGate>
            )}
          </div>

          {/* AI cost warning */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <Zap className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs text-muted-foreground">
              Consome ~1 crédito de IA. Restantes: <span className="text-foreground font-medium">{profile?.ai_credits_remaining ?? 0}</span>
            </p>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedAccountId}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Gerando relatório com IA...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Gerar relatório
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
