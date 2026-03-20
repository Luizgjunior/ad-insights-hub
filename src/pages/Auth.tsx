import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Carregando...</div>
    </div>
  );

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) toast.error(error.message);
      else toast.success('Verifique seu e-mail para confirmar o cadastro.');
    }

    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3 animate-slide-in-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <BarChart3 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-sidebar-primary-foreground">AdMetrics AI</span>
        </div>

        <div className="space-y-6 animate-reveal-up">
          <h1 className="text-4xl font-bold leading-tight text-sidebar-primary-foreground" style={{ lineHeight: '1.15' }}>
            Gerencie seus anúncios Meta com inteligência artificial
          </h1>
          <p className="text-lg text-sidebar-foreground max-w-md text-pretty">
            Métricas em tempo real, alertas inteligentes e relatórios automatizados para suas campanhas.
          </p>
        </div>

        <p className="text-sm text-sidebar-foreground/60">
          © 2026 AdMetrics AI. Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-xl shadow-primary/5 animate-reveal-up">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 lg:hidden mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">AdMetrics AI</span>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Entrar na conta' : 'Criar conta'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Use seu e-mail e senha para acessar'
                : 'Preencha os dados para começar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full active:scale-[0.98]" disabled={submitting}>
                {submitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
              </span>{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                {isLogin ? 'Criar conta' : 'Entrar'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
