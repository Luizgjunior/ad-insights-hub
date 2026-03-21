import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Search, UserPlus, Mail, ExternalLink, Pencil, Trash2, Loader2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ClientProfile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string | null;
  plan: string | null;
  plan_status: string | null;
}

export default function GestorClients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['gestor-clients', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, plan, plan_status')
        .eq('gestor_id', user.id)
        .eq('role', 'usuario_cliente')
        .order('created_at', { ascending: false });
      return (data || []) as ClientProfile[];
    },
    enabled: !!user,
  });

  const { data: accountsMap = {} } = useQuery({
    queryKey: ['client-accounts-map', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data } = await supabase
        .from('meta_accounts')
        .select('client_id, id, account_name, ad_account_id')
        .eq('gestor_id', user.id)
        .eq('is_active', true);
      const map: Record<string, { count: number; names: string[] }> = {};
      (data || []).forEach((acc) => {
        if (!map[acc.client_id]) map[acc.client_id] = { count: 0, names: [] };
        map[acc.client_id].count++;
        map[acc.client_id].names.push(acc.account_name || acc.ad_account_id);
      });
      return map;
    },
    enabled: !!user,
  });

  const filtered = clients.filter(
    (c) =>
      (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(client: ClientProfile, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedClient(client);
    setEditName(client.full_name || '');
    setEditEmail(client.email);
    setEditOpen(true);
  }

  function openDelete(client: ClientProfile, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedClient(client);
    setDeleteOpen(true);
  }

  async function handleEditSave() {
    if (!selectedClient) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName.trim() || null })
      .eq('id', selectedClient.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar.'); return; }
    toast.success('Cliente atualizado!');
    setEditOpen(false);
    queryClient.invalidateQueries({ queryKey: ['gestor-clients'] });
  }

  async function handleDelete() {
    if (!selectedClient || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('invite-client', {
        body: { action: 'delete_gestor', targetUserId: selectedClient.id },
      });
      if (error) throw error;
      toast.success('Cliente removido.');
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['gestor-clients'] });
    } catch {
      toast.error('Erro ao remover cliente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!newEmail.trim() || !newPassword.trim() || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('invite-client', {
        body: { action: 'create_client', email: newEmail.trim(), password: newPassword, fullName: newName.trim(), gestorId: user.id },
      });
      if (error) throw error;
      toast.success('Cliente criado com sucesso!');
      setCreateOpen(false);
      setNewName(''); setNewEmail(''); setNewPassword('');
      queryClient.invalidateQueries({ queryKey: ['gestor-clients'] });
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao criar cliente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Clientes">
      <div className="p-5 lg:p-8 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {clients.length} cliente{clients.length !== 1 ? 's' : ''} vinculado{clients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Convidar cliente</span>
          </Button>
        </div>

        {clients.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-surface p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente vinculado'}
            description={search ? 'Tente buscar com outro termo.' : 'Convide seu primeiro cliente para que ele tenha acesso ao dashboard de métricas.'}
            actionLabel={!search ? 'Convidar cliente' : undefined}
            onAction={!search ? () => setInviteOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((client, i) => {
              const accs = accountsMap[client.id];
              return (
                <div
                  key={client.id}
                  onClick={() => navigate(`/gestor/cliente/${client.id}`)}
                  className="card-surface p-4 text-left transition-all hover:border-[hsl(var(--border-hover))] animate-reveal-up active:scale-[0.98] cursor-pointer"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {getInitials(client.full_name || client.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{client.full_name || 'Sem nome'}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {client.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={(e) => openEdit(client, e)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => openDelete(client, e)} className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors" title="Remover">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{accs ? `${accs.count} conta${accs.count !== 1 ? 's' : ''}` : 'Sem contas'}</span>
                    {client.created_at && (
                      <span>Desde {new Date(client.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={editEmail} disabled className="opacity-60" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              O cliente <strong>{selectedClient?.full_name || selectedClient?.email}</strong> e todos os dados vinculados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Convidar cliente</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Email do cliente</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="cliente@email.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={saving || !inviteEmail.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
