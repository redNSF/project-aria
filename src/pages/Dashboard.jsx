import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../firebase';
import './Dashboard.css';

// Dummy data for the feed
const DUMMY_MATERIALS = [
  { id: 1, title: 'Data Structures Midterm Notes', author: 'Alex Johnson', subject: 'Computer Science', type: 'PDF', date: '2 days ago' },
  { id: 2, title: 'Calculus 3 Practice Integration Problems', author: 'Emma Davis', subject: 'Mathematics', type: 'DOCX', date: '5 hrs ago' },
  { id: 3, title: 'Biology Chapter 4: Cell structure', author: 'Michael R.', subject: 'Biology', type: 'PPTX', date: '1 week ago' },
  { id: 4, title: 'Organic Chemistry Reactions Cheat Sheet', author: 'Sarah Lin', subject: 'Chemistry', type: 'PDF', date: '3 days ago' },
  { id: 5, title: 'World History Exam 1 Study Guide', author: 'David Kim', subject: 'History', type: 'PDF', date: 'Just now' },
  { id: 6, title: 'Intro to Psychology Quizlet Link', author: 'Jessica M.', subject: 'Psychology', type: 'LINK', date: '4 days ago' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Quicker sequence
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

      <motion.div variants={containerVariants} className="dash-grid">
        {DUMMY_MATERIALS.map(mat => (
          <motion.div key={mat.id} variants={itemVariants} whileHover="hover" className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__type" data-type={mat.type}>{mat.type}</span>
              <button className="dash-card__save">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              </button>
            </div>
            <h3 className="dash-card__title">{mat.title}</h3>
            <div className="dash-card__meta">
              <div className="dash-card__author">
                <div className="dash-avatar">{mat.author.charAt(0)}</div>
                <span>{mat.author}</span>
              </div>
              <span className="dash-card__date">{mat.date}</span>
            </div>
            <div className="dash-card__footer">
              <span className="dash-tag">{mat.subject}</span>
              <button className="dash-btn-outline">View</button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;
