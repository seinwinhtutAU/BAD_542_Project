import React from 'react';

export default function StatCard({
  icon, tint, color, value, label, valueStyle,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrapper" style={{ background: tint, color }}>
        {icon}
      </div>
      <div>
        <div className="stat-value" style={valueStyle}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
