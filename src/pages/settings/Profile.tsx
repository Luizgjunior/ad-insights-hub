import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Camera, Loader2, Shield } from 'lucide-react';

type Tab = 'profile' | 'agency' | 'security' | 'notifications';

export default function ProfileSettings() {
  const { profile, user } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'profile', label: 'Meu perfil', show: true },
    { key: 'agency', label: 'Minha agência', show: profile?.role === 'admin_gestor' },
    { key: 'security', label: 'Segurança', show: true },
    { key: 'notifications', label: 'Notificações', show: true },
  ];

  return (
    <AppShell title="Configurações">
      <div className="p-5 lg:p-8 space-y-6 max-w-2xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie seu perfil e preferências</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto animate-reveal-up" style={{ animationDelay: '60ms' }}>
          {tabs.filter(t => t.show).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                tab === t.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileTab />}
        {tab === 'agency' && <AgencyTab />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>
    </AppShell>
  );
}

function ProfileTab() {
  const { profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile!.id);
    setSaving(false);
    if (error) toast.error('Erro ao salvar.');
    else toast.success('Perfil atualizado!');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
    if (uploadError) { toast.error('Erro no upload'); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id);
    toast.success('Avatar atualizado!');
    setUploading(false);
  };

  return (
    <div className="card-surface p-6 animate-reveal-up" style={{ animationDelay: '120ms' }}>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-card flex items-center justify-center text-2xl font-bold text-foreground uppercase">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0) || '?'
            )}
          </div>
          <label className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
            {uploading ? <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" /> : <Camera className="h-3.5 w-3.5 text-primary-foreground" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{profile?.full_name}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
          <StatusBadge status={profile?.plan_status === 'active' ? 'active' : profile?.plan_status === 'trial' ? 'trial' : 'paused'} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Nome completo</Label>
          <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-10 bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">E-mail</Label>
          <Input defaultValue={profile?.email || ''} disabled className="h-10 bg-background border-border opacity-60" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="active:scale-[0.97]">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

function AgencyTab() {
  const { profile } = useAuth();
  const [brandName, setBrandName] = useState(profile?.white_label_brand_name || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ white_label_brand_name: brandName })
      .eq('id', profile!.id);
    setSaving(false);
    if (error) toast.error('Erro ao salvar.');
    else toast.success('Marca atualizada!');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo deve ter no máximo 2MB'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
    if (uploadError) { toast.error('Erro no upload'); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
    await supabase.from('profiles').update({ white_label_logo_url: urlData.publicUrl }).eq('id', profile.id);
    toast.success('Logo atualizada!');
    setUploading(false);
  };

  return (
    <div className="card-surface p-6 animate-reveal-up" style={{ animationDelay: '120ms' }}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Minha Agência</h3>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-xl bg-card flex items-center justify-center overflow-hidden">
            {profile?.white_label_logo_url ? (
              <img src={profile.white_label_logo_url} alt="" className="h-16 w-16 object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">Logo</span>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center cursor-pointer">
            {uploading ? <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" /> : <Camera className="h-3 w-3 text-primary-foreground" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG ou SVG · Máximo 2MB</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Nome da agência</Label>
          <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Sua agência" className="h-10 bg-background border-border" />
        </div>

        {/* Preview */}
        <div className="p-3 rounded-lg bg-background border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Preview do rodapé</p>
          <p className="text-xs text-foreground">
            {brandName || 'Sua Agência'} · Relatório gerado em {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} variant="outline" className="active:scale-[0.97] border-border">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Atualizar marca
        </Button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { toast.error('A senha deve ter no mínimo 8 caracteres'); return; }
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return; }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) toast.error('Erro ao atualizar senha.');
    else { toast.success('Senha atualizada!'); setNewPassword(''); setConfirmPassword(''); }
  };

  const handleLogoutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    toast.success('Todas as sessões encerradas.');
  };

  return (
    <div className="space-y-4">
      <div className="card-surface p-6 animate-reveal-up" style={{ animationDelay: '120ms' }}>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Trocar senha
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nova senha</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" className="h-10 bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Confirmar nova senha</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" className="h-10 bg-background border-border" />
          </div>
          <Button onClick={handleChangePassword} disabled={saving} className="active:scale-[0.97]">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Atualizar senha
          </Button>
        </div>
      </div>

      <div className="card-surface p-6 animate-reveal-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-sm font-semibold text-foreground mb-2">Sessões</h3>
        <p className="text-xs text-muted-foreground mb-4">Encerre todas as sessões ativas em outros dispositivos.</p>
        <Button variant="outline" onClick={handleLogoutAll} className="active:scale-[0.97] border-border text-destructive hover:text-destructive">
          Encerrar todas as sessões
        </Button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('metaflux_notif_prefs');
    return saved ? JSON.parse(saved) : {
      critical: true,
      warning: true,
      info: false,
      weekly_report: true,
      optimization_tips: false,
    };
  });

  const toggle = (key: string) => {
    if (key === 'critical') return; // Always on
    setPrefs((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = () => {
    localStorage.setItem('metaflux_notif_prefs', JSON.stringify(prefs));
    toast.success('Preferências salvas!');
  };

  const items = [
    { key: 'critical', label: 'Alertas críticos', desc: 'Sempre ativo', locked: true },
    { key: 'warning', label: 'Alertas de aviso', desc: 'Performance abaixo do esperado' },
    { key: 'info', label: 'Alertas informativos', desc: 'Dicas e informações gerais' },
    { key: 'weekly_report', label: 'Relatório semanal gerado', desc: 'Notificar quando pronto' },
    { key: 'optimization_tips', label: 'Dicas de otimização', desc: 'Sugestões semanais de melhoria' },
  ];

  return (
    <div className="card-surface p-6 animate-reveal-up" style={{ animationDelay: '120ms' }}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Preferências de notificação</h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={prefs[item.key]}
              onCheckedChange={() => toggle(item.key)}
              disabled={item.locked}
            />
          </div>
        ))}
      </div>
      <Button onClick={save} variant="outline" className="mt-6 active:scale-[0.97] border-border">
        Salvar preferências
      </Button>
    </div>
  );
}
