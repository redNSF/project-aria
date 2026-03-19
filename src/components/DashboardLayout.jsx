import { useState } from 'react';
import { NavLink, useOutlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../firebase';
import UploadModal from './UploadModal';
import '../pages/Dashboard.css';

export default function DashboardLayout() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleSignOut = async () => {
    await logOut();
    navigate('/login');
  };

  const isMentionMode = searchQuery.startsWith('@');

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (isMentionMode) {
        // @username navigation — strip the @ and go to that profile
        const targetUser = searchQuery.slice(1).trim().toLowerCase();
        if (targetUser) {
          navigate(`/user/${targetUser}`);
          setSearchQuery('');
        }
      }
      // Future: handle regular search queries here
    }
  };

  return (
    <div className="dashboard-page">


      {/* Main Layout */}
      <div className="dash-layout">
        
        {/* --- Sidebar --- */}
        <aside className="dash-sidebar">
          <div className="dash-brand">
            <div className="dash-brand__icon">
              <img src="/polylink.png" alt="PolyLink" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 className="dash-brand__title">PolyLink</h1>
          </div>

          <nav className="dash-nav">
            <NavLink 
              to="/dashboard"
              className={({ isActive }) => `dash-nav__item ${isActive ? 'dash-nav__item--active' : ''}`}
              end
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home Feed
            </NavLink>
            <button className="dash-nav__item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              My Library
            </button>
            <button className="dash-nav__item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              Saved Materials
            </button>
            <NavLink 
              to="/profile"
              className={({ isActive }) => `dash-nav__item ${isActive || location.pathname.startsWith('/profile') ? 'dash-nav__item--active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Profile
            </NavLink>
          </nav>

          <div className="dash-user">
            <div className="dash-user__avatar-wrap">
              {(userData?.photoURL || user?.photoURL) ? (
                <img
                  src={userData?.photoURL || user?.photoURL}
                  alt={userData?.displayName || user?.displayName || 'User'}
                  className="dash-user__avatar-img"
                />
              ) : (
                <div className="dash-user__avatar-initials">
                  {(userData?.displayName || user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="dash-user__info">
              <p className="dash-user__name">{userData?.displayName || user?.displayName || (userData?.username ? `@${userData.username}` : 'User')}</p>
              <span className="dash-user__handle">{userData?.username ? `@${userData.username}` : user?.email}</span>
            </div>
            <button onClick={handleSignOut} className="dash-signout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="dash-main">
          {/* Global Header */}
          <header className="dash-header">
            <div className="dash-search" style={{ position: 'relative' }}>
              {isMentionMode ? (
                <span style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--accent-primary, #a78bfa)', fontWeight: 700, fontSize: '1rem',
                  pointerEvents: 'none', userSelect: 'none'
                }}>@</span>
              ) : (
                <svg className="dash-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              )}
              <input 
                type="text" 
                className="dash-search__input" 
                placeholder={isMentionMode ? 'Type a username and press Enter...' : 'Search or type @username to visit a profile'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={isMentionMode ? { paddingLeft: '2rem', color: 'var(--accent-primary, #a78bfa)' } : {}}
              />
            </div>
            <button className="dash-btn-primary" onClick={() => setUploadOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Upload
            </button>
          </header>

          {/* Page-specific routing content */}
          <div style={{ flex: 1, position: 'relative' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ width: '100%', height: '100%' }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </div>

        </main>
      </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
