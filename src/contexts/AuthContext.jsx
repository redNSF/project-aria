import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(undefined); // undefined = loading, null = missing
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up any previous Firestore listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        // Listen to Firestore document updates for the logged-in user
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let isFirstSnapshot = true;

        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData(null);
          }
          // Only dismiss loading AFTER we have Firestore data
          if (isFirstSnapshot) {
            isFirstSnapshot = false;
            setLoading(false);
          }
        }, (error) => {
          console.error("Error fetching user data:", error);
          setUserData(null);
          if (isFirstSnapshot) {
            isFirstSnapshot = false;
            setLoading(false);
          }
        });
      } else {
        // No user logged in — dismiss loading immediately
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  if (loading) return (
// ... (loading UI remains same)
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100vw',
      background: '#0f172a', /* Deep navy base */
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background Aura */}
      <div style={{
        position: 'absolute',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulseAura 3s ease-in-out infinite'
      }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
          zIndex: 1
        }}
      >
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          {/* Main Logo Star */}
          <svg viewBox="0 0 24 24" style={{
            width: '100%', height: '100%',
            fill: '#a78bfa',
            filter: 'drop-shadow(0 0 15px rgba(167, 139, 250, 0.6))',
            animation: 'floatLogo 2s ease-in-out infinite'
          }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            color: '#ffffff', 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: 'linear-gradient(to right, #a78bfa, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            PolyLink
          </span>
          <div style={{ 
            width: '120px', 
            height: '2px', 
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '1px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              width: '40%', height: '100%',
              background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)',
              animation: 'loadingProgress 1.5s infinite linear'
            }} />
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulseAura {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes loadingProgress {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, userData, loading, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
