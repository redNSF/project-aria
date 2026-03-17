import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import '../pages/Dashboard.css'; // Reusing existing styling for consistency

export default function EditProfileModal({ isOpen, onClose, user, onProfileUpdate }) {
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch current Firestore user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setSchoolName(userDocSnap.data().schoolName || '');
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      };
      
      fetchUserData();
    }
  }, [isOpen, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Update Firebase Auth Profile (Name & Photo)
      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: photoURL
      });

      // 2. Update Firestore Document (School Name)
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        schoolName: schoolName
      }, { merge: true });

      // Trigger re-render in parent component
      if (onProfileUpdate) {
        onProfileUpdate({
          displayName,
          photoURL,
          schoolName
        });
      }
      
      onClose(); // Close modal upon success
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="auth-modal-overlay" onClick={onClose} style={overlayStyle}>
        <motion.div 
          className="auth-modal-content"
          style={modalStyle}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Edit Profile</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
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
                style={{ flex: 1 }}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="dash-btn-primary" 
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
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
