import { NavLink, useLocation } from 'react-router-dom';
import { Home, BarChart2, Sparkles, FileText, User } from 'lucide-react';
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
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bottom-nav"
      style={{
        background: 'var(--surface-1)',
        borderTop: '0.5px solid var(--border-subtle)',
      }}
    >
      {items.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3"
            style={{
              fontSize: 10,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              transition: 'color 100ms',
            }}
          >
            <Icon style={{ width: 20, height: 20 }} />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
