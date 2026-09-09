import React from 'react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type || 'info'}`}>
          <div className="toast-message">{t.message}</div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="icon-button"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
