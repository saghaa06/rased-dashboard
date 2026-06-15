import React from 'react';
import Parameters from '../components/Parameters';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Paramètres</p>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Configurer le système</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Ajustez les paramètres, les autorisations et le comportement des caméras.</p>
      </div>
      <Parameters />
    </div>
  );
};

export default SettingsPage;
