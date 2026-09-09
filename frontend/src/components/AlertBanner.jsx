import React, { useState } from 'react';

export default function AlertBanner({ alert, onClose }) {
  if (!alert) return null;

  const isCritical = alert.severity === 'CRITICAL' || alert.type === 'danger';

  return (
    <div className={`alert-banner ${isCritical ? '' : 'alert-banner-info'}`} role="alert">
      <div className="alert-banner-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <strong className="alert-banner-title">
            {alert.title || (isCritical ? 'Campus Emergency Alert:' : 'Campus Clinic Advisory:')}
          </strong>
          <span>{alert.message || alert.description}</span>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="icon-button"
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}
