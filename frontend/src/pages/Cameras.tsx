import React from 'react';
import CamerasList from '../components/CamerasList';

const CamerasPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Caméras</p>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Administration des caméras</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Ajoutez, modifiez ou supprimez des caméras IP en fonction de votre rôle.</p>
      </div>
      <CamerasList />
    </div>
  );
};

export default CamerasPage;
