import React from 'react';

/**
 * Every empty list explains itself and, where there is something the person can
 * do about it, offers the action rather than leaving them at a dead end.
 */
export default function EmptyState({
  icon, title, description, action,
}) {
  return (
    <div className="card empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
