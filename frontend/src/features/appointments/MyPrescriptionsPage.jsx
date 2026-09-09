import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import { useStudentData } from './StudentLayout';

export default function MyPrescriptionsPage() {
  const { prescriptions } = useStudentData();

  return (
    <div>
      <div className="card-header">
        <h3>Prescriptions &amp; Medications</h3>
        <span className="badge badge-doctor">
          {prescriptions.length} {prescriptions.length === 1 ? 'Prescription' : 'Prescriptions'}
        </span>
      </div>

      {prescriptions.length === 0 ? (
        <EmptyState
          icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>}
          title="No prescriptions yet"
          description="Once a doctor completes your consultation and prescribes medicine, your medication schedule appears here."
          action={<Link className="btn btn-primary btn-sm" to="/student/appointments">View my appointments</Link>}
        />
      ) : (
        <div className="item-grid">
          {prescriptions.map((p) => (
            <div key={p.id} className="card card-accent-teal">
              <div className="card-header">
                <div>
                  <h4 className="medicine-name">{p.medicine}</h4>
                  <div className="text-sm">
                    Prescribed by Dr. {p.doctor?.name} ({p.doctor?.specialty})
                  </div>
                </div>
                <span className="badge badge-doctor">Prescription #{p.id}</span>
              </div>

              <div className="detail-grid">
                <div>
                  <div className="detail-label">Dosage Regimen</div>
                  <div className="detail-value">{p.dosage}</div>
                </div>
                <div>
                  <div className="detail-label">Usage Instructions</div>
                  <div className="detail-value">{p.instruction || 'Take as directed'}</div>
                </div>
                <div>
                  <div className="detail-label">Consultation Date</div>
                  <div className="detail-value">
                    {new Date(p.appointmentDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
