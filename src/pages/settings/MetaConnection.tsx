import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useAuth } from '@/contexts/AuthContext';
import { validateAndSaveMetaAccount } from '@/lib/metaApi';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { daysUntil } from '@/lib/utils';
import { usePlan } from '@/hooks/usePlan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EmptyState from '@/components/ui/EmptyState';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  Plus, Shield, Trash2, RefreshCw, Eye, EyeOff,
  ChevronDown, ExternalLink, AlertCircle, Loader2, Check, BarChart2
} from 'lucide-react';

function TokenStatus({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span className="text-xs text-muted-foreground">Token sem data de expiração</span>;
  const days = daysUntil(expiresAt);
  if (days < 0) return <span className="text-xs text-destructive font-semibold">Token expirado — reconecte</span>;
  if (days <= 7) return <span className="text-xs text-destructive font-semibold">Token expirando! {days} dias</span>;
  if (days <= 30) return <span className="text-xs text-warning font-semibold">Expira em {days} dias</span>;
  return <span className="text-xs text-success">Token válido ({days} dias)</span>;
}

export default function MetaConnection() {
  const { user } = useAuth();
  const { accounts, loading, refetch } = useMetaAccounts();
  const { getMaxAccounts, currentPlan } = usePlan();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Client list for selector
  const { data: clientsList = [] } = useQuery({
    queryKey: ['gestor-clients-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('gestor_id', user.id)
        .eq('role', 'usuario_cliente')
        .order('full_name');
      return data || [];
    },
    enabled: !!user,
  });

  // Add form state
  const [metaToken, setMetaToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [adAccountId, setAdAccountId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  const resetForm = () => {
    setMetaToken('');
    setAdAccountId('');
    setShowToken(false);
    setConnectError('');
    setConnecting(false);
    setSelectedClientId('');
  };

  const handleConnect = async () => {
    if (!metaToken.trim() || !adAccountId.trim()) {
      setConnectError('Preencha o token e o ID da conta.');
      return;
    }
    if (!user) return;

    setConnecting(true);
    setConnectError('');

    const formattedId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const result = await validateAndSaveMetaAccount(metaToken.trim(), formattedId, user.id, user.id);

    setConnecting(false);

    if (!result.success) {
      setConnectError(result.error || 'Erro ao conectar.');
      return;
    }

    toast.success(`✓ Conta ${result.accountName || formattedId} conectada! Sincronizando dados...`);
    resetForm();
    setShowAddDialog(false);
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('meta_accounts').delete().eq('id', deleteTarget);
    if (error) {
      toast.error('Erro ao remover conta.');
    } else {
      toast.success('Conta removida com sucesso.');
      refetch();
    }
    setDeleteTarget(null);
  };

  return (
    <AppShell title="Contas Meta Ads">
      <div className="p-5 lg:p-8 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Contas Meta Ads</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {accounts.length} de {getMaxAccounts()} contas disponíveis no plano {currentPlan?.charAt(0).toUpperCase()}{currentPlan?.slice(1) || 'Trial'}
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="active:scale-[0.97]">
            <Plus className="h-4 w-4" />
            Adicionar conta
          </Button>
        </div>

        {/* Account list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card-surface p-5 animate-pulse">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded mt-2" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Nenhuma conta conectada"
            description="Adicione sua primeira conta de anúncio Meta para começar a monitorar."
            action={
              <Button onClick={() => setShowAddDialog(true)} variant="outline" className="mt-2">
                <Plus className="h-4 w-4" />
                Adicionar conta
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {accounts.map((acc, i) => (
              <div
                key={acc.id}
                className="card-surface p-5 hover:border-[hsl(var(--border))]/20 transition-all animate-reveal-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {acc.account_name || acc.ad_account_id}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{acc.ad_account_id}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${acc.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${acc.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                          {acc.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                        <TokenStatus expiresAt={acc.token_expires_at} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Ver métricas">
                      <BarChart2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Remover"
                      onClick={() => setDeleteTarget(acc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Account Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar conta Meta Ads</DialogTitle>
              <DialogDescription>Conecte uma nova conta de anúncios via token de acesso.</DialogDescription>
            </DialogHeader>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                <ChevronDown className="h-4 w-4" />
                Como obter seu token?
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground space-y-1.5">
                <p>1. Acesse o <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Explorador da Graph API <ExternalLink className="h-3 w-3" /></a></p>
                <p>2. Gere um token com: <code className="font-mono text-xs bg-background px-1 rounded">ads_read</code>, <code className="font-mono text-xs bg-background px-1 rounded">ads_management</code>, <code className="font-mono text-xs bg-background px-1 rounded">read_insights</code></p>
                <p>3. Copie o token e cole abaixo</p>
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Token de acesso Meta *</Label>
                <div className="relative">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    value={metaToken}
                    onChange={(e) => { setMetaToken(e.target.value); setConnectError(''); }}
                    placeholder="EAAxxxxxxxxx..."
                    className="h-10 bg-background border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">ID da conta de anúncios *</Label>
                <Input
                  value={adAccountId}
                  onChange={(e) => { setAdAccountId(e.target.value); setConnectError(''); }}
                  placeholder="act_528114338445986"
                  className="h-10 bg-background border-border"
                />
              </div>

              {connectError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{connectError}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                className="w-full active:scale-[0.97]"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validando token...
                  </>
                ) : (
                  'Validar e conectar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Remover conta?</DialogTitle>
              <DialogDescription>
                Todos os dados desta conta serão removidos. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Confirmar remoção</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
