import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: integrate with Firebase Auth
    console.log('Login attempt:', { email, rememberMe });
  };

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />
      <div className="login-orb login-orb--3" />

      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand__icon">
            <svg viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h1 className="login-brand__title">PolyVerse</h1>
          <p className="login-brand__subtitle">Welcome back — sign in to continue</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="login-field">
            <label className="login-field__label" htmlFor="login-email">Email</label>
            <div className="login-field__input-wrapper">
              <input
                id="login-email"
                className="login-field__input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <svg className="login-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-field__label" htmlFor="login-password">Password</label>
            <div className="login-field__input-wrapper">
              <input
                id="login-password"
                className="login-field__input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <svg className="login-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <button
                type="button"
                className="login-field__toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="login-options">
            <label className="login-remember">
              <input
                type="checkbox"
                className="login-remember__checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="login-remember__text">Remember me</span>
            </label>
            <a href="#" className="login-forgot">Forgot password?</a>
          </div>

          {/* Submit */}
          <button type="submit" className="login-submit" id="login-submit-btn">
            <span className="login-submit__text">
              Sign In
              <svg className="login-submit__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <div className="login-divider__line" />
          <span className="login-divider__text">or continue with</span>
          <div className="login-divider__line" />
        </div>

        {/* Socials */}
        <div className="login-socials">
          <button type="button" className="login-social-btn" id="login-google-btn">
            <svg viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 5.04c1.69 0 3.22.59 4.42 1.56l3.31-3.31A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.24 6.65l4.03 3.11z"/>
              <path fill="#34A853" d="M16.04 18.01A7.4 7.4 0 0 1 12 19.08a7.08 7.08 0 0 1-6.73-4.84l-4.03 3.11A12 12 0 0 0 12 24c3.05 0 5.8-1.14 7.9-3l-3.86-2.99z"/>
              <path fill="#4A90D9" d="M19.9 21c2.58-2.4 4.1-5.98 4.1-9.96 0-.72-.06-1.36-.17-2.04H12v4.62h6.68a5.86 5.86 0 0 1-2.64 3.39l3.86 2.99z"/>
              <path fill="#FBBC05" d="M5.27 14.24A7.15 7.15 0 0 1 4.92 12c0-.78.13-1.53.35-2.24L1.24 6.65A11.93 11.93 0 0 0 0 12c0 1.93.46 3.76 1.24 5.35l4.03-3.11z"/>
            </svg>
            Google
          </button>
          <button type="button" className="login-social-btn" id="login-github-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        {/* Sign up */}
        <p className="login-signup">
          Don't have an account?
          <Link to="/signup" className="login-signup__link">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
