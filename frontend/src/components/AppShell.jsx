import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const ROLE_BADGE = {
  STUDENT: 'badge-student',
  DOCTOR: 'badge-doctor',
  ADMIN: 'badge-admin',
};

const BrandMark = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    <path d="M12 9v6"/>
    <path d="M9 12h6"/>
  </svg>
);

function NavItems({ items, compact }) {
  return items.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
    >
      {item.icon}
      <span className="nav-link-label">{compact ? item.shortLabel || item.label : item.label}</span>
      {!compact && item.count !== undefined && (
        <span className="nav-link-count">{item.count}</span>
      )}
    </NavLink>
  ));
}

/**
 * Sidebar beside the content on desktop; the same links become a fixed bottom
 * bar under 900px. Which one shows is decided in CSS, so both render.
 *
 * items: [{ to, label, shortLabel, icon, count, end }]
 */
export default function AppShell({ items, navLabel, sectionLabel = 'Sections', children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">{BrandMark}</div>
          <div>
            <span className="sidebar-brand-name">Campus Health</span>
            <span className="sidebar-brand-sub">University Medical System</span>
          </div>
        </div>

        <div>
          <div className="sidebar-section-label">{sectionLabel}</div>
          <nav className="sidebar-nav" aria-label={navLabel}>
            <NavItems items={items} />
          </nav>
        </div>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <div className="user-avatar-circle">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="sidebar-user-name">{user.name}</div>
                <span className={`badge ${ROLE_BADGE[user.role] || 'badge-student'}`}>{user.role}</span>
              </div>
            </div>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={logout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <Navbar />
        <main className="app-container">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label={navLabel}>
        <NavItems items={items} compact />
      </nav>
    </div>
  );
}
