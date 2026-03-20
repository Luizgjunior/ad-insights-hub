import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import AlertsDrawer from '@/components/ui/AlertsDrawer';
import InstallPWABanner from '@/components/ui/InstallPWABanner';

interface AppShellProps {
  children: ReactNode;
  title: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const location = useLocation();
  const [alertsOpen, setAlertsOpen] = useState(false);

  useEffect(() => {
    document.title = `MetaFlux — ${title}`;
  }, [title]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
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
