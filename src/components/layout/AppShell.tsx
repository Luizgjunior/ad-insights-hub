import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import AlertsDrawer from '@/components/ui/AlertsDrawer';
import InstallPWABanner from '@/components/ui/InstallPWABanner';
import { useImpersonation } from '@/hooks/useImpersonation';
import { supabase } from '@/integrations/supabase/client';

interface AppShellProps {
  children: ReactNode;
  title: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const location = useLocation();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { impersonating, stopImpersonation } = useImpersonation();
  const [systemMessage, setSystemMessage] = useState('');

  useEffect(() => {
    document.title = `MetaFlux — ${title}`;
  }, [title]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    supabase.from('system_config').select('value').eq('key', 'system_message').single().then(({ data }) => {
      if (data?.value) setSystemMessage(data.value);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Impersonation banner */}
      {impersonating && (
        <div className="sticky top-0 z-[200] bg-[#7c3aed] text-white px-4 py-2 flex items-center justify-between text-sm font-medium">
          <span>
            👁 Visualizando como <strong>{impersonating.gestorName}</strong> ({impersonating.gestorEmail})
          </span>
          <button
            onClick={stopImpersonation}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-xs transition-colors"
          >
            Sair da impersonação
          </button>
        </div>
      )}

      {/* System message banner */}
      {systemMessage && (
        <div className="sticky top-0 z-[190] bg-warning/10 border-b border-warning/20 text-warning px-4 py-2 text-sm text-center font-medium">
          {systemMessage}
        </div>
      )}

      <Sidebar />
      <TopBar title={title} onOpenAlerts={() => setAlertsOpen(true)} />
      <div className="lg:pl-60">
        <main key={location.pathname} className="min-h-screen pb-20 lg:pb-0 page-enter">
          {children}
        </main>
      </div>
      <BottomNav />
      <InstallPWABanner />
      <AlertsDrawer isOpen={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </div>
  );
}
