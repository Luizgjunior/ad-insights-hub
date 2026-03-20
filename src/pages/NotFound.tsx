import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <p className="text-[120px] leading-none font-bold font-mono-metric text-muted-foreground/30 mb-4">
        404
      </p>
      <h1 className="text-xl font-bold text-foreground mb-2">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        O conteúdo que você procura não existe ou foi movido.
      </p>
      <Button onClick={() => navigate('/')} className="active:scale-[0.97]">
        <Zap className="h-4 w-4" />
        Voltar ao início
      </Button>
    </div>
  );
}
