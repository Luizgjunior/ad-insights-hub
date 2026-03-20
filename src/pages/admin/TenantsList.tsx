import AppShell from '@/components/layout/AppShell';
import { Building2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/ui/StatusBadge';
import { useState } from 'react';

const mockTenants = [
  { id: '1', name: 'Agência Digital Pro', email: 'contato@digitalpro.com', plan: 'agency', accounts: 15, status: 'active' as const },
  { id: '2', name: 'Marketing Lab', email: 'admin@mktlab.com', plan: 'pro', accounts: 7, status: 'active' as const },
  { id: '3', name: 'João Freelancer', email: 'joao@email.com', plan: 'starter', accounts: 2, status: 'trial' as const },
  { id: '4', name: 'Growth Studio', email: 'growth@studio.com', plan: 'pro', accounts: 5, status: 'paused' as const },
];

export default function TenantsList() {
  const [search, setSearch] = useState('');
  const filtered = mockTenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="Tenants">
      <div className="p-5 lg:p-8 space-y-5 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Tenants</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{mockTenants.length} gestores cadastrados</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tenant..." className="pl-9 h-9 bg-background border-border" />
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((tenant, i) => (
            <div
              key={tenant.id}
              className="card-surface p-4 flex items-center justify-between gap-4 animate-reveal-up"
              style={{ animationDelay: `${(i + 1) * 60}ms` }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground">{tenant.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-muted-foreground uppercase">Plano</p>
                  <p className="text-sm font-medium text-foreground capitalize">{tenant.plan}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-muted-foreground uppercase">Contas</p>
                  <p className="text-sm font-mono-metric font-medium text-foreground">{tenant.accounts}</p>
                </div>
                <StatusBadge status={tenant.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
