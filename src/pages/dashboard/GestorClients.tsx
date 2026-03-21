import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Search, UserPlus, Mail, ExternalLink } from 'lucide-react';
import { getInitials } from '@/lib/utils';

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
  const [search, setSearch] = useState('');

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
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => navigate('/settings/meta')}
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Convidar cliente</span>
          </Button>
        </div>

        {clients.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
            description={
              search
                ? 'Tente buscar com outro termo.'
                : 'Convide seu primeiro cliente para que ele tenha acesso ao dashboard de métricas.'
            }
            actionLabel={!search ? 'Convidar cliente' : undefined}
            onAction={!search ? () => navigate('/settings/meta') : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((client, i) => {
              const accs = accountsMap[client.id];
              return (
                <button
                  key={client.id}
                  onClick={() => navigate(`/gestor/cliente/${client.id}`)}
                  className="card-surface p-4 text-left transition-all hover:border-[hsl(var(--border-hover))] animate-reveal-up active:scale-[0.98]"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {getInitials(client.full_name || client.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {client.full_name || 'Sem nome'}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {client.email}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>
                      {accs ? `${accs.count} conta${accs.count !== 1 ? 's' : ''}` : 'Sem contas'}
                    </span>
                    {client.created_at && (
                      <span>
                        Desde {new Date(client.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
