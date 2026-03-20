import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const [usdBrl, setUsdBrl] = useState('5.8');
  const [systemMessage, setSystemMessage] = useState('');
  const [alertTotal, setAlertTotal] = useState('500');
  const [alertGestor, setAlertGestor] = useState('100');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load from system_config
    supabase.from('system_config').select('key, value').then(({ data }) => {
      data?.forEach(row => {
        if (row.key === 'usd_brl_rate') setUsdBrl(row.value || '5.8');
        if (row.key === 'system_message') setSystemMessage(row.value || '');
      });
    });

    // Load from localStorage
    setAlertTotal(localStorage.getItem('metaflux_alert_total') || '500');
    setAlertGestor(localStorage.getItem('metaflux_alert_gestor') || '100');
  }, []);

  async function handleSave() {
    setSaving(true);

    await supabase.from('system_config').update({ value: usdBrl, updated_at: new Date().toISOString() }).eq('key', 'usd_brl_rate');
    await supabase.from('system_config').update({ value: systemMessage, updated_at: new Date().toISOString() }).eq('key', 'system_message');

    localStorage.setItem('metaflux_alert_total', alertTotal);
    localStorage.setItem('metaflux_alert_gestor', alertGestor);
    localStorage.setItem('metaflux_usd_brl', usdBrl);

    setSaving(false);
    toast.success('Configurações salvas');
  }

  return (
    <AppShell title="Configurações Admin">
      <div className="p-5 lg:p-8 space-y-8 max-w-2xl mx-auto">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações da Plataforma</h1>
          <p className="text-sm text-muted-foreground mt-1">Ajustes globais para o MetaFlux</p>
        </div>

        {/* Exchange rate */}
        <Section title="Taxa de câmbio">
          <label className="text-xs text-muted-foreground mb-1.5 block">USD → BRL</label>
          <Input type="number" step="0.01" value={usdBrl} onChange={e => setUsdBrl(e.target.value)} className="w-40 bg-background border-border" />
          <p className="text-[11px] text-muted-foreground mt-1">Usado em todos os cálculos de custo de API.</p>
        </Section>

        {/* Alert limits */}
        <Section title="Limites de alerta de custo">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Alertar quando custo mensal total superar R$:</label>
              <Input type="number" value={alertTotal} onChange={e => setAlertTotal(e.target.value)} className="w-40 bg-background border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Alertar quando um gestor superar R$:</label>
              <Input type="number" value={alertGestor} onChange={e => setAlertGestor(e.target.value)} className="w-40 bg-background border-border" />
            </div>
          </div>
        </Section>

        {/* System message */}
        <Section title="Mensagem de sistema">
          <Textarea
            value={systemMessage}
            onChange={e => setSystemMessage(e.target.value)}
            placeholder="Ex: ⚠️ Manutenção programada para 25/03 às 02h"
            className="bg-background border-border min-h-[80px]"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Se preenchida, aparece como banner para todos os gestores.</p>
        </Section>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-5 space-y-3 animate-reveal-up">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}
