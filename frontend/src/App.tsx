import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import VoiceChat from './pages/VoiceChat';
import MoodSummary from './pages/MoodSummary';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

const hasSession = () => {
  const token = localStorage.getItem("ec_token");
  const anonId = sessionStorage.getItem("ec_anon_id");
  return Boolean(token || anonId);
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  return hasSession() ? children : <Navigate to="/auth" replace />;
};

const AuthRoute = ({ children }: { children: ReactNode }) => {
  return hasSession() ? <Navigate to="/dashboard" replace /> : children;
};

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/auth' || location.pathname === '/';

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />

        <Route
          path="/auth"
          element={
            <AuthRoute>
              <AuthPage />
            </AuthRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/persona" element={<Navigate to="/profile" replace />} />

        <Route
          path="/chat/:personaId"
          element={
            <ProtectedRoute>
              <VoiceChat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/summary"
          element={
            <ProtectedRoute>
              <MoodSummary />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}