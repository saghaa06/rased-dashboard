import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import Toast from '../components/ui/Toast';


interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();


  return (
    <div className={theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}>
      <div className="min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpen={() => setSidebarOpen(true)} />
        <div className="ml-0 flex min-h-screen flex-col transition-all duration-300 lg:ml-[260px]">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
            <div className="space-y-6">{children}</div>
          </main>
        </div>
      </div>
      <Toast />
    </div>
  );
};

export default AppLayout;
