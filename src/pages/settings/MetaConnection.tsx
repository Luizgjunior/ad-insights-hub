import AppShell from '@/components/layout/AppShell';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, Plus, Shield } from 'lucide-react';

export default function MetaConnection() {
  return (
    <AppShell title="Conexão Meta">
      <div className="p-5 lg:p-8 space-y-6 max-w-2xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Conexão Meta</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Conecte suas contas de anúncio do Meta</p>
        </div>

        <div className="card-surface p-6 animate-reveal-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-meta-blue/10">
              <Shield className="h-4 w-4 text-meta-blue" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Adicionar conta de anúncio</h3>
              <p className="text-xs text-muted-foreground">Conecte via token de acesso do Meta Business</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">ID da conta de anúncio</Label>
              <Input placeholder="act_123456789" className="h-10 bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome da conta</Label>
              <Input placeholder="Minha Loja" className="h-10 bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Access Token</Label>
              <Input type="password" placeholder="Token de acesso longo" className="h-10 bg-background border-border" />
            </div>
            <Button className="active:scale-[0.97]">
              <Link2 className="h-4 w-4" />
              Conectar conta
            </Button>
          </div>
        </div>

        <EmptyState
          icon={Plus}
          title="Nenhuma conta conectada"
          description="Adicione sua primeira conta de anúncio Meta para começar a monitorar"
        />
      </div>
    </AppShell>
  );
}
