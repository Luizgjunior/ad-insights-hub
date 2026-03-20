import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AiAnalysis } from '@/types';

export interface AccountMetricsInput {
  accountName: string;
  adAccountId: string;
  period?: string;
  spend: number;
  leads: number;
  roas: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  impressions: number;
  clicks: number;
  previousSpend?: number;
  previousRoas?: number;
  previousLeads?: number;
  clientId?: string;
  campaigns?: {
    name: string;
    status: string;
    spend: number;
    leads: number;
    roas: number;
    ctr: number;
    frequency: number;
  }[];
}

export interface AiInsightResult {
  score: number;
  insights: string[];
  suggestions: string[];
  alerts: string[];
  summaryText: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
}

export function useAiAnalysis(metaAccountId: string) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);

  async function fetchLatestAnalysis() {
    const { data } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('meta_account_id', metaAccountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setAnalysis({
        id: data.id,
        meta_account_id: data.meta_account_id || '',
        analysis_type: data.analysis_type as AiAnalysis['analysis_type'],
        model_used: data.model_used || undefined,
        period_start: data.period_start || undefined,
        period_end: data.period_end || undefined,
        insights: data.insights as AiAnalysis['insights'],
        summary_text: data.summary_text || undefined,
        cost_usd: data.cost_usd || undefined,
        created_at: data.created_at || '',
      });
    }
    return data;
  }

  function canGenerateAnalysis(): boolean {
    if (!profile) return false;
    if (profile.role === 'admin_global') return true;
    if (profile.plan === 'agency') return true;
    return (profile.ai_credits_remaining ?? 0) > 0;
  }

  async function runAnalysis(metrics: AccountMetricsInput, analysisType: 'daily' | 'weekly'): Promise<AiInsightResult | null> {
    if (!canGenerateAnalysis()) {
      toast.error('Créditos de IA insuficientes. Faça upgrade do seu plano.');
      return null;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await supabase.functions.invoke('ai-analyze', {
        body: {
          metrics,
          analysisType,
          gestorId: profile!.id,
          metaAccountId,
        },
      });

      if (res.error) {
        const msg = typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'Erro ao gerar análise.';
        toast.error(msg);
        return null;
      }

      const result = res.data as AiInsightResult;
      toast.success(analysisType === 'daily' ? 'Análise diária gerada!' : 'Análise semanal gerada!');
      await fetchLatestAnalysis();
      return result;
    } catch (err: any) {
      toast.error('Análise temporariamente indisponível. Tente em alguns minutos.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function runDailyAnalysis(metrics: AccountMetricsInput) {
    return runAnalysis(metrics, 'daily');
  }

  async function runWeeklyAnalysis(metrics: AccountMetricsInput) {
    return runAnalysis(metrics, 'weekly');
  }

  return {
    analysis,
    loading,
    fetchLatestAnalysis,
    runDailyAnalysis,
    runWeeklyAnalysis,
    canGenerateAnalysis,
  };
}
