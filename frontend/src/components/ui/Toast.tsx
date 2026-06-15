import React from 'react';
import { Toaster } from 'react-hot-toast';

const Toast = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '1rem',
          background: '#0f172a',
          color: '#f8fafc',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.18)',
        },
      }}
    />
  );
};

export default Toast;
