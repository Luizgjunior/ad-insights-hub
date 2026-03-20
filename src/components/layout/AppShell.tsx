import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import { useEffect } from 'react';

interface AppShellProps {
  children: ReactNode;
  title: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  useEffect(() => {
    document.title = `MetaFlux — ${title}`;
  }, [title]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar title={title} />
      <div className="lg:pl-60">
        <main className="min-h-screen pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
