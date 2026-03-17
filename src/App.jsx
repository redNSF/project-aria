import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import './App.css';

/* Animation wrapper for page transitions */
const PageTransition = ({ children, transitionKey }) => {
  return (
    <motion.div
      key={transitionKey}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: '100%', height: '100%', originX: 0.5, originY: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

/* Route guard components */
function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const location = useLocation();
  
  const getRootKey = (path) => {
    if (path.startsWith('/login') || path.startsWith('/signup')) return 'auth';
    return 'app';
  };
  
  return (
    <AnimatePresence mode="wait">
      <PageTransition transitionKey={getRootKey(location.pathname)}>
        <Routes location={location}>
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><AuthPage /></PublicRoute>} />

          {/* Dashboard Layout Routes */}
          <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/user/:username" element={<ProfilePage />} />
          </Route>

          {/* Redirect root based on auth state */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
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
