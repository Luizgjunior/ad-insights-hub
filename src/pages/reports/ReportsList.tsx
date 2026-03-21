import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GenerateReportModal from '@/components/reports/GenerateReportModal';
import { useReports } from '@/hooks/useReports';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { FileText, Download, Plus, Eye, Share2, Loader2, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  ready: 'Pronto',
  generating: 'Gerando...',
  error: 'Erro',
};

const statusMap: Record<string, 'active' | 'warning' | 'error'> = {
  ready: 'active',
  generating: 'warning',
  error: 'error',
};

export default function ReportsList() {
  const navigate = useNavigate();
  const { accounts } = useMetaAccounts();
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Edit/Delete states
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const { reports, loading, fetchReports } = useReports(
    filterAccount !== 'all' ? filterAccount : undefined
  );

  const filteredReports = reports.filter(r => {
    if (filterType !== 'all' && r.report_type !== filterType) return false;
    return true;
  });

  function handleShare(reportId: string) {
    const url = `${window.location.origin}/reports/${reportId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  }

  function handleDownload(report: any) {
    const html = (report.content_json as any)?.html;
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    setTimeout(() => { win?.print(); URL.revokeObjectURL(url); }, 500);
  }

  const score = (report: any) => {
    const json = report.content_json as any;
    return json?.aiInsights?.score ?? null;
  };

  async function handleEditSave() {
    if (!selectedReport) return;
    setSaving(true);
    const { error } = await supabase
      .from('reports')
      .update({ title: editTitle.trim() || null })
      .eq('id', selectedReport.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar.'); return; }
    toast.success('Relatório atualizado!');
    setEditOpen(false);
    fetchReports();
  }

  async function handleDelete() {
    if (!selectedReport) return;
    setSaving(true);
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', selectedReport.id);
    setSaving(false);
    if (error) { toast.error('Erro ao excluir.'); return; }
    toast.success('Relatório excluído!');
    setDeleteOpen(false);
    fetchReports();
  }

  return (
    <AppShell title="Relatórios">
      <div className="p-4 lg:p-8 space-y-5 max-w-4xl">
        <div className="flex items-center justify-between animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Relatórios</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Relatórios gerados automaticamente com IA</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            Gerar relatório
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 animate-reveal-up" style={{ animationDelay: '60ms' }}>
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="w-48 bg-card border-border"><SelectValue placeholder="Todas as contas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map(a => (<SelectItem key={a.id} value={a.id}>{a.account_name || a.ad_account_id}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 bg-card border-border"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum relatório gerado ainda"
            description="Gere seu primeiro relatório com análise de IA integrada."
            action={<Button onClick={() => setModalOpen(true)} className="mt-3"><Plus className="h-4 w-4 mr-2" />Gerar primeiro relatório</Button>}
          />
        ) : (
          <div className="space-y-2">
            {filteredReports.map((report, i) => (
              <div key={report.id} className="card-surface p-4 animate-reveal-up" style={{ animationDelay: `${(i + 1) * 60}ms` }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{report.title || 'Relatório'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {report.period_start && report.period_end
                            ? `${new Date(report.period_start).toLocaleDateString('pt-BR')} a ${new Date(report.period_end).toLocaleDateString('pt-BR')}`
                            : report.created_at ? new Date(report.created_at).toLocaleDateString('pt-BR') : '—'}
                        </span>
                        {score(report) !== null && (
                          <span className="text-xs text-muted-foreground">· Score: <span className="font-mono font-medium text-foreground">{score(report)}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={statusMap[report.status] || 'warning'} />
                    {report.status === 'ready' && (
                      <>
                        <button onClick={() => navigate(`/gestor/relatorios/${report.id}`)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors active:scale-95" title="Visualizar"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleDownload(report)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors active:scale-95" title="Baixar PDF"><Download className="h-4 w-4" /></button>
                        <button onClick={() => handleShare(report.id)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors active:scale-95" title="Compartilhar"><Share2 className="h-4 w-4" /></button>
                      </>
                    )}
                    <button onClick={() => { setSelectedReport(report); setEditTitle(report.title || ''); setEditOpen(true); }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors active:scale-95" title="Editar"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { setSelectedReport(report); setDeleteOpen(true); }} className="p-2 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors active:scale-95" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                    {report.status === 'generating' && <Loader2 className="h-4 w-4 animate-spin text-warning" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <GenerateReportModal open={modalOpen} onOpenChange={setModalOpen} onGenerated={(id) => navigate(`/gestor/relatorios/${id}`)} />

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Editar relatório</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir relatório?</AlertDialogTitle>
            <AlertDialogDescription>O relatório <strong>{selectedReport?.title || 'selecionado'}</strong> será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
