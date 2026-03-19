import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  query, collection, where, getDocs,
  doc, getDoc, setDoc, deleteDoc,
  serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import EditProfileModal from '../components/EditProfileModal';
import '../pages/Dashboard.css';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } },
  hover: { y: -4, transition: { duration: 0.2 } },
};

export default function ProfilePage() {
  const { username } = useParams();
  const { user, userData } = useAuth();
  const [profileTab, setProfileTab] = useState('uploads');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Upload count
  const [uploadCount, setUploadCount] = useState(0);

  // Derived identity
  const isOwnProfile = !username ||
    (userData?.username?.toLowerCase() === username?.toLowerCase()) ||
    (user?.uid && profileData?.uid === user?.uid);

  const displayUsername = profileData?.username || (isOwnProfile ? userData?.username : null) || username || 'user';
  const displayName     = profileData?.displayName || (isOwnProfile ? (userData?.displayName || user?.displayName) : null) || 'User';
  const displayEmail    = isOwnProfile ? (profileData?.email || user?.email) : null;
  const displayPhoto    = profileData?.photoURL || (isOwnProfile ? user?.photoURL : null);
  const schoolName      = profileData?.schoolName || (isOwnProfile ? userData?.schoolName : '') || '';
  const bio             = profileData?.bio || (isOwnProfile ? userData?.bio : '') || '';
  const website         = profileData?.website || (isOwnProfile ? userData?.website : '') || '';
  const profileUid      = profileData?.uid;

  // ── Profile Fetch ──────────────────────────────────────────
  useEffect(() => {
    if (user === undefined) return;
    let isMounted = true;

    const fetchProfile = async () => {
      setLoadingProfile(true);
      setUserNotFound(false);

      if (!username || userData?.username?.toLowerCase() === username?.toLowerCase()) {
        setProfileData({ uid: user?.uid, ...userData });
        setLoadingProfile(false);
        return;
      }

      try {
        const q = query(collection(db, 'users'), where('username_lowercase', '==', username.toLowerCase()));
        const snap = await getDocs(q);
        if (isMounted) {
          if (!snap.empty) {
            setProfileData({ ...snap.docs[0].data(), uid: snap.docs[0].id });
          } else {
            setUserNotFound(true);
          }
          setLoadingProfile(false);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        if (isMounted) setLoadingProfile(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [username, user?.uid, userData]);

  // ── Real follower / following counts ─────────────────────
  useEffect(() => {
    if (!profileUid) return;
    const followersRef = collection(db, 'users', profileUid, 'followers');
    const followingRef = collection(db, 'users', profileUid, 'following');

    const unsubFollowers = onSnapshot(followersRef, (snap) => setFollowerCount(snap.size));
    const unsubFollowing = onSnapshot(followingRef, (snap) => setFollowingCount(snap.size));

    return () => { unsubFollowers(); unsubFollowing(); };
  }, [profileUid]);

  // ── Am I already following? ───────────────────────────────
  useEffect(() => {
    if (!user?.uid || !profileUid || isOwnProfile) return;
    const followDocRef = doc(db, 'users', profileUid, 'followers', user.uid);
    const unsub = onSnapshot(followDocRef, (snap) => setIsFollowing(snap.exists()));
    return () => unsub();
  }, [user?.uid, profileUid, isOwnProfile]);

  // ── Upload count ──────────────────────────────────────────
  useEffect(() => {
    if (!profileUid) return;
    const q = query(collection(db, 'uploads'), where('authorId', '==', profileUid));
    getDocs(q).then((snap) => setUploadCount(snap.size)).catch(() => {});
  }, [profileUid]);

  // ── Safety timeout fallback ───────────────────────────────
  useEffect(() => {
    if (!loadingProfile) return;
    const t = setTimeout(() => setLoadingProfile(false), 8000);
    return () => clearTimeout(t);
  }, [loadingProfile]);

  // ── Follow / Unfollow ─────────────────────────────────────
  const handleFollow = async () => {
    if (!user?.uid || !profileUid || followLoading) return;
    setFollowLoading(true);
    try {
      const theirFollowerDoc = doc(db, 'users', profileUid, 'followers', user.uid);
      const myFollowingDoc   = doc(db, 'users', user.uid, 'following', profileUid);

      if (isFollowing) {
        await deleteDoc(theirFollowerDoc);
        await deleteDoc(myFollowingDoc);
      } else {
        await setDoc(theirFollowerDoc, { since: serverTimestamp() });
        await setDoc(myFollowingDoc,   { since: serverTimestamp() });
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleProfileUpdate = (newData) => {
    if (isOwnProfile) {
      setProfileData(prev => ({ ...prev, ...newData }));
    }
  };

  // ── User not found screen ─────────────────────────────────
  if (!loadingProfile && userNotFound) {
    return (
      <motion.div className="dash-content profile-view"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '1rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>?</div>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>User not found</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>No account with the username <strong>@{username}</strong> exists.</p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div className="dash-content profile-view" variants={containerVariants} initial="hidden" animate="show">

        {/* Saving Toast */}
        <AnimatePresence>
          {isSaving && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ position: 'fixed', top: '2rem', right: '2rem', background: 'rgba(59, 130, 246, 0.95)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '2rem', zIndex: 2000, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.6s linear infinite' }} />
              Saving changes...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Hero */}
        <motion.div variants={itemVariants} className="profile-hero">
          <div className="profile-hero__avatar">
            {displayPhoto ? (
              <img src={displayPhoto} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              (displayName || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-hero__info">
            <h2>{displayName}</h2>
            <p className="profile-hero__handle">@{displayUsername}</p>
            {bio && <p className="profile-hero__bio">{bio}</p>}
            <div className="profile-hero__meta">
              {schoolName && (
                <span className="profile-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                  {schoolName}
                </span>
              )}
              {website && (
                <a className="profile-meta-item profile-meta-item--link" href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  {website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {displayEmail && isOwnProfile && (
                <span className="profile-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  {displayEmail}
                </span>
              )}
            </div>
            <span className="profile-badge" style={{ marginTop: '10px', display: 'inline-block' }}>PolyLink Member</span>
          </div>
          <div className="profile-hero__actions">
            {isOwnProfile ? (
              <button className="dash-btn-outline" onClick={() => setIsEditingProfile(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </button>
            ) : (
              <button
                className={isFollowing ? 'dash-btn-outline' : 'dash-btn-primary'}
                onClick={handleFollow}
                disabled={followLoading}
                style={{ minWidth: 100 }}
              >
                {followLoading ? '…' : isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
            <button className="dash-btn-outline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Share
            </button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="profile-stats">
          {[
            { value: uploadCount, label: 'Uploads' },
            { value: followerCount, label: 'Followers' },
            { value: followingCount, label: 'Following' },
          ].map(({ value, label }) => (
            <motion.div key={label} whileHover={{ y: -2, transition: { duration: 0.2 } }} className="profile-stat-box">
              <h3>{value}</h3>
              <p>{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="profile-tabs">
          <button className={`profile-tab ${profileTab === 'uploads' ? 'active' : ''}`} onClick={() => setProfileTab('uploads')}>
            {isOwnProfile ? 'My Uploads' : 'Uploads'}
          </button>
          <button className={`profile-tab ${profileTab === 'activity' ? 'active' : ''}`} onClick={() => setProfileTab('activity')}>
            Recent Activity
          </button>
        </motion.div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={profileTab}
            className="dash-grid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {profileTab === 'uploads' ? (
              uploadCount === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 1rem', color: 'rgba(255,255,255,0.3)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</p>
                  <p>{isOwnProfile ? 'You haven\'t uploaded anything yet.' : 'No uploads yet.'}</p>
                </div>
              ) : null
            ) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 1rem', color: 'rgba(255,255,255,0.3)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🕓</p>
                <p>Activity feed coming soon.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <EditProfileModal
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        user={user}
        userData={{ ...userData, ...profileData }}
        onProfileUpdate={handleProfileUpdate}
        setSaving={setIsSaving}
      />
    </>
  );
}
