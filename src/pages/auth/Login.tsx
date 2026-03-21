import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  );

  if (user) return <Navigate to="/gestor" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      if (error.message.includes('Invalid login')) {
        toast.error('E-mail ou senha incorretos');
      } else {
        toast.error(error.message);
      }
    }
    setSubmitting(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-grid-pattern p-4"
      style={{ background: 'var(--background)', position: 'relative' }}
    >
      {/* Spotlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(600px circle at 50% 30%, rgba(47,128,237,0.06), transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div className="w-full max-w-[360px] animate-reveal-up relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="flex h-9 w-9 items-center justify-center"
            style={{ background: 'var(--accent)', borderRadius: 8 }}
          >
            <Zap className="h-[18px] w-[18px] text-white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            MetaFlux
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--surface-1)',
            border: '0.5px solid var(--border-default)',
            borderRadius: 12,
            padding: 28,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 4, letterSpacing: '-0.01em' }}>
            Entrar na sua conta
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24 }}>
            Gerencie suas campanhas Meta com IA
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 15, height: 15, color: 'var(--text-tertiary)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-premium pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 15, height: 15, color: 'var(--text-tertiary)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-premium pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button type="button" style={{ fontSize: 12, color: 'var(--text-tertiary)' }} className="hover:underline underline-offset-2">
                Esqueci minha senha
              </button>
            </div>

            <button type="submit" className="btn-primary w-full justify-center" style={{ height: 40 }} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
            </button>
          </form>

          <div className="divider my-5">ou</div>

          <Link
            to="/register"
            className="btn-ghost w-full justify-center"
          >
            Criar conta de gestor
          </Link>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 24 }}>
          © 2026 MetaFlux
        </p>
      </div>
    </div>
  );
}
