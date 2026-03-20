import { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Building2, Search, Eye, Edit3, Pause, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { useImpersonation } from '@/hooks/useImpersonation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TenantRow {
  id: string;
  full_name: string | null;
  email: string;
  plan: string | null;
  plan_status: string | null;
  created_at: string | null;
  accountCount: number;
  analysisCount: number;
  apiCostBrl: number;
}

const FILTERS = ['Todos', 'Starter', 'Pro', 'Agency', 'Trial', 'Cancelados'] as const;
const PAGE_SIZE = 20;

export default function TenantsList() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('Todos');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<TenantRow | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const { startImpersonation } = useImpersonation();

  useEffect(() => { fetchTenants(); }, []);

  async function fetchTenants() {
    setLoading(true);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, plan_status, created_at')
      .eq('role', 'admin_gestor')
      .order('created_at', { ascending: false });

    const all = profiles || [];

    const { data: accounts } = await supabase
      .from('meta_accounts')
      .select('gestor_id')
      .eq('is_active', true);
    const accMap = new Map<string, number>();
    (accounts || []).forEach(a => accMap.set(a.gestor_id, (accMap.get(a.gestor_id) || 0) + 1));

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const monthYear = new Date().toISOString().slice(0, 7);

    const { data: usage } = await supabase
      .from('api_usage')
      .select('gestor_id, claude_cost_usd')
      .eq('month_year', monthYear);
    const costMap = new Map<string, number>();
    (usage || []).forEach(u => {
      if (u.gestor_id) costMap.set(u.gestor_id, (costMap.get(u.gestor_id) || 0) + (Number(u.claude_cost_usd) || 0));
    });

    setTenants(all.map(g => ({
      id: g.id,
      full_name: g.full_name,
      email: g.email,
      plan: g.plan,
      plan_status: g.plan_status,
      created_at: g.created_at,
      accountCount: accMap.get(g.id) || 0,
      analysisCount: 0,
      apiCostBrl: (costMap.get(g.id) || 0) * 5.8,
    })));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let result = tenants;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => (t.full_name || '').toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
    }
    if (filter === 'Starter') result = result.filter(t => t.plan === 'starter');
    else if (filter === 'Pro') result = result.filter(t => t.plan === 'pro');
    else if (filter === 'Agency') result = result.filter(t => t.plan === 'agency');
    else if (filter === 'Trial') result = result.filter(t => t.plan_status === 'trial');
    else if (filter === 'Cancelados') result = result.filter(t => t.plan_status === 'cancelled');
    return result;
  }, [tenants, search, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const statusMap = (s: string | null): 'active' | 'trial' | 'paused' => {
    if (s === 'active') return 'active';
    if (s === 'trial') return 'trial';
    return 'paused';
  };

  async function handleToggleSuspend(t: TenantRow) {
    const newStatus = t.plan_status === 'active' ? 'inactive' : 'active';
    const confirm = window.confirm(
      newStatus === 'inactive'
        ? `Suspender ${t.full_name || t.email}? O gestor perderá acesso.`
        : `Reativar ${t.full_name || t.email}?`
    );
    if (!confirm) return;

    await supabase.from('profiles').update({ plan_status: newStatus }).eq('id', t.id);
    await supabase.from('cakto_events').insert({
      event_type: 'admin_action',
      payload: { action: newStatus === 'inactive' ? 'suspend' : 'reactivate', gestor_id: t.id },
    });
    toast.success(newStatus === 'inactive' ? 'Gestor suspenso' : 'Gestor reativado');
    fetchTenants();
  }

  async function handleSaveEdit() {
    if (!editModal) return;
    await supabase.from('profiles').update({ plan: editPlan || null, plan_status: editStatus }).eq('id', editModal.id);
    toast.success('Plano atualizado');
    setEditModal(null);
    fetchTenants();
  }

  return (
    <AppShell title="Tenants">
      <div className="p-5 lg:p-8 space-y-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Tenants</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{tenants.length} gestores cadastrados</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar por nome ou email..." className="pl-9 h-9 bg-background border-border" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 animate-reveal-up" style={{ animationDelay: '60ms' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-card-hover'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card-surface p-4 h-16 animate-pulse" />
            ))
          ) : paged.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum tenant encontrado.</p>
          ) : paged.map((t, i) => (
            <div key={t.id} className="card-surface animate-reveal-up" style={{ animationDelay: `${(i + 1) * 40}ms` }}>
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground uppercase">Plano</p>
                    <p className="text-sm font-medium text-foreground capitalize">{t.plan || 'trial'}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground uppercase">Contas</p>
                    <p className="text-sm font-mono-metric font-medium text-foreground">{t.accountCount}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] text-muted-foreground uppercase">Custo API</p>
                    <p className="text-xs font-mono-metric text-foreground">{formatCurrency(t.apiCostBrl)}</p>
                  </div>
                  <StatusBadge status={statusMap(t.plan_status)} />
                  <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    {expandedId === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded actions */}
              {expandedId === t.id && (
                <div className="px-4 pb-4 pt-1 border-t border-border flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startImpersonation({ gestorId: t.id, gestorName: t.full_name || t.email, gestorEmail: t.email })}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Impersonar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditModal(t); setEditPlan(t.plan || ''); setEditStatus(t.plan_status || 'trial'); }}>
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Editar plano
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleSuspend(t)}>
                    {t.plan_status === 'active' ? <><Pause className="h-3.5 w-3.5 mr-1.5" /> Suspender</> : <><Play className="h-3.5 w-3.5 mr-1.5" /> Reativar</>}
                  </Button>
                  <div className="flex-1" />
                  <p className="text-xs text-muted-foreground self-center">
                    Criado em {t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
          </div>
        )}

        {/* Edit plan modal */}
        <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Editar plano — {editModal?.full_name || editModal?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Plano</label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModal(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
