import { NavLink, useLocation } from 'react-router-dom';
import { Home, BarChart2, Sparkles, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNav() {
  const { profile } = useAuth();
  const location = useLocation();

  const items = profile?.role === 'usuario_cliente'
    ? [
        { to: '/dashboard', icon: Home, label: 'Início' },
        { to: '/dashboard/metricas', icon: BarChart2, label: 'Métricas' },
        { to: '/gestor/relatorios', icon: FileText, label: 'Relatórios' },
        { to: '/settings', icon: User, label: 'Conta' },
      ]
    : [
        { to: '/gestor', icon: Home, label: 'Início' },
        { to: '/gestor/campanhas', icon: BarChart2, label: 'Campanhas' },
        { to: '/gestor/ia', icon: Sparkles, label: 'IA' },
        { to: '/gestor/relatorios', icon: FileText, label: 'Relatórios' },
        { to: '/settings', icon: User, label: 'Conta' },
      ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-surface border-t border-border bottom-nav">
      {items.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
          <NavLink
            key={to}
            to={to}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1.5 px-3 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
