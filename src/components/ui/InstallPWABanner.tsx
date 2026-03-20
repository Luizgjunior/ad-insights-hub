import { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';

export default function InstallPWABanner() {
  const { canInstall, isIOS, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('metaflux_pwa_dismissed') === 'true'
  );

  if (isInstalled || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  function dismiss() {
    localStorage.setItem('metaflux_pwa_dismissed', 'true');
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 card-surface p-3.5 flex items-center gap-3 border-primary/30 lg:hidden">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
        <Smartphone className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground">Instalar MetaFlux</p>
        <p className="text-[11px] text-muted-foreground">
          {isIOS
            ? 'Toque em Compartilhar → "Adicionar à tela de início"'
            : 'Acesse mais rápido direto da tela inicial'}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {!isIOS && (
          <Button size="sm" onClick={promptInstall} className="h-8 text-xs gap-1">
            <Download className="h-3 w-3" />
            Instalar
          </Button>
        )}
        <button
          onClick={dismiss}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
