import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getPeriodDates } from '@/lib/utils';

interface MetricsSummary {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  leads: number;
  purchases: number;
  revenue: number;
  roas: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
}

const emptyMetrics: MetricsSummary = {
  spend: 0, impressions: 0, clicks: 0, reach: 0,
  leads: 0, purchases: 0, revenue: 0, roas: 0,
  ctr: 0, cpc: 0, cpm: 0, frequency: 0,
};

function aggregate(rows: any[]): MetricsSummary {
  if (!rows.length) return { ...emptyMetrics };
  const sum = (key: string) => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0);
  const avg = (key: string) => {
    const vals = rows.filter(r => r[key] != null);
    if (!vals.length) return 0;
    return vals.reduce((a: number, r: any) => a + Number(r[key]), 0) / vals.length;
  };
  const spend = sum('spend');
  return {
    spend,
    impressions: sum('impressions'),
    clicks: sum('clicks'),
    reach: sum('reach'),
    leads: sum('leads'),
    purchases: sum('purchases'),
    revenue: sum('revenue'),
    roas: spend > 0 ? sum('revenue') / spend : 0,
    ctr: avg('ctr'),
    cpc: avg('cpc'),
    cpm: avg('cpm'),
    frequency: avg('frequency'),
  };
}

function calcTrends(current: MetricsSummary, previous: MetricsSummary) {
  const trend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };
  return {
    spend: trend(current.spend, previous.spend),
    leads: trend(current.leads, previous.leads),
    roas: trend(current.roas, previous.roas),
    ctr: trend(current.ctr, previous.ctr),
    clicks: trend(current.clicks, previous.clicks),
    impressions: trend(current.impressions, previous.impressions),
    revenue: trend(current.revenue, previous.revenue),
  };
}

export function useAccountMetrics(metaAccountId: string | undefined, period: 'today' | 'week' | 'month' = 'week') {
  const [current, setCurrent] = useState<MetricsSummary>({ ...emptyMetrics });
  const [previous, setPrevious] = useState<MetricsSummary>({ ...emptyMetrics });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!metaAccountId) return;
    setLoading(true);
    const { start, end } = getPeriodDates(period);
    const days = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
    const prevStart = new Date(new Date(start).getTime() - days * 86400000).toISOString().split('T')[0];

    const [{ data: currData, error: e1 }, { data: prevData, error: e2 }] = await Promise.all([
      supabase.from('metrics_daily').select('*').eq('meta_account_id', metaAccountId).gte('date', start).lte('date', end),
      supabase.from('metrics_daily').select('*').eq('meta_account_id', metaAccountId).gte('date', prevStart).lt('date', start),
    ]);

    if (e1 || e2) setError((e1 || e2)?.message || 'Erro');
    setCurrent(aggregate(currData || []));
    setPrevious(aggregate(prevData || []));
    setLoading(false);
  }, [metaAccountId, period]);

  useEffect(() => { fetch(); }, [fetch]);

  const trends = calcTrends(current, previous);
  return { current, previous, trends, loading, error, refetch: fetch };
}

export interface AccountWithScore {
  id: string;
  client_id: string;
  ad_account_id: string;
  account_name: string | null;
  is_active: boolean | null;
  client_name: string | null;
  score: number;
  scoreColor: string;
  scoreLabel: string;
  metrics: MetricsSummary;
}

function calculateHealthScore(m: MetricsSummary): { score: number; color: string; label: string } {
  let score = 0;
  if (m.roas >= 2.0) score += 30;
  if (m.roas >= 3.0) score += 20;
  if (m.frequency < 3.5) score += 20;
  if (m.ctr >= 1.5) score += 15;
  if (m.spend > 0) score += 15;
  const color = score >= 80 ? '#00D4AA' : score >= 50 ? '#FFB800' : '#FF4757';
  const label = score >= 80 ? 'Saudável' : score >= 50 ? 'Atenção' : 'Crítico';
  return { score, color, label };
}

export function useGestorMetrics() {
  const { user } = useAuth();
  const [accountsWithScore, setAccountsWithScore] = useState<AccountWithScore[]>([]);
  const [totals, setTotals] = useState<MetricsSummary>({ ...emptyMetrics });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: accounts } = await supabase
        .from('meta_accounts')
        .select('id, client_id, ad_account_id, account_name, is_active')
        .eq('gestor_id', user.id)
        .eq('is_active', true);

      if (!accounts || accounts.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch client names
      const clientIds = [...new Set(accounts.map(a => a.client_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', clientIds);
      const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      // Fetch last 7 days metrics for all accounts
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const { data: metrics } = await supabase
        .from('metrics_daily')
        .select('*')
        .in('meta_account_id', accounts.map(a => a.id))
        .gte('date', sevenDaysAgo);

      const result: AccountWithScore[] = accounts.map(acc => {
        const accMetrics = (metrics || []).filter(m => m.meta_account_id === acc.id);
        const agg = aggregate(accMetrics);
        const { score, color, label } = calculateHealthScore(agg);
        return {
          ...acc,
          client_name: nameMap.get(acc.client_id) || null,
          score,
          scoreColor: color,
          scoreLabel: label,
          metrics: agg,
        };
      });

      // Sort: critical → attention → healthy
      result.sort((a, b) => a.score - b.score);

      setAccountsWithScore(result);

      // Calculate totals
      const allMetrics = (metrics || []);
      setTotals(aggregate(allMetrics));
      setLoading(false);
    })();
  }, [user]);

  return { accountsWithScore, totals, loading, activeCount: accountsWithScore.length };
}
