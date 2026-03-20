import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/ui/StatusBadge';

export default function ProfileSettings() {
  const { profile } = useAuth();

  return (
    <AppShell title="Configurações">
      <div className="p-5 lg:p-8 space-y-6 max-w-2xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie seu perfil e preferências</p>
        </div>

        <div className="card-surface p-6 animate-reveal-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Perfil</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome completo</Label>
              <Input defaultValue={profile?.full_name || ''} className="h-10 bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">E-mail</Label>
              <Input defaultValue={profile?.email || ''} disabled className="h-10 bg-background border-border opacity-60" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Status:</Label>
              <StatusBadge status={profile?.plan_status === 'active' ? 'active' : profile?.plan_status === 'trial' ? 'trial' : 'paused'} />
            </div>
            <Button className="active:scale-[0.97]">Salvar alterações</Button>
          </div>
        </div>

        <div className="card-surface p-6 animate-reveal-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">White Label</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome da marca</Label>
              <Input defaultValue={profile?.white_label_brand_name || ''} placeholder="Sua marca" className="h-10 bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">URL do logo</Label>
              <Input defaultValue={profile?.white_label_logo_url || ''} placeholder="https://..." className="h-10 bg-background border-border" />
            </div>
            <Button variant="outline" className="active:scale-[0.97] border-border">Atualizar marca</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
