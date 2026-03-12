import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import { logOut } from './firebase';
import './App.css';

/* Minimal dashboard placeholder — replace with your real dashboard later */
function Dashboard() {
  const { user } = useAuth();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a1a',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
      gap: '1.25rem',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Welcome to PolyVerse 🎉</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>Signed in as <strong style={{ color: '#a78bfa' }}>{user?.email}</strong></p>
      <button
        onClick={() => logOut()}
        style={{
          padding: '0.7rem 2rem',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '0.95rem',
          fontFamily: "'Inter', sans-serif",
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      >
        Sign Out
      </button>
    </div>
  );
}

/* Route guard components */
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      {/* Redirect root based on auth state */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
