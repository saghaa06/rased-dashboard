import React from 'react';
import UploadSection from '../components/UploadSection';
import LocalCameraLiveBoxCapture from '../components/LocalCameraLiveBoxCapture';

const UploadPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Upload</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Images, vidéo & caméra locale (LIVE)</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <UploadSection />
        <LocalCameraLiveBoxCapture />
      </div>
    </div>
  );
};

export default UploadPage;

