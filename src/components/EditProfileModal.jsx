import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, storage } from '../firebase';
import './EditProfileModal.css';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

export default function EditProfileModal({ isOpen, onClose, user, userData, onProfileUpdate, setSaving }) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken | error
  const fileInputRef = useRef(null);
  const usernameDebounceRef = useRef(null);

  // Seed form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(userData?.displayName || user?.displayName || '');
      setUsername(userData?.username || '');
      setBio(userData?.bio || '');
      setWebsite(userData?.website || '');
      setSchoolName(userData?.schoolName || '');
      setAvatarFile(null);
      setAvatarPreview(userData?.photoURL || user?.photoURL || '');
      setUploadProgress(0);
      setError('');
      setUsernameStatus('idle');
    }
  }, [isOpen, userData, user]);

  // Debounced username availability check
  const checkUsername = useCallback((value) => {
    clearTimeout(usernameDebounceRef.current);
    if (!value || value === userData?.username) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-z0-9._]+$/i.test(value)) {
      setUsernameStatus('error');
      return;
    }
    setUsernameStatus('checking');
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const q = query(collection(db, 'users'), where('username_lowercase', '==', value.toLowerCase()));
        const snap = await getDocs(q);
        setUsernameStatus(snap.empty ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 600);
  }, [userData?.username]);

  const handleUsernameChange = (e) => {
    const val = e.target.value.replace(/[^a-z0-9._]/gi, '').toLowerCase();
    setUsername(val);
    checkUsername(val);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Image must be under 5 MB.');
      return;
    }
    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) { setError('Display name is required.'); return; }
    if (!username.trim()) { setError('Username is required.'); return; }
    if (usernameStatus === 'taken') { setError('That username is already taken.'); return; }
    if (usernameStatus === 'error') { setError('Username can only contain letters, numbers, dots, and underscores.'); return; }
    if (usernameStatus === 'checking') { setError('Wait a moment while we check username availability.'); return; }

    setLoading(true);
    if (setSaving) setSaving(true);

    try {
      let finalPhotoURL = avatarPreview;

      // Upload avatar if a new file was picked
      if (avatarFile && user?.uid) {
        const storageRef = ref(storage, `avatars/${user.uid}/avatar`);
        const task = uploadBytesResumable(storageRef, avatarFile);
        await new Promise((resolve, reject) => {
          task.on('state_changed',
            (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
            reject,
            async () => {
              finalPhotoURL = await getDownloadURL(task.snapshot.ref);
              resolve();
            }
          );
        });
        setUploadProgress(0);
      }

      // Update Firebase Auth display name & photo
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: finalPhotoURL || '',
        });
      }

      // Save to Firestore
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: displayName.trim(),
          username: username.trim(),
          username_lowercase: username.trim().toLowerCase(),
          bio: bio.trim(),
          website: website.trim(),
          schoolName: schoolName.trim(),
          photoURL: finalPhotoURL || '',
          lastUpdated: new Date().toISOString(),
        }, { merge: true });
      }

      if (onProfileUpdate) {
        onProfileUpdate({
          displayName: displayName.trim(),
          photoURL: finalPhotoURL || '',
          schoolName: schoolName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          website: website.trim(),
        });
      }
      onClose();
    } catch (err) {
      console.error('Profile save failed:', err);
      setError('Failed to save profile: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      if (setSaving) setSaving(false);
    }
  };

  const usernameHint = {
    idle: null,
    checking: { text: 'Checking availability…', color: 'rgba(255,255,255,0.4)' },
    available: { text: '✓ Username is available', color: '#34d399' },
    taken: { text: '✗ Username already taken', color: '#f87171' },
    error: { text: 'Only letters, numbers, dots and underscores allowed', color: '#f87171' },
  }[usernameStatus];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="epm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="epm-modal"
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Header */}
            <div className="epm-header">
              <h2 className="epm-title">Edit Profile</h2>
              <button className="epm-close" type="button" onClick={onClose} disabled={loading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="epm-form" onSubmit={handleSubmit}>
              {/* Avatar upload */}
              <div className="epm-avatar-section">
                <div className="epm-avatar-wrap" onClick={() => !loading && fileInputRef.current?.click()}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="epm-avatar-img" />
                  ) : (
                    <div className="epm-avatar-placeholder">
                      {(displayName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="epm-avatar-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  {loading && uploadProgress > 0 && (
                    <div className="epm-avatar-progress">
                      <svg viewBox="0 0 36 36" className="epm-progress-ring">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#60a5fa" strokeWidth="3"
                          strokeDasharray={`${2 * Math.PI * 15}`}
                          strokeDashoffset={`${2 * Math.PI * 15 * (1 - uploadProgress / 100)}`}
                          strokeLinecap="round" transform="rotate(-90 18 18)"
                        />
                      </svg>
                      <span>{uploadProgress}%</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                  disabled={loading}
                />
                <div className="epm-avatar-meta">
                  <p className="epm-avatar-label">Profile Photo</p>
                  <p className="epm-avatar-hint">JPG, PNG, GIF · Max 5 MB</p>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div className="epm-error"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fields */}
              <div className="epm-row">
                <div className="epm-field">
                  <label className="epm-label" htmlFor="epm-displayname">Display Name <span className="epm-required">*</span></label>
                  <input id="epm-displayname" className="epm-input" type="text" value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Doe"
                    disabled={loading} maxLength={50} />
                </div>
                <div className="epm-field">
                  <label className="epm-label" htmlFor="epm-username">Username <span className="epm-required">*</span></label>
                  <div className="epm-input-prefix-wrap">
                    <span className="epm-input-prefix">@</span>
                    <input id="epm-username" className={`epm-input epm-input--prefixed epm-input--${usernameStatus}`}
                      type="text" value={username} onChange={handleUsernameChange}
                      placeholder="janedoe" disabled={loading} maxLength={30} />
                    {usernameStatus === 'checking' && <span className="epm-input-spinner" />}
                  </div>
                  {usernameHint && (
                    <p className="epm-field-hint" style={{ color: usernameHint.color }}>{usernameHint.text}</p>
                  )}
                </div>
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-bio">Bio</label>
                <textarea id="epm-bio" className="epm-input epm-textarea" value={bio}
                  onChange={(e) => setBio(e.target.value)} placeholder="Tell the world a little about yourself…"
                  disabled={loading} maxLength={200} rows={3} />
                <p className="epm-char-count">{bio.length}/200</p>
              </div>

              <div className="epm-row">
                <div className="epm-field">
                  <label className="epm-label" htmlFor="epm-school">School / University</label>
                  <input id="epm-school" className="epm-input" type="text" value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)} placeholder="Stanford University"
                    disabled={loading} maxLength={80} />
                </div>
                <div className="epm-field">
                  <label className="epm-label" htmlFor="epm-website">Website</label>
                  <input id="epm-website" className="epm-input" type="url" value={website}
                    onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com"
                    disabled={loading} maxLength={120} />
                </div>
              </div>

              {/* Actions */}
              <div className="epm-actions">
                <button type="button" className="epm-btn epm-btn--cancel" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="epm-btn epm-btn--save" disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}>
                  {loading ? (
                    <><span className="epm-spinner" />{uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Saving…'}</>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
