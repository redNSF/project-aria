import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import '../pages/Dashboard.css'; // Reuses main dashboard styles

// Dummy data for testing the user route
const DUMMY_USER_MATERIALS = [
  { id: 101, title: 'My React Notes', subject: 'Web Dev', type: 'PDF', date: '2 days ago' },
  { id: 102, title: 'Draft English Essay', subject: 'English', type: 'DOCX', date: '1 week ago' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } },
  hover: { y: -4, transition: { duration: 0.2 } }
};

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profileTab, setProfileTab] = useState('uploads');

  // Verify if we are looking at our own profile or someone else's
  const isOwnProfile = !username || username === user?.displayName || (!user?.displayName && username === 'student');
  const displayUsername = isOwnProfile ? (user?.displayName || 'Student User') : username;
  const displayEmail = isOwnProfile ? user?.email : 'Hidden';

  return (
    <motion.div 
      className="dash-content profile-view"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Profile Header Hero */}
      <motion.div variants={itemVariants} className="profile-hero">
        <div className="profile-hero__avatar">
          {displayUsername.charAt(0).toUpperCase()}
        </div>
        <div className="profile-hero__info">
          <h2>{displayUsername}</h2>
          <p className="profile-hero__email">{displayEmail}</p>
          <span className="profile-badge">PolyVerse Member</span>
        </div>
        <div className="profile-hero__actions">
          {isOwnProfile ? (
            <button className="dash-btn-outline">Edit Profile</button>
          ) : (
            <button className="dash-btn-outline">Follow</button>
          )}
          <button className="dash-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="profile-stats">
        <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }} className="profile-stat-box">
          <h3>24</h3>
          <p>Materials Uploaded</p>
        </motion.div>
        <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }} className="profile-stat-box">
          <h3>142</h3>
          <p>Total Saves</p>
        </motion.div>
        <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }} className="profile-stat-box">
          <h3>89</h3>
          <p>Followers</p>
        </motion.div>
        <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }} className="profile-stat-box">
          <h3>12</h3>
          <p>Following</p>
        </motion.div>
      </motion.div>

      {/* Profile Tabs */}
      <motion.div variants={itemVariants} className="profile-tabs">
        <button 
          className={`profile-tab ${profileTab === 'uploads' ? 'active' : ''}`}
          onClick={() => setProfileTab('uploads')}
        >
          {isOwnProfile ? 'My Uploads' : 'Uploads'}
        </button>
        <button 
          className={`profile-tab ${profileTab === 'interactions' ? 'active' : ''}`}
          onClick={() => setProfileTab('interactions')}
        >
          Recent Activity
        </button>
      </motion.div>

      {/* User Content Grid */}
      <motion.div variants={containerVariants} className="dash-grid">
        {DUMMY_USER_MATERIALS.map(mat => (
          <motion.div key={mat.id} variants={itemVariants} whileHover="hover" className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__type" data-type={mat.type}>{mat.type}</span>
              <button className="dash-card__save">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              </button>
            </div>
            <h3 className="dash-card__title">{mat.title}</h3>
            <div className="dash-card__meta">
              <span className="dash-card__date">{mat.date}</span>
            </div>
            <div className="dash-card__footer">
              <span className="dash-tag">{mat.subject}</span>
              {isOwnProfile ? (
                <button className="dash-btn-outline">Edit</button>
              ) : (
                <button className="dash-btn-outline">View</button>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
