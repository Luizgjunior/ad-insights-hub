import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { validateAndSaveMetaAccount } from '@/lib/metaApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  Zap, ArrowRight, ArrowLeft, Upload, Check, Eye, EyeOff,
  ChevronDown, ExternalLink, AlertCircle, Loader2, X, Mail
} from 'lucide-react';

const STORAGE_KEY = 'metaflux_onboarding_step';

export default function Onboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // Step 1 state
  const [agencyName, setAgencyName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [metaToken, setMetaToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [adAccountId, setAdAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState('');

  // Step 3 state
  const [clientEmail, setClientEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(currentStep));
  }, [currentStep]);

  if (profile?.role === 'admin_global') return <Navigate to="/admin" replace />;

  const goNext = () => {
    setDirection('next');
    setCurrentStep((s) => Math.min(s + 1, 2));
  };

  const goPrev = () => {
    setDirection('prev');
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  // Step 1: Save agency info
  const handleStep1 = async () => {
    if (!agencyName.trim()) {
      toast.error('Informe o nome da agência.');
      return;
    }
    if (!user) return;

    let logoUrl: string | undefined;

    if (logoFile) {
      setUploadingLogo(true);
      const ext = logoFile.name.split('.').pop();
      const path = `${user.id}/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true });
      setUploadingLogo(false);
      if (uploadErr) {
        toast.error('Erro ao fazer upload do logo.');
        return;
      }
      const { data: publicUrl } = supabase.storage.from('logos').getPublicUrl(path);
      logoUrl = publicUrl.publicUrl;
    }

    const updates: Record<string, string> = { white_label_brand_name: agencyName.trim() };
    if (logoUrl) updates.white_label_logo_url = logoUrl;

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) {
      toast.error('Erro ao salvar. Tente novamente.');
      return;
    }
    goNext();
  };

  // Step 2: Connect Meta
  const handleConnectMeta = async () => {
    if (!metaToken.trim() || !adAccountId.trim()) {
      setConnectError('Preencha o token e o ID da conta.');
      return;
    }
    if (!user) return;

    setConnecting(true);
    setConnectError('');

    const formattedId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    const result = await validateAndSaveMetaAccount(
      metaToken.trim(),
      formattedId,
      user.id,
      user.id
    );

    setConnecting(false);

    if (!result.success) {
      setConnectError(result.error || 'Erro ao conectar.');
      return;
    }

    setAccountName(result.accountName || formattedId);
    setConnected(true);
    toast.success(`✓ Conta ${result.accountName || formattedId} conectada! Sincronizando dados...`);

    setTimeout(() => goNext(), 1200);
  };

  // Step 3: Invite client
  const handleInvite = async () => {
    if (!clientEmail.trim()) {
      navigate('/gestor');
      return;
    }
    setInviting(true);

    try {
      const { error } = await supabase.functions.invoke('invite-client', {
        body: { email: clientEmail.trim(), gestorId: user?.id },
      });
      if (error) throw error;
      toast.success(`Convite enviado para ${clientEmail.trim()}`);
    } catch {
      toast.error('Erro ao enviar convite. Tente mais tarde.');
    }

    setInviting(false);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/gestor');
  };

  const handleSkip = () => {
    localStorage.removeItem(STORAGE_KEY);
    navigate('/gestor');
  };

  // Logo file handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('O logo deve ter no máximo 2MB.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou SVG.');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const progressValue = ((currentStep + 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-10">
        <Progress value={progressValue} className="h-1 rounded-none bg-muted" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[520px] animate-reveal-up">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MetaFlux</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-xs text-muted-foreground font-medium">Passo {currentStep + 1} de 3</span>
            <div className="flex gap-1.5 ml-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i <= currentStep ? 'w-6 bg-primary' : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Card */}
          <div className="card-surface p-8 relative overflow-hidden">
            <div
              key={currentStep}
              className={`transition-all duration-300 ${
                direction === 'next' ? 'animate-reveal-up' : 'animate-reveal-up'
              }`}
            >
              {/* ═══════ STEP 1: Welcome ═══════ */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-foreground">Bem-vindo ao MetaFlux 👋</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vamos configurar sua agência em menos de 2 minutos.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Nome da agência / empresa *</Label>
                      <Input
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder="Ex: Agência Digital XYZ"
                        className="h-11 bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Logo (opcional)</Label>
                      <div className="flex items-center gap-3">
                        {logoPreview ? (
                          <div className="relative h-16 w-16 rounded-lg border border-border overflow-hidden bg-muted">
                            <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                            <button
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreview(null);
                              }}
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors"
                          >
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </button>
                        )}
                        <div className="text-xs text-muted-foreground">
                          PNG, JPG ou SVG<br />Máximo 2MB
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full h-11 font-semibold active:scale-[0.98]"
                    onClick={handleStep1}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* ═══════ STEP 2: Connect Meta ═══════ */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-foreground">Conecte sua primeira conta Meta Ads</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vincule sua conta para monitorar métricas em tempo real.
                    </p>
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors w-full">
                      <ChevronDown className="h-4 w-4" />
                      Como obter seu token?
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground space-y-2">
                      <p>1. Acesse o <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta for Developers</a></p>
                      <p>2. Abra o <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Explorador da Graph API <ExternalLink className="h-3 w-3" /></a></p>
                      <p>3. Selecione seu app e gere um token com permissões: <code className="font-mono text-xs bg-background px-1 py-0.5 rounded">ads_read</code>, <code className="font-mono text-xs bg-background px-1 py-0.5 rounded">ads_management</code>, <code className="font-mono text-xs bg-background px-1 py-0.5 rounded">read_insights</code></p>
                      <p>4. Copie o token e cole abaixo</p>
                    </CollapsibleContent>
                  </Collapsible>

                  {connected ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-success">Conta conectada!</p>
                        <p className="text-xs text-muted-foreground">{accountName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Token de acesso Meta *</Label>
                        <div className="relative">
                          <Input
                            type={showToken ? 'text' : 'password'}
                            value={metaToken}
                            onChange={(e) => { setMetaToken(e.target.value); setConnectError(''); }}
                            placeholder="EAAxxxxxxxxx..."
                            className="h-11 bg-background border-border pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">ID da conta de anúncios *</Label>
                        <Input
                          value={adAccountId}
                          onChange={(e) => { setAdAccountId(e.target.value); setConnectError(''); }}
                          placeholder="act_528114338445986"
                          className="h-11 bg-background border-border"
                        />
                        <p className="text-xs text-muted-foreground">
                          Encontre em gerenciador.meta.com → ID da conta
                        </p>
                      </div>

                      {connectError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <p className="text-sm text-destructive">{connectError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={goPrev} className="h-11 active:scale-[0.98]">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    {!connected ? (
                      <Button
                        className="flex-1 h-11 font-semibold active:scale-[0.98]"
                        onClick={handleConnectMeta}
                        disabled={connecting}
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Validando token...
                          </>
                        ) : (
                          'Validar e conectar'
                        )}
                      </Button>
                    ) : (
                      <Button className="flex-1 h-11 font-semibold active:scale-[0.98]" onClick={goNext}>
                        Continuar
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <button
                    onClick={goNext}
                    className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pular por agora
                  </button>
                </div>
              )}

              {/* ═══════ STEP 3: Invite Client ═══════ */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-foreground">Convide seu primeiro cliente</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seu cliente terá acesso a um dashboard simplificado com os resultados das campanhas.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Email do cliente (opcional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="cliente@empresa.com"
                        className="h-11 bg-background border-border pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={goPrev} className="h-11 active:scale-[0.98]">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      className="flex-1 h-11 font-semibold active:scale-[0.98]"
                      onClick={handleInvite}
                      disabled={inviting}
                    >
                      {inviting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : clientEmail.trim() ? (
                        'Convidar e finalizar'
                      ) : (
                        'Finalizar configuração'
                      )}
                    </Button>
                  </div>

                  {clientEmail.trim() && (
                    <button
                      onClick={handleSkip}
                      className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Pular por agora
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Você tem 7 dias de trial gratuito para explorar o Pro.
          </p>
        </div>
      </div>
    </div>
  );
}
