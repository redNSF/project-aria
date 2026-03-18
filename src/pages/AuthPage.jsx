import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import './AuthPage.css';

function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(location.pathname === '/signup' ? 'signup' : 'login');
  const [phase, setPhase] = useState('idle'); // 'idle' | 'exit' | 'pre-enter' | 'enter'
  const [cardHeight, setCardHeight] = useState('auto');
  const cardRef = useRef(null);
  const innerRef = useRef(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Shared UI state
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync URL changes (browser back/forward)
  useEffect(() => {
    const newMode = location.pathname === '/signup' ? 'signup' : 'login';
    if (newMode !== mode && phase === 'idle') {
      switchMode(newMode);
    }
  }, [location.pathname]);

  const switchMode = (newMode) => {
    if (phase !== 'idle' || newMode === mode) return;

    // Lock current height before exit
    if (cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight);
    }

    // Phase 1: exit current content
    setPhase('exit');

    setTimeout(() => {
      // Phase 2: swap content but position it for enter animation
      setMode(newMode);
      navigate(newMode === 'signup' ? '/signup' : '/login', { replace: true });
      setPhase('pre-enter');

      // Phase 3: trigger height transition & enter animation
      requestAnimationFrame(() => {
        if (cardRef.current && innerRef.current) {
          // Temporarily unset fixed height to measure natural height
          const currentHeight = cardRef.current.style.height;
          cardRef.current.style.height = 'auto';
          const nextHeight = cardRef.current.offsetHeight;
          
          // Restore old fixed height
          cardRef.current.style.height = currentHeight;
          
          // Force reflow
          void cardRef.current.offsetHeight;
          
          // Apply new target height for transition
          setCardHeight(nextHeight);
        }

        requestAnimationFrame(() => {
          setPhase('enter');

          // Phase 4: return to idle after enter completes
          setTimeout(() => {
            setPhase('idle');
            setCardHeight('auto');
          }, 350);
        });
      });
    }, 250);
  };

  // Map Firebase error codes to user-friendly messages
  const friendlyError = (err) => {
    const map = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
    };
    return map[err.code] || err.message || 'Something went wrong. Please try again.';
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithEmail(loginEmail, loginPassword);
      navigate('/', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // --- Validation: Alphanumeric only ---
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError('Username can only contain letters and numbers.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const userCredential = await signUpWithEmail(signupEmail, signupPassword);
      const user = userCredential.user;
      
      // Update Firebase Auth profile (displayName)
      await updateProfile(user, { displayName: displayName });

      // Save user profile information in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        username: username,
        username_lowercase: username.toLowerCase(),
        displayName: displayName,
        email: signupEmail,
        createdAt: new Date().toISOString()
      }, { merge: true });

      navigate('/', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared social buttons
  const socialButtons = (prefix) => (
    <>
      <div className="auth-divider">
        <div className="auth-divider__line" />
        <span className="auth-divider__text">
          {mode === 'login' ? 'or continue with' : 'or sign up with'}
        </span>
        <div className="auth-divider__line" />
      </div>
      <div className="auth-socials">
        <button 
          type="button" 
          className="auth-social-btn" 
          id={`${prefix}-google-btn`}
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <svg viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 5.04c1.69 0 3.22.59 4.42 1.56l3.31-3.31A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.24 6.65l4.03 3.11z"/>
            <path fill="#34A853" d="M16.04 18.01A7.4 7.4 0 0 1 12 19.08a7.08 7.08 0 0 1-6.73-4.84l-4.03 3.11A12 12 0 0 0 12 24c3.05 0 5.8-1.14 7.9-3l-3.86-2.99z"/>
            <path fill="#4A90D9" d="M19.9 21c2.58-2.4 4.1-5.98 4.1-9.96 0-.72-.06-1.36-.17-2.04H12v4.62h6.68a5.86 5.86 0 0 1-2.64 3.39l3.86 2.99z"/>
            <path fill="#FBBC05" d="M5.27 14.24A7.15 7.15 0 0 1 4.92 12c0-.78.13-1.53.35-2.24L1.24 6.65A11.93 11.93 0 0 0 0 12c0 1.93.46 3.76 1.24 5.35l4.03-3.11z"/>
          </svg>
          Google
        </button>
        <button type="button" className="auth-social-btn" id={`${prefix}-github-btn`}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </button>
      </div>
    </>
  );

  return (
    <div className={`auth-page auth-page--${mode}`}>
      {/* Animated background orbs */}
      <div className="auth-orb auth-orb--1" />
      <div className="auth-orb auth-orb--2" />
      <div className="auth-orb auth-orb--3" />

      <div 
        ref={cardRef}
        className={`auth-card ${mode === 'signup' ? 'auth-card--signup' : 'auth-card--login'}`}
        style={{ height: cardHeight === 'auto' ? 'auto' : `${cardHeight}px` }}
      >
        <div ref={innerRef} className={`auth-card__inner ${
          phase === 'exit' ? 'auth-card__inner--exit' :
          phase === 'pre-enter' ? 'auth-card__inner--pre-enter' :
          'auth-card__inner--enter'
        }`}>

          {mode === 'login' ? (
            /* =================== LOGIN FORM =================== */
            <>
              <div className="auth-brand">
                <div className="auth-brand__icon auth-brand__icon--login">
                  <svg viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h1 className="auth-brand__title">PolyVerse</h1>
                <p className="auth-brand__subtitle">Welcome back — sign in to continue</p>
              </div>

              {error && (
                <div className="auth-error" role="alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="login-email">Email</label>
                  <div className="auth-field__input-wrapper">
                    <input
                      id="login-email"
                      className="auth-field__input"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                    <svg className="auth-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="login-password">Password</label>
                  <div className="auth-field__input-wrapper">
                    <input
                      id="login-password"
                      className="auth-field__input"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <svg className="auth-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <button
                      type="button"
                      className="auth-field__toggle-password"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? (
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

                <div className="auth-options">
                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      className="auth-remember__checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="auth-remember__text">Remember me</span>
                  </label>
                  <a href="#" className="auth-forgot">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  className={`auth-submit auth-submit--login${isSubmitting ? ' auth-submit--loading' : ''}`}
                  id="login-submit-btn"
                  disabled={isSubmitting}
                >
                  <span className="auth-submit__text">
                    {isSubmitting ? 'Signing In…' : 'Sign In'}
                    {!isSubmitting && (
                      <svg className="auth-submit__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    )}
                  </span>
                </button>
              </form>

              {socialButtons('login')}

              <p className="auth-switch">
                Don't have an account?
                <button type="button" className="auth-switch__link" onClick={() => switchMode('signup')}>
                  Sign Up
                </button>
              </p>
            </>
          ) : (
            /* =================== SIGNUP FORM =================== */
            <>
              <div className="auth-brand">
                <div className="auth-brand__icon auth-brand__icon--signup">
                  <svg viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <h1 className="auth-brand__title">Join PolyVerse</h1>
                <p className="auth-brand__subtitle">Create your account and start connecting</p>
              </div>

              {error && (
                <div className="auth-error" role="alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSignupSubmit}>
                <div className="auth-row">
                  <div className="auth-field">
                    <label className="auth-field__label" htmlFor="signup-fullname">Full Name</label>
                    <div className="auth-field__input-wrapper">
                      <input
                        id="signup-fullname"
                        className="auth-field__input"
                        type="text"
                        placeholder="Jane Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                      <svg className="auth-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-field__label" htmlFor="signup-username">Username</label>
                    <div className="auth-field__input-wrapper">
                      <input
                        id="signup-username"
                        className="auth-field__input"
                        type="text"
                        placeholder="janedoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                      />
                      <svg className="auth-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="signup-email">Email</label>
                  <div className="auth-field__input-wrapper">
                    <input
                      id="signup-email"
                      className="auth-field__input"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                    <svg className="auth-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="signup-password">Password</label>
                  <div className="auth-field__input-wrapper">
                    <input
                      id="signup-password"
                      className="auth-field__input"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <svg className="auth-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <button
                      type="button"
                      className="auth-field__toggle-password"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? (
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

                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="signup-confirm-password">Confirm Password</label>
                  <div className="auth-field__input-wrapper">
                    <input
                      id="signup-confirm-password"
                      className="auth-field__input"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <svg className="auth-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                </div>

                <label className="auth-terms">
                  <input
                    type="checkbox"
                    className="auth-terms__checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <span className="auth-terms__text">
                    I agree to the <a href="#" className="auth-terms__link">Terms of Service</a> and <a href="#" className="auth-terms__link">Privacy Policy</a>
                  </span>
                </label>

                <button
                  type="submit"
                  className={`auth-submit auth-submit--signup${isSubmitting ? ' auth-submit--loading' : ''}`}
                  id="signup-submit-btn"
                  disabled={isSubmitting}
                >
                  <span className="auth-submit__text">
                    {isSubmitting ? 'Creating Account…' : 'Create Account'}
                    {!isSubmitting && (
                      <svg className="auth-submit__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    )}
                  </span>
                </button>
              </form>

              {socialButtons('signup')}

              <p className="auth-switch">
                Already have an account?
                <button type="button" className="auth-switch__link" onClick={() => switchMode('login')}>
                  Sign In
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
