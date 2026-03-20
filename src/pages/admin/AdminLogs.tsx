import { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';

interface AlertLog {
  id: string;
  alert_type: string;
  severity: string | null;
  title: string;
  body: string | null;
  is_resolved: boolean | null;
  is_read: boolean | null;
  metadata: any;
  created_at: string | null;
  gestor_id: string | null;
  client_id: string | null;
}

const TYPE_FILTERS = ['Todos', 'roas_drop', 'high_frequency', 'cpl_spike', 'token_expiring', 'budget_ending', 'campaign_error'];
const SEVERITY_FILTERS = ['Todos', 'critical', 'warning', 'info'];
const STATUS_FILTERS = ['Todos', 'Abertos', 'Resolvidos'];
const PERIOD_FILTERS = ['Hoje', '7 dias', '30 dias'];

function exportToCSV(data: AlertLog[]) {
  const headers = ['Data', 'Tipo', 'Severidade', 'Título', 'Status'];
  const rows = data.map(d => [
    d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '',
    d.alert_type,
    d.severity || '',
    `"${(d.title || '').replace(/"/g, '""')}"`,
    d.is_resolved ? 'Resolvido' : 'Aberto',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metaflux-alertas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [severityFilter, setSeverityFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [periodFilter, setPeriodFilter] = useState('30 dias');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchLogs(); }, [periodFilter]);

  async function fetchLogs() {
    setLoading(true);
    const now = new Date();
    let since: string;
    if (periodFilter === 'Hoje') since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    else if (periodFilter === '7 dias') since = new Date(now.getTime() - 7 * 86400000).toISOString();
    else since = new Date(now.getTime() - 30 * 86400000).toISOString();

    const { data } = await supabase
      .from('alerts')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);

    setLogs(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let result = logs;
    if (typeFilter !== 'Todos') result = result.filter(l => l.alert_type === typeFilter);
    if (severityFilter !== 'Todos') result = result.filter(l => l.severity === severityFilter);
    if (statusFilter === 'Abertos') result = result.filter(l => !l.is_resolved);
    else if (statusFilter === 'Resolvidos') result = result.filter(l => l.is_resolved);
    return result;
  }, [logs, typeFilter, severityFilter, statusFilter]);

  const severityBadge = (s: string | null) => {
    if (s === 'critical') return 'error' as const;
    if (s === 'warning') return 'warning' as const;
    return 'active' as const;
  };

  return (
    <AppShell title="Logs de Alertas">
      <div className="p-5 lg:p-8 space-y-5 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Logs de Alertas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} alertas</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => exportToCSV(filtered)} disabled={filtered.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-2 animate-reveal-up" style={{ animationDelay: '60ms' }}>
          <FilterRow label="Período" items={PERIOD_FILTERS} active={periodFilter} onSelect={setPeriodFilter} />
          <FilterRow label="Tipo" items={TYPE_FILTERS} active={typeFilter} onSelect={setTypeFilter} />
          <FilterRow label="Severidade" items={SEVERITY_FILTERS} active={severityFilter} onSelect={setSeverityFilter} />
          <FilterRow label="Status" items={STATUS_FILTERS} active={statusFilter} onSelect={setStatusFilter} />
        </div>

        {/* Table */}
        <div className="space-y-1.5">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <div key={i} className="card-surface p-4 h-14 animate-pulse" />)
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum alerta encontrado.</p>
          ) : filtered.map(log => (
            <div key={log.id} className="card-surface">
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-card-hover transition-colors"
              >
                <StatusBadge status={severityBadge(log.severity)} />
                <span className="text-xs text-muted-foreground font-mono-metric shrink-0 w-20">
                  {log.created_at ? new Date(log.created_at).toLocaleDateString('pt-BR') : '—'}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 w-28 truncate">{log.alert_type}</span>
                <span className="text-sm text-foreground flex-1 truncate">{log.title}</span>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${log.is_resolved ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {log.is_resolved ? 'Resolvido' : 'Aberto'}
                </span>
                {expandedId === log.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {expandedId === log.id && (
                <div className="px-4 pb-4 border-t border-border space-y-2 pt-3">
                  {log.body && <p className="text-sm text-muted-foreground">{log.body}</p>}
                  {log.metadata && (
                    <pre className="text-xs text-muted-foreground bg-background p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function FilterRow({ label, items, active, onSelect }: { label: string; items: string[]; active: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold uppercase text-muted-foreground w-16 shrink-0">{label}</span>
      {items.map(item => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            active === item ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
