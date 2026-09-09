import React from 'react';

const PANELS = [
  {
    key: 'peer',
    mark: '⇄',
    markClass: 'integration-icon-teal',
    title: 'Peer Team API Integration',
    subtitle: 'Campus Emergency & Safety Alert System',
    blurb: 'Campus safety coordination during emergencies.',
    detailLabel: 'Consuming',
    detailLabelClass: 'detail-heading-sky',
    code: 'GET {PEER_API}/api/alerts',
    detail: 'With header x-api-key: PEER_API_KEY_OUTBOUND. A CRITICAL alert pauses new appointment bookings.',
  },
  {
    key: 'deepseek',
    mark: '✦',
    markClass: 'integration-icon-purple',
    title: 'DeepSeek AI Clinical Assistant',
    subtitle: 'Third-Party AI Integration',
    blurb: 'Processes student self-reported symptoms into concise clinical summaries for attending physicians.',
    detailLabel: 'Model Pipeline',
    detailLabelClass: 'detail-heading-purple',
    detail: 'Automated background prompt synthesizing reported symptoms into chief complaints, duration, and clinical red flags.',
  },
  {
    key: 'identity',
    mark: '#',
    markClass: 'integration-icon-sky',
    title: 'Identity & Secrets Architecture',
    subtitle: 'Azure AD + Azure Key Vault',
    blurb: 'Campus single sign-on (SSO) with Microsoft Active Directory and runtime key retrieval from Azure Key Vault.',
    detailLabel: 'RBAC Hierarchy',
    detailLabelClass: 'detail-heading-sky',
    detail: 'Strict role-based authorization: Students, Doctors, Administrators verified through signed JWT tokens.',
  },
];

export default function IntegrationsPage() {
  return (
    <div className="card">
      <div className="card-header">
        <h3>External &amp; Peer Integrations Architecture</h3>
        <span className="badge badge-student">Course Project Spec</span>
      </div>

      <div className="grid-auto">
        {PANELS.map((panel) => (
          <div key={panel.key} className="integration-panel">
            <div className="integration-panel-head">
              <div className={`integration-icon ${panel.markClass}`}>{panel.mark}</div>
              <div>
                <strong>{panel.title}</strong>
                <span className="text-xs text-muted integration-subtitle">{panel.subtitle}</span>
              </div>
            </div>

            <p className="text-sm">{panel.blurb}</p>

            <div className="integration-detail">
              <div className={panel.detailLabelClass}>{panel.detailLabel}</div>
              {panel.code && <code>{panel.code}</code>}
              <div className="text-muted">{panel.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
