import React, { useState } from 'react';
import VideoUploadAndProcess from './VideoUploadAndProcess';


const VideoProcessOnDashboard: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 active:bg-sky-800/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        type="button"
        onClick={() => setOpen(true)}
      >
        Upload vidéo MP4
      </button>


      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              width: '100%',
              maxWidth: 820,
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
              >
                Fermer
              </button>
            </div>
            <VideoUploadAndProcess />
          </div>
        </div>
      )}
    </>
  );
};

export default VideoProcessOnDashboard;

