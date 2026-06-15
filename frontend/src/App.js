import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { RoleProvider } from './contexts/RoleContext';
import AppLayout from './layouts/AppLayout';
import Login from './Login';
import DashboardPage from './pages/Dashboard';
import HistoryPage from './pages/History';
import UploadPage from './pages/Upload';
import CamerasPage from './pages/Cameras';
import SettingsPage from './pages/Settings';
import ImageDetail from './components/ImageDetail';

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/cameras" element={<CamerasPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/image/:id" element={<ImageDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function WrappedApp() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RoleProvider>
          <App />
        </RoleProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
