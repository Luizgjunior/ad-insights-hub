import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AlertBadge from '@/components/ui/AlertBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useAlerts } from '@/hooks/useAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, CheckCircle, Shield, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FilterTab = 'all' | 'unresolved' | 'critical';

export default function AlertsList() {
  const { profile } = useAuth();
  const { alerts, unreadCount, markAsRead, markAllAsRead, resolveAlert, refetch } = useAlerts();
  const [filter, setFilter] = useState<FilterTab>('all');

  // CRUD states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formSeverity, setFormSeverity] = useState<string>('warning');
  const [formType, setFormType] = useState<string>('campaign_error');
  const [saving, setSaving] = useState(false);

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && !a.is_resolved).length;
  const infoCount = alerts.filter(a => a.severity === 'info' && !a.is_resolved).length;

  const filtered = alerts.filter(a => {
    if (filter === 'unresolved') return !a.is_resolved;
    if (filter === 'critical') return a.severity === 'critical';
    return true;
  });

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'agora';
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  async function handleCreate() {
    if (!formTitle.trim() || !profile) return;
    setSaving(true);
    const { error } = await supabase.from('alerts').insert({
      title: formTitle.trim(),
      body: formBody.trim() || null,
      severity: formSeverity,
      alert_type: formType,
      gestor_id: profile.id,
    });
    setSaving(false);
    if (error) { toast.error('Erro ao criar alerta.'); return; }
    toast.success('Alerta criado!');
    setCreateOpen(false);
    resetForm();
    refetch();
  }

  async function handleEditSave() {
    if (!selectedAlert) return;
    setSaving(true);
    const { error } = await supabase.from('alerts').update({
      title: formTitle.trim(),
      body: formBody.trim() || null,
      severity: formSeverity,
    }).eq('id', selectedAlert.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar.'); return; }
    toast.success('Alerta atualizado!');
    setEditOpen(false);
    refetch();
  }

  async function handleDelete() {
    if (!selectedAlert) return;
    setSaving(true);
    const { error } = await supabase.from('alerts').delete().eq('id', selectedAlert.id);
    setSaving(false);
    if (error) { toast.error('Erro ao excluir.'); return; }
    toast.success('Alerta excluído!');
    setDeleteOpen(false);
    refetch();
  }

  function resetForm() {
    setFormTitle('');
    setFormBody('');
    setFormSeverity('warning');
    setFormType('campaign_error');
  }

  function openEdit(alert: any) {
    setSelectedAlert(alert);
    setFormTitle(alert.title);
    setFormBody(alert.body || '');
    setFormSeverity(alert.severity);
    setEditOpen(true);
  }

  return (
    <AppShell title="Alertas">
      <div className="p-5 lg:p-8 space-y-5 max-w-4xl">
        <div className="flex items-center justify-between animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Central de Alertas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {criticalCount} críticos · {warningCount} avisos · {infoCount} informativos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="active:scale-[0.97] border-border text-muted-foreground hover:text-foreground">
              <CheckCircle className="h-3.5 w-3.5" />
              Marcar todos como lidos
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}>
              <Plus className="h-3.5 w-3.5" />
              Criar alerta
            </Button>
          </div>
        </div>

        <div className="flex gap-1 animate-reveal-up" style={{ animationDelay: '60ms' }}>
          {([
            { key: 'all' as FilterTab, label: 'Todos' },
            { key: 'unresolved' as FilterTab, label: 'Não resolvidos' },
            { key: 'critical' as FilterTab, label: 'Críticos' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === tab.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Bell} title="Nenhum alerta" description="Você será notificado sobre problemas nas campanhas" />
        ) : (
          <div className="space-y-2">
            {filtered.map((alert, i) => (
              <div
                key={alert.id}
                className={cn(
                  'card-surface p-4 animate-reveal-up',
                  alert.severity === 'critical' && 'border-l-2 border-l-danger',
                  alert.severity === 'warning' && 'border-l-2 border-l-warning',
                  alert.severity === 'info' && 'border-l-2 border-l-primary',
                  alert.is_read && 'opacity-60'
                )}
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
                onClick={() => !alert.is_read && markAsRead(alert.id)}
              >
                <div className="flex items-start gap-3">
                  <AlertBadge severity={alert.severity} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    {alert.body && <p className="text-xs text-muted-foreground mt-1 text-pretty leading-relaxed">{alert.body}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-muted-foreground">{formatTime(alert.created_at)}</span>
                      {!alert.is_resolved && (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground hover:text-success px-2" onClick={(e) => { e.stopPropagation(); resolveAlert(alert.id); }}>
                          <Shield className="h-3 w-3" />Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(alert); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedAlert(alert); setDeleteOpen(true); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Alert Modal */}
      <Dialog open={createOpen || editOpen} onOpenChange={(v) => { if (!v) { setCreateOpen(false); setEditOpen(false); } }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>{editOpen ? 'Editar alerta' : 'Criar alerta'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: CPC acima do esperado" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} placeholder="Detalhes do alerta..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Severidade</Label>
              <Select value={formSeverity} onValueChange={setFormSeverity}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informativo</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createOpen && (
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roas_drop">Queda de ROAS</SelectItem>
                    <SelectItem value="budget_ending">Orçamento acabando</SelectItem>
                    <SelectItem value="high_frequency">Frequência alta</SelectItem>
                    <SelectItem value="cpl_spike">CPL elevado</SelectItem>
                    <SelectItem value="campaign_error">Erro de campanha</SelectItem>
                    <SelectItem value="token_expiring">Token expirando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditOpen(false); }}>Cancelar</Button>
            <Button onClick={editOpen ? handleEditSave : handleCreate} disabled={saving || !formTitle.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{editOpen ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir alerta?</AlertDialogTitle>
            <AlertDialogDescription>O alerta <strong>{selectedAlert?.title}</strong> será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
