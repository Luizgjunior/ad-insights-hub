import { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Building2, Search, Eye, Edit3, Pause, Play, ChevronDown, ChevronUp, Plus, Trash2, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { useImpersonation } from '@/hooks/useImpersonation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface TenantRow {
  id: string;
  full_name: string | null;
  email: string;
  plan: string | null;
  plan_status: string | null;
  plan_expires_at: string | null;
  ai_credits_remaining: number | null;
  created_at: string | null;
  accountCount: number;
  analysisCount: number;
  apiCostBrl: number;
}

const FILTERS = ['Todos', 'Starter', 'Pro', 'Agency', 'Trial', 'Cancelados', 'Vitalício'] as const;
const PAGE_SIZE = 20;

export default function TenantsList() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('Todos');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { startImpersonation } = useImpersonation();

  // Edit modal
  const [editModal, setEditModal] = useState<TenantRow | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editName, setEditName] = useState('');
  const [editCredits, setEditCredits] = useState('50');
  const [editLifetime, setEditLifetime] = useState(false);

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPlan, setCreatePlan] = useState('starter');
  const [createStatus, setCreateStatus] = useState('active');
  const [createLifetime, setCreateLifetime] = useState(false);
  const [createCredits, setCreateCredits] = useState('50');
  const [creating, setCreating] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<TenantRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchTenants(); }, []);

  async function fetchTenants() {
    setLoading(true);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, plan_status, plan_expires_at, ai_credits_remaining, created_at')
      .eq('role', 'admin_gestor')
      .order('created_at', { ascending: false });

    const all = profiles || [];

    const { data: accounts } = await supabase
      .from('meta_accounts')
      .select('gestor_id')
      .eq('is_active', true);
    const accMap = new Map<string, number>();
    (accounts || []).forEach(a => accMap.set(a.gestor_id, (accMap.get(a.gestor_id) || 0) + 1));

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
      plan_expires_at: g.plan_expires_at,
      ai_credits_remaining: g.ai_credits_remaining,
      created_at: g.created_at,
      accountCount: accMap.get(g.id) || 0,
      analysisCount: 0,
      apiCostBrl: (costMap.get(g.id) || 0) * 5.8,
    })));
    setLoading(false);
  }

  const isLifetime = (t: TenantRow) => {
    if (!t.plan_expires_at) return false;
    return new Date(t.plan_expires_at).getFullYear() >= 2099;
  };

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
    else if (filter === 'Vitalício') result = result.filter(t => isLifetime(t));
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
    toast.success(newStatus === 'inactive' ? 'Gestor suspenso' : 'Gestor reativado');
    fetchTenants();
  }

  function openEditModal(t: TenantRow) {
    setEditModal(t);
    setEditPlan(t.plan || 'starter');
    setEditStatus(t.plan_status || 'trial');
    setEditName(t.full_name || '');
    setEditCredits(String(t.ai_credits_remaining ?? 50));
    setEditLifetime(isLifetime(t));
  }

  async function handleSaveEdit() {
    if (!editModal) return;
    const lifetimeDate = '2099-12-31T23:59:59Z';
    const updates: Record<string, unknown> = {
      plan: editPlan || null,
      plan_status: editStatus,
      full_name: editName || null,
      ai_credits_remaining: parseInt(editCredits) || 50,
    };
    if (editLifetime) {
      updates.plan_expires_at = lifetimeDate;
    } else if (isLifetime(editModal)) {
      // Was lifetime, now isn't — set to 30 days from now
      updates.plan_expires_at = new Date(Date.now() + 30 * 86400000).toISOString();
    }
    await supabase.from('profiles').update(updates).eq('id', editModal.id);
    toast.success('Tenant atualizado');
    setEditModal(null);
    fetchTenants();
  }

  async function handleCreate() {
    if (!createEmail || !createPassword) {
      toast.error('Email e senha são obrigatórios.');
      return;
    }
    if (createPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-client', {
        body: {
          action: 'create_gestor',
          email: createEmail,
          password: createPassword,
          fullName: createName || createEmail.split('@')[0],
          plan: createPlan,
          planStatus: createStatus,
          aiCredits: parseInt(createCredits) || 50,
          lifetime: createLifetime,
        },
      });

      if (error) {
        toast.error('Erro ao criar tenant. Verifique os dados.');
      } else {
        toast.success(`Tenant ${createEmail} criado com sucesso!`);
        setCreateModal(false);
        resetCreateForm();
        fetchTenants();
      }
    } catch {
      toast.error('Erro ao criar tenant.');
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setCreateEmail('');
    setCreateName('');
    setCreatePassword('');
    setCreatePlan('starter');
    setCreateStatus('active');
    setCreateLifetime(false);
    setCreateCredits('50');
  }

  async function handleDelete() {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('invite-client', {
        body: { action: 'delete_gestor', gestorId: deleteModal.id },
      });
      if (error) {
        toast.error('Erro ao excluir tenant.');
      } else {
        toast.success(`Tenant ${deleteModal.email} excluído.`);
        setDeleteModal(null);
        fetchTenants();
      }
    } catch {
      toast.error('Erro ao excluir tenant.');
    } finally {
      setDeleting(false);
    }
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
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar..." className="pl-9 h-9 bg-background border-border" />
            </div>
            <Button onClick={() => { resetCreateForm(); setCreateModal(true); }} size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" /> Novo tenant
            </Button>
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{t.full_name || 'Sem nome'}</p>
                      {isLifetime(t) && (
                        <Crown className="h-3.5 w-3.5 text-warning shrink-0" title="Vitalício" />
                      )}
                    </div>
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
                    <p className="text-[10px] text-muted-foreground uppercase">Créditos IA</p>
                    <p className="text-xs font-mono-metric text-foreground">{t.ai_credits_remaining ?? 0}</p>
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
                  <Button size="sm" variant="outline" onClick={() => openEditModal(t)}>
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleSuspend(t)}>
                    {t.plan_status === 'active' ? <><Pause className="h-3.5 w-3.5 mr-1.5" /> Suspender</> : <><Play className="h-3.5 w-3.5 mr-1.5" /> Reativar</>}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteModal(t)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
                  </Button>
                  <div className="flex-1" />
                  <p className="text-xs text-muted-foreground self-center">
                    Criado em {t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '—'}
                    {isLifetime(t) && <span className="ml-2 text-warning font-medium">• Vitalício</span>}
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

        {/* Edit tenant modal */}
        <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Editar tenant — {editModal?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1 bg-background border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Plano</Label>
                  <Select value={editPlan} onValueChange={setEditPlan}>
                    <SelectTrigger className="mt-1 bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="agency">Agency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="mt-1 bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Créditos de IA</Label>
                <Input type="number" value={editCredits} onChange={e => setEditCredits(e.target.value)} className="mt-1 bg-background border-border" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-warning" /> Assinatura vitalícia
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">O plano nunca expira</p>
                </div>
                <Switch checked={editLifetime} onCheckedChange={setEditLifetime} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModal(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create tenant modal */}
        <Dialog open={createModal} onOpenChange={setCreateModal}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Criar novo tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-muted-foreground">Email *</Label>
                <Input type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="gestor@email.com" className="mt-1 bg-background border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Nome do gestor" className="mt-1 bg-background border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Senha *</Label>
                <Input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="mt-1 bg-background border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Plano</Label>
                  <Select value={createPlan} onValueChange={setCreatePlan}>
                    <SelectTrigger className="mt-1 bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="agency">Agency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={createStatus} onValueChange={setCreateStatus}>
                    <SelectTrigger className="mt-1 bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Créditos de IA</Label>
                <Input type="number" value={createCredits} onChange={e => setCreateCredits(e.target.value)} className="mt-1 bg-background border-border" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-warning" /> Assinatura vitalícia
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">O plano nunca expira</p>
                </div>
                <Switch checked={createLifetime} onCheckedChange={setCreateLifetime} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModal(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Criando...' : 'Criar tenant'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation modal */}
        <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-destructive">Excluir tenant</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Tem certeza que deseja excluir <strong className="text-foreground">{deleteModal?.full_name || deleteModal?.email}</strong>?
              Todos os dados deste gestor (contas, métricas, relatórios) serão removidos permanentemente.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Excluir permanentemente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
