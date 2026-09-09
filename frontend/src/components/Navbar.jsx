import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleClass = {
    STUDENT: 'badge-student',
    DOCTOR: 'badge-doctor',
    ADMIN: 'badge-admin',
  }[user.role] || 'badge-student';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              <path d="M12 9v6"/>
              <path d="M9 12h6"/>
            </svg>
          </div>
          <div>
            <span>Campus Health</span>
            <span className="navbar-brand-sub">University Medical System</span>
          </div>
        </div>

        <div className="navbar-user">
          <div className="user-badge">
            <div className="user-avatar-circle">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', marginRight: '6px' }}>{user.name}</strong>
              <span className={`badge ${roleClass}`}>{user.role}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={logout}
            title="Log out of your account"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
