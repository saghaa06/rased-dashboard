import React from 'react';
import UploadSection from '../components/UploadSection';
import CaptureLocal from '../components/CaptureLocal';

const UploadPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Upload</p>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Transmettre et capturer</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Envoyez des images ou lancez une capture locale en un clin d’œil.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <UploadSection />
        <CaptureLocal />
      </div>
    </div>
  );
};

export default UploadPage;
