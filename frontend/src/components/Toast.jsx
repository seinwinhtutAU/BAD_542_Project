import React from 'react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type || 'info'}`}>
          <div style={{ flex: 1 }}>{t.message}</div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px 6px', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
