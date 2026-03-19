import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

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

function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query recently uploaded materials
    const uploadsRef = collection(db, 'uploads');
    const q = query(uploadsRef, orderBy('createdAt', 'desc'), limit(12));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uploadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUploads(uploadsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching uploads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      className="dash-content"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="dash-content__header">
        <h2>{activeTab === 'home' ? 'Recent Uploads' : activeTab === 'saved' ? 'Saved Materials' : 'My Library'}</h2>
        <div className="dash-filters">
          <button className="dash-filter-btn active">All</button>
          <button className="dash-filter-btn">Computer Science</button>
          <button className="dash-filter-btn">Mathematics</button>
          <button className="dash-filter-btn">Biology</button>
        </div>
      </motion.div>

      {loading ? (
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>Loading materials...</p>
        </div>
      ) : uploads.length > 0 ? (
        <motion.div variants={containerVariants} className="dash-grid">
          <AnimatePresence>
            {uploads.map(mat => (
              <motion.div 
                key={mat.id} 
                variants={itemVariants} 
                whileHover="hover" 
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="dash-card"
              >
                <div className="dash-card__header">
                  <span className="dash-card__type" data-type={mat.fileType || 'PDF'}>
                    {mat.fileType || (mat.files?.[0]?.type?.includes('pdf') ? 'PDF' : 'IMG')}
                  </span>
                  <button className="dash-card__save">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                  </button>
                </div>
                <h3 className="dash-card__title">{mat.title}</h3>
                <div className="dash-card__meta">
                  <div className="dash-card__author">
                    <div className="dash-avatar">
                      {mat.authorPhotoURL ? (
                        <img src={mat.authorPhotoURL} alt={mat.authorName} className="dash-avatar-img" />
                      ) : (
                        (mat.authorName || 'U').charAt(0)
                      )}
                    </div>
                    <span>{mat.authorName || 'Anonymous'}</span>
                  </div>
                  <span className="dash-card__date">
                    {mat.createdAt?.seconds 
                      ? new Date(mat.createdAt.seconds * 1000).toLocaleDateString() 
                      : 'Recently'}
                  </span>
                </div>
                <div className="dash-card__footer">
                  <span className="dash-tag">{mat.subject || 'General'}</span>
                  <a 
                    href={mat.files?.[0]?.url || mat.fileURL} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="dash-btn-outline"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    View
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="dash-empty">
          <div className="dash-empty-icon">📂</div>
          <h3>No uploads yet</h3>
          <p>Be the first to share your study materials!</p>
        </div>
      )}
    </motion.div>
  );
}

export default Dashboard;

