import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { profile } = useAuth();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu perfil e preferências</p>
        </div>

        <Card className="animate-reveal-up" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input defaultValue={profile?.full_name || ''} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input defaultValue={profile?.email || ''} disabled />
            </div>
            <Button className="active:scale-[0.98]">Salvar alterações</Button>
          </CardContent>
        </Card>

        <Card className="animate-reveal-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-base">White Label</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da marca</Label>
              <Input defaultValue={profile?.white_label_brand_name || ''} placeholder="Sua marca" />
            </div>
            <div className="space-y-2">
              <Label>URL do logo</Label>
              <Input defaultValue={profile?.white_label_logo_url || ''} placeholder="https://..." />
            </div>
            <Button variant="outline" className="active:scale-[0.98]">Atualizar marca</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
