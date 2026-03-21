import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { formatCurrency, formatROAS } from '@/lib/utils';
import { BarChart2, Search, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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

interface CampaignRow {
  campaign_id: string;
  spend: number;
  leads: number;
  roas: number;
  ctr: number;
  clicks: number;
  impressions: number;
}

export default function CampaignsList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { accounts } = useMetaAccounts();
  const [search, setSearch] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CampaignRow | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const accountIds = accounts.map(a => a.id);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns-list', user?.id, filterAccount],
    queryFn: async () => {
      if (!user || accountIds.length === 0) return [];
      let query = supabase
        .from('metrics_daily')
        .select('campaign_id, spend, leads, roas, ctr, clicks, impressions, meta_account_id')
        .not('campaign_id', 'is', null);

      if (filterAccount !== 'all') {
        query = query.eq('meta_account_id', filterAccount);
      } else {
        query = query.in('meta_account_id', accountIds);
      }

      const { data } = await query;
      if (!data) return [];

      // Aggregate by campaign_id
      const map = new Map<string, CampaignRow>();
      data.forEach((r: any) => {
        const existing = map.get(r.campaign_id) || {
          campaign_id: r.campaign_id,
          spend: 0, leads: 0, roas: 0, ctr: 0, clicks: 0, impressions: 0,
        };
        existing.spend += Number(r.spend) || 0;
        existing.leads += Number(r.leads) || 0;
        existing.clicks += Number(r.clicks) || 0;
        existing.impressions += Number(r.impressions) || 0;
        map.set(r.campaign_id, existing);
      });

      return Array.from(map.values()).map(c => ({
        ...c,
        roas: c.spend > 0 ? c.spend > 0 ? (c.leads * 50) / c.spend : 0 : 0, // simplified
        ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      }));
    },
    enabled: !!user && accountIds.length > 0,
  });

  const filtered = campaigns.filter(c =>
    c.campaign_id.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    // Delete all metrics for this campaign
    const { error } = await supabase
      .from('metrics_daily')
      .delete()
      .eq('campaign_id', selected.campaign_id);
    setSaving(false);
    if (error) { toast.error('Erro ao excluir.'); return; }
    toast.success('Campanha removida!');
    setDeleteOpen(false);
    queryClient.invalidateQueries({ queryKey: ['campaigns-list'] });
  }

  return (
    <AppShell title="Campanhas">
      <div className="p-5 lg:p-8 space-y-5 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Campanhas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} encontrada{campaigns.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="w-44 bg-card border-border h-9">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.account_name || a.ad_account_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar campanha..." className="pl-9 h-9 bg-background border-border" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-surface p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={BarChart2} title="Nenhuma campanha encontrada" description={search ? 'Tente ajustar os filtros de busca.' : 'Conecte uma conta Meta e sincronize as métricas para ver campanhas.'} />
        ) : (
          <div className="space-y-2">
            {filtered.map((campaign, i) => (
              <div
                key={campaign.campaign_id}
                className="card-surface p-4 flex items-center justify-between gap-4 animate-reveal-up"
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">{campaign.campaign_id}</span>
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Gasto</p>
                    <p className="font-mono-metric font-medium text-foreground">{formatCurrency(campaign.spend)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Leads</p>
                    <p className="font-mono-metric font-medium text-foreground">{campaign.leads}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">CTR</p>
                    <p className="font-mono-metric font-medium text-foreground">{campaign.ctr.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Clicks</p>
                    <p className="font-mono-metric font-medium text-foreground">{campaign.clicks}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setSelected(campaign); setDeleteOpen(true); }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors active:scale-95"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados de métricas da campanha <strong>{selected?.campaign_id}</strong> serão removidos permanentemente.
            </AlertDialogDescription>
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
