import React from 'react';
import { Menu, BellRing, UserCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';
import Button from './ui/Button';

interface HeaderProps {
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { role } = useRole();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 lg:hidden"
            onClick={onOpenSidebar}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Bienvenue sur le tableau de bord</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestion rapide des passages et des caméras.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900" onClick={toggleTheme}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
            <BellRing className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
            <UserCircle className="h-7 w-7 text-slate-500 dark:text-slate-400" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.username || 'Invité'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{role === 'admin' ? 'Administrateur' : 'Agent'}</p>
            </div>
          </div>
          <Button variant="ghost" className="hidden md:inline-flex" onClick={logout}>Déconnexion</Button>
        </div>
      </div>
    </header>
  );
};

const MoonIcon = () => <span className="inline-flex h-5 w-5 items-center justify-center">🌙</span>;
const SunIcon = () => <span className="inline-flex h-5 w-5 items-center justify-center">☀️</span>;

export default Header;
