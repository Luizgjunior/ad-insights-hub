import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import MetricCard, { MetricCardSkeleton } from '@/components/ui/MetricCard';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { CreditCard, Zap, Hash, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GestorCost {
  gestorId: string;
  name: string;
  plan: string | null;
  calls: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  costBrl: number;
  pctTotal: number;
}

function CostBar({ name, cost, maxCost }: { name: string; cost: number; maxCost: number }) {
  const pct = maxCost > 0 ? (cost / maxCost) * 100 : 0;
  const isHigh = cost > 20 * 5.8;
  const isMedium = cost > 10 * 5.8;
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <div className="w-24 text-xs text-muted-foreground text-right shrink-0 truncate">{name.split(' ')[0]}</div>
      <div className="flex-1 h-5 bg-card rounded overflow-hidden">
        <div
          className={`h-full rounded transition-all duration-500 ${isHigh ? 'bg-danger' : isMedium ? 'bg-warning' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-20 text-xs font-mono-metric text-foreground">{formatCurrency(cost)}</div>
    </div>
  );
}

function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export default function ApiCosts() {
  const months = getLast6Months();
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [gestorCosts, setGestorCosts] = useState<GestorCost[]>([]);
  const [loading, setLoading] = useState(true);
  const USD_TO_BRL = 5.8;

  useEffect(() => { fetchCosts(); }, [selectedMonth]);

  async function fetchCosts() {
    setLoading(true);

    const { data: usage } = await supabase
      .from('api_usage')
      .select('gestor_id, claude_calls, claude_tokens_input, claude_tokens_output, claude_cost_usd')
      .eq('month_year', selectedMonth);

    const gestorIds = [...new Set((usage || []).map(u => u.gestor_id).filter(Boolean))] as string[];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan')
      .in('id', gestorIds.length ? gestorIds : ['00000000-0000-0000-0000-000000000000']);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const totalCost = (usage || []).reduce((s, u) => s + (Number(u.claude_cost_usd) || 0), 0);

    const grouped = new Map<string, { calls: number; tokensIn: number; tokensOut: number; costUsd: number }>();
    (usage || []).forEach(u => {
      if (!u.gestor_id) return;
      const existing = grouped.get(u.gestor_id) || { calls: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 };
      existing.calls += u.claude_calls || 0;
      existing.tokensIn += u.claude_tokens_input || 0;
      existing.tokensOut += u.claude_tokens_output || 0;
      existing.costUsd += Number(u.claude_cost_usd) || 0;
      grouped.set(u.gestor_id, existing);
    });

    const rows: GestorCost[] = Array.from(grouped.entries())
      .map(([gid, d]) => {
        const p = profileMap.get(gid);
        return {
          gestorId: gid,
          name: p?.full_name || p?.email || 'Desconhecido',
          plan: p?.plan || null,
          calls: d.calls,
          tokensIn: d.tokensIn,
          tokensOut: d.tokensOut,
          costUsd: d.costUsd,
          costBrl: d.costUsd * USD_TO_BRL,
          pctTotal: totalCost > 0 ? (d.costUsd / totalCost) * 100 : 0,
        };
      })
      .sort((a, b) => b.costUsd - a.costUsd);

    setGestorCosts(rows);
    setLoading(false);
  }

  const totalCostBrl = gestorCosts.reduce((s, g) => s + g.costBrl, 0);
  const totalTokens = gestorCosts.reduce((s, g) => s + g.tokensIn + g.tokensOut, 0);
  const totalCalls = gestorCosts.reduce((s, g) => s + g.calls, 0);
  const avgCost = gestorCosts.length > 0 ? totalCostBrl / gestorCosts.length : 0;
  const top5 = gestorCosts.slice(0, 5);
  const maxCost = top5.length > 0 ? top5[0].costBrl : 0;

  return (
    <AppShell title="Custo de API">
      <div className="p-5 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Custo de API</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Consumo por gestor</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40 bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <MetricCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Custo total" value={formatCurrency(totalCostBrl)} icon={CreditCard} delay={60} />
            <MetricCard label="Total tokens" value={totalTokens > 1e6 ? `${(totalTokens / 1e6).toFixed(1)}M` : formatNumber(totalTokens)} icon={Zap} delay={120} />
            <MetricCard label="Total chamadas" value={formatNumber(totalCalls)} icon={Hash} delay={180} />
            <MetricCard label="Custo/gestor avg" value={formatCurrency(avgCost)} icon={Users} delay={240} />
          </div>
        )}

        {/* Top 5 chart */}
        {top5.length > 0 && (
          <div className="card-surface p-5 animate-reveal-up" style={{ animationDelay: '300ms' }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Top 5 por custo</p>
            {top5.map(g => (
              <CostBar key={g.gestorId} name={g.name} cost={g.costBrl} maxCost={maxCost} />
            ))}
          </div>
        )}

        {/* Table */}
        <div className="card-surface overflow-x-auto animate-reveal-up" style={{ animationDelay: '400ms' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Gestor</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Plano</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Chamadas</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right hidden lg:table-cell">Tokens</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Custo BRL</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {gestorCosts.map(g => (
                <tr key={g.gestorId} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium truncate max-w-[200px]">{g.name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize hidden md:table-cell">{g.plan || '—'}</td>
                  <td className="px-4 py-3 text-foreground font-mono-metric text-right">{formatNumber(g.calls)}</td>
                  <td className="px-4 py-3 text-foreground font-mono-metric text-right hidden lg:table-cell">{formatNumber(g.tokensIn + g.tokensOut)}</td>
                  <td className="px-4 py-3 font-mono-metric text-right">
                    <span className={g.costBrl > 116 ? 'text-danger font-semibold' : 'text-foreground'}>
                      {formatCurrency(g.costBrl)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono-metric text-right">{g.pctTotal.toFixed(1)}%</td>
                </tr>
              ))}
              {gestorCosts.length === 0 && !loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sem dados para este mês</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
