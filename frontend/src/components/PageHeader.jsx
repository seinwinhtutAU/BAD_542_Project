import React from 'react';

export default function PageHeader({ title, badge, badgeClass = 'badge-student', description }) {
  return (
    <div className="page-header">
      <div className="page-header-title">
        <h1>{title}</h1>
        {badge && <span className={`badge ${badgeClass}`}>{badge}</span>}
      </div>
      {description && <p>{description}</p>}
    </div>
  );
}
