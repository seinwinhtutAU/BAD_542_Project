import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../context/AuthContext';
import { loginRequest, isAdConfigured } from '../authConfig';

const ROLE_REDIRECT = {
  STUDENT: '/student',
  DOCTOR: '/doctor',
  ADMIN: '/admin',
};

export default function LoginPage() {
  const { loginDev, loginWithAd, user } = useAuth();
  const msal = useMsal();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(ROLE_REDIRECT[user.role] || '/student', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await loginDev(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Verify the user exists in your database.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdLogin() {
    setError('');
    setNotice('');

    if (!isAdConfigured) {
      setNotice(
        'Azure AD is not configured for this environment (VITE_AZURE_AD_CLIENT_ID is empty). Use the Dev Login below to test.',
      );
      return;
    }

    setLoading(true);
    try {
      if (!msal || !msal.instance) {
        throw new Error('MSAL instance is unavailable');
      }
      const result = await msal.instance.loginPopup(loginRequest);
      await loginWithAd(result.idToken);
    } catch (err) {
      console.error('AD Login Error:', err);
      setError(err.message || 'Microsoft Azure AD sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  }

  function fillDevAccount(devEmail, devPassword) {
    setEmail(devEmail);
    setPassword(devPassword);
    setError('');
    setNotice('');
  }

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              <path d="M12 9v6"/>
              <path d="M9 12h6"/>
            </svg>
          </div>
          <h1>Campus Health Portal</h1>
          <p style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>
            Book appointments, manage prescriptions & healthcare services
          </p>
        </div>

        {error && (
          <div className="alert-banner" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem' }} role="alert">
            <div className="alert-banner-content" style={{ fontSize: '0.825rem' }}>
              <span>{error}</span>
            </div>
          </div>
        )}

        {notice && (
          <div className="alert-banner alert-banner-info" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem' }}>
            <div className="alert-banner-content" style={{ fontSize: '0.825rem' }}>
              <span>{notice}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleAdLogin}
          disabled={loading}
          style={{ width: '100%', marginBottom: '0.5rem', display: 'flex', gap: '0.65rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z"/>
            <path fill="#81bc06" d="M12 1h10v10H12z"/>
            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
            <path fill="#ffba08" d="M12 12h10v10H12z"/>
          </svg>
          <span>Log in with University AD</span>
          {isAdConfigured ? (
            <span className="badge badge-confirmed" style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>Active</span>
          ) : (
            <span className="badge" style={{ fontSize: '0.65rem', marginLeft: 'auto', background: 'rgba(148,163,184,0.2)', color: '#94a3b8' }}>Dev</span>
          )}
        </button>

        <div className="login-divider">Or continue with email</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">University Email</label>
            <input
              id="email-input"
              className="input"
              type="email"
              placeholder="user@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-accounts-section">
          <div className="quick-accounts-title">Quick Dev Fill (Local Testing)</div>
          <div className="quick-accounts-grid">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDevAccount('admin@test.com', 'admin123')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDevAccount('doctor@test.com', 'doctor123')}
            >
              Doctor
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDevAccount('student@test.com', 'student123')}
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
