import { useState } from 'react';
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

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="dashboard-page">
      {/* Background Orbs (Reused aesthetic from Auth) */}
      <div className="dash-orb dash-orb--1" />
      <div className="dash-orb dash-orb--2" />
      <div className="dash-orb dash-orb--3" />

      {/* Main Layout */}
      <div className="dash-layout">
        
        {/* --- Sidebar --- */}
        <aside className="dash-sidebar">
          <div className="dash-brand">
            <div className="dash-brand__icon">
              <svg viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h1 className="dash-brand__title">PolyVerse</h1>
          </div>

          <nav className="dash-nav">
            <button className={`dash-nav__item ${activeTab === 'home' ? 'dash-nav__item--active' : ''}`} onClick={() => setActiveTab('home')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home Feed
            </button>
            <button className={`dash-nav__item ${activeTab === 'library' ? 'dash-nav__item--active' : ''}`} onClick={() => setActiveTab('library')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              My Library
            </button>
            <button className={`dash-nav__item ${activeTab === 'saved' ? 'dash-nav__item--active' : ''}`} onClick={() => setActiveTab('saved')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              Saved Materials
            </button>
            <button className={`dash-nav__item ${activeTab === 'profile' ? 'dash-nav__item--active' : ''}`} onClick={() => setActiveTab('profile')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Profile
            </button>
          </nav>

          <div className="dash-user">
            <div className="dash-user__info">
              <span className="dash-user__name">{user?.displayName || 'Student'}</span>
              <span className="dash-user__email">{user?.email}</span>
            </div>
            <button onClick={() => logOut()} className="dash-signout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="dash-main">
          
          {/* Header */}
          <header className="dash-header">
            <div className="dash-search">
              <svg className="dash-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                className="dash-search__input" 
                placeholder="Search study materials, notes, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="dash-btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Upload
            </button>
          </header>

          {/* Feed Content */}
          <div className="dash-content">
            <div className="dash-content__header">
              <h2>Recent Uploads</h2>
              <div className="dash-filters">
                <button className="dash-filter-btn active">All</button>
                <button className="dash-filter-btn">Computer Science</button>
                <button className="dash-filter-btn">Mathematics</button>
                <button className="dash-filter-btn">Biology</button>
              </div>
            </div>

            <div className="dash-grid">
              {DUMMY_MATERIALS.map(mat => (
                <div key={mat.id} className="dash-card">
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
                </div>
              ))}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

export default Dashboard;
