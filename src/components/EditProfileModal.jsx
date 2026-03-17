import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import '../pages/Dashboard.css'; // Reusing existing styling for consistency

export default function EditProfileModal({ isOpen, onClose, user, userData, onProfileUpdate }) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Seed form from available data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      // Seed username from context immediately (no network needed)
      setUsername(userData?.username || '');
      setSchoolName(userData?.schoolName || '');

      // Then try Firestore as a fallback (catches fields not yet in context)
      if (user.uid) {
        const fetchUserData = async () => {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              setSchoolName(data.schoolName || userData?.schoolName || '');
              setUsername(data.username || userData?.username || '');
            }
          } catch (err) {
            // Firestore blocked (e.g. ad blocker) — context values already used above
            console.warn('Could not fetch user data from Firestore:', err.message);
          }
        };
        fetchUserData();
      }
    }
  }, [isOpen, user, userData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // ── Optimistic update: close immediately, save in background ──
    if (onProfileUpdate) {
      onProfileUpdate({ displayName, photoURL, schoolName, username });
    }
    onClose();

    // Save to Firebase in the background (non-blocking)
    const saveInBackground = async () => {
      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName, photoURL });
        }
        if (user?.uid) {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            schoolName,
            username,
            displayName,
            photoURL: photoURL || ''
          }, { merge: true });
        }
      } catch (err) {
        // Silent background failure — UI already updated optimistically
        console.warn('Background profile save failed:', err.message);
      }
    };

    saveInBackground();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="auth-modal-overlay" onMouseDown={onClose} style={overlayStyle}>
          <motion.div 
            className="auth-modal-content"
            style={modalStyle}
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Edit Profile</h2>
              <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>

            {error && <div className="auth-error" style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="displayName" style={labelStyle}>Name</label>
                <input 
                  id="displayName"
                  type="text" 
                  className="auth-input" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="e.g. Jane Doe"
                  style={inputStyle}
                />
              </div>

              <div className="form-group">
                <label htmlFor="username" style={labelStyle}>Username</label>
                <input 
                  id="username"
                  type="text" 
                  className="auth-input" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9]/gi, '').toLowerCase())} 
                  placeholder="e.g. janedoe123"
                  style={inputStyle}
                />
              </div>

              <div className="form-group">
                <label htmlFor="schoolName" style={labelStyle}>School/University Name</label>
                <input 
                  id="schoolName"
                  type="text" 
                  className="auth-input" 
                  value={schoolName} 
                  onChange={(e) => setSchoolName(e.target.value)} 
                  placeholder="e.g. Stanford University"
                  style={inputStyle}
                />
              </div>

              <div className="form-group">
                <label htmlFor="photoURL" style={labelStyle}>Profile Picture URL</label>
                <input 
                  id="photoURL"
                  type="url" 
                  className="auth-input" 
                  value={photoURL} 
                  onChange={(e) => setPhotoURL(e.target.value)} 
                  placeholder="https://example.com/photo.jpg"
                  style={inputStyle}
                />
                {photoURL && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Preview:</span>
                    <img src={photoURL} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} onLoad={(e) => e.target.style.display = 'block'} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="dash-btn-outline" 
                  onClick={onClose}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="dash-btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Inline styles for modal specifically to ensure it overlays properly
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalStyle = {
  background: '#0f172a', /* Solid dark blue/gray */
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '1.25rem',
  padding: '2rem',
  width: '100%',
  maxWidth: '500px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  maxHeight: '90vh',
  overflowY: 'auto',
  color: '#ffffff'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '0.875rem',
  fontWeight: 500
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '0.5rem',
  color: '#ffffff',
  fontSize: '1rem',
  transition: 'border-color 0.2s',
  outline: 'none',
  boxSizing: 'border-box'
};
