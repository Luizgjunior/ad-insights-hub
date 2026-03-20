import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { BarChart2, ExternalLink, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const mockCampaigns = [
  { id: '1', name: 'Leads Março — Lookalike 1%', status: 'active' as const, spend: 'R$ 1.240', roas: '3,2×', leads: 48, ctr: '1,8%' },
  { id: '2', name: 'Retargeting Site — Carrinho', status: 'active' as const, spend: 'R$ 680', roas: '4,1×', leads: 31, ctr: '2,4%' },
  { id: '3', name: 'Brand Awareness — Vídeo', status: 'paused' as const, spend: 'R$ 420', roas: '1,2×', leads: 8, ctr: '0,9%' },
  { id: '4', name: 'Conversão Direta — Feed', status: 'active' as const, spend: 'R$ 890', roas: '2,8×', leads: 37, ctr: '1,5%' },
  { id: '5', name: 'Teste Criativo A/B', status: 'error' as const, spend: 'R$ 0', roas: '0×', leads: 0, ctr: '0%' },
];

export default function CampaignsList() {
  const [search, setSearch] = useState('');
  const filtered = mockCampaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="Campanhas">
      <div className="p-5 lg:p-8 space-y-5 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-reveal-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Campanhas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{mockCampaigns.length} campanhas encontradas</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar campanha..."
              className="pl-9 h-9 bg-background border-border"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={BarChart2} title="Nenhuma campanha encontrada" description="Tente ajustar os filtros de busca" />
        ) : (
          <div className="space-y-2">
            {filtered.map((campaign, i) => (
              <div
                key={campaign.id}
                className="card-surface p-4 flex items-center justify-between gap-4 animate-reveal-up"
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <StatusBadge status={campaign.status} />
                  <span className="text-sm font-medium text-foreground truncate">{campaign.name}</span>
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Gasto</p>
                    <p className="font-mono-metric font-medium text-foreground">{campaign.spend}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">ROAS</p>
                    <p className="font-mono-metric font-medium text-foreground">{campaign.roas}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Leads</p>
                    <p className="font-mono-metric font-medium text-foreground">{campaign.leads}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">CTR</p>
                    <p className="font-mono-metric font-medium text-foreground">{campaign.ctr}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors active:scale-95">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
