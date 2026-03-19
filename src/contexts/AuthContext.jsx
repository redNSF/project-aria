import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
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
            const data = docSnap.data();
            setUserData(data);

            // Backfill createdAt for existing profiles that don't have it
            if (!data.createdAt) {
              setDoc(userDocRef, { createdAt: new Date().toISOString() }, { merge: true })
                .catch((err) => console.warn('Could not backfill createdAt:', err));
            }
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

        // Safety timeout: if Firestore hasn't responded in 5 seconds, dismiss loading anyway
        setTimeout(() => {
          if (isFirstSnapshot) {
            console.warn('⚠️ Firestore snapshot timed out. Check your Firebase Security Rules!');
            isFirstSnapshot = false;
            setLoading(false);
          }
        }, 5000);
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
          {/* Main Logo */}
          <img src="/polylink.png" alt="PolyLink" style={{
            width: '100%', height: '100%', objectFit: 'contain',
            filter: 'drop-shadow(0 0 15px rgba(167, 139, 250, 0.6))',
            animation: 'floatLogo 2s ease-in-out infinite'
          }} />
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
