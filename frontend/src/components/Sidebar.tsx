import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, LayoutDashboard, Clock3, UploadCloud, Settings2, Camera, Moon, Sun, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';
import Button from './ui/Button';
const logoSvg = require('../assets/logo.svg').default ?? require('../assets/logo.svg');

interface SidebarProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const navItems = [
  { label: 'Tableau de bord', path: '/', icon: LayoutDashboard },
  { label: 'Historique', path: '/history', icon: Clock3 },
  { label: 'Upload', path: '/upload', icon: UploadCloud },
  { label: 'Caméras', path: '/cameras', icon: Camera },
  { label: 'Paramètres', path: '/settings', icon: Settings2 },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onOpen, onClose }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { role } = useRole();

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-30 w-[260px] transform bg-white/95 border-r border-slate-200/80 shadow-soft backdrop-blur-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950/95 lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="flex h-full flex-col justify-between px-4 py-6 sm:px-6">
        <div>
          <div className="mb-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={logoSvg}

                alt="Logo"
                className="h-10 w-10 rounded-xl object-contain bg-white/60 dark:bg-slate-900/40"
              />
              <div>
                <p className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">RASED</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard premium</p>
              </div>


            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-200',
                    isActive ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  )}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              Rôle actuel
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{role === 'admin' ? 'Administrateur' : 'Agent'}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Visualisation et gestion rapide.</p>
          </div>
        </div>
        <div className="space-y-4">
          <Button type="button" variant="secondary" className="w-full justify-start" onClick={toggleTheme}>
            {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />} {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          </Button>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <p className="text-slate-900 font-semibold dark:text-slate-100">Version</p>
            <p className="mt-1">1.0.0</p>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="fixed bottom-6 left-[280px] inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg transition lg:hidden"
        onClick={onClose}
      >
        ×
      </button>
    </aside>
  );
};


export default Sidebar;


