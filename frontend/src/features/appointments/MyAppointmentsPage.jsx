import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { splitSymptomNote } from '../../components/AiSymptomSummary';
import { useToast } from '../../context/ToastContext';
import { useStudentData } from './StudentLayout';

const STATUS_CLASS = {
  PENDING: 'badge-pending',
  CONFIRMED: 'badge-confirmed',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
};

export default function MyAppointmentsPage() {
  const { appointments, loading, reload } = useStudentData();
  const showToast = useToast();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancelModalId, setCancelModalId] = useState(null);

  const filteredAppointments = appointments.filter((a) => (
    statusFilter === 'ALL' ? true : a.status === statusFilter
  ));

  async function confirmCancel() {
    if (!cancelModalId) return;
    try {
      await apiClient.patch(`/api/appointments/${cancelModalId}/cancel`);
      showToast('Appointment cancelled successfully.', 'success');
      setCancelModalId(null);
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel appointment', 'error');
    }
  }

  return (
    <div>
      <div className="section-toolbar">
        <div className="filter-row">
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={reload} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <EmptyState title="Loading appointments…" description="Fetching your consultation history." />
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          title={statusFilter === 'ALL' ? 'No appointments yet' : `No ${statusFilter.toLowerCase()} appointments`}
          description={statusFilter === 'ALL'
            ? 'Book a consultation with a campus physician and it will appear here.'
            : 'Try a different status filter, or book a new consultation.'}
          action={<Link className="btn btn-primary btn-sm" to="/student/book">Book an Appointment</Link>}
        />
      ) : (
        <div className="item-grid">
          {filteredAppointments.map((a) => {
            const apptDate = new Date(a.appointmentDate);
            const { reported } = splitSymptomNote(a.symptoms);

            return (
              <div key={a.id} className="appointment-item">
                <div className="appointment-header">
                  <div>
                    <div className="appointment-title">
                      Dr. {a.doctor?.name || 'Assigned Physician'}
                      <span className="appointment-title-sub">
                        ({a.doctor?.specialty || 'General Practice'})
                      </span>
                    </div>
                    <div className="appointment-meta">
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                        {apptDate.toLocaleDateString(undefined, {
                          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </span>
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>Room: <strong>{a.doctor?.room || 'Clinic Desk'}</strong></span>
                    </div>
                  </div>

                  <div className="row">
                    <span className={`badge ${STATUS_CLASS[a.status] || 'badge-pending'}`}>{a.status}</span>
                    <Link className="btn btn-secondary btn-sm" to={`/student/appointments/${a.id}`}>
                      Details
                    </Link>
                    {a.status === 'PENDING' && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setCancelModalId(a.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {reported && (
                  <div className="note-block">
                    <div className="note-label">Symptoms noted</div>
                    <div className="note-text">{reported}</div>
                  </div>
                )}

                {a.prescription && (
                  <div className="prescription-card">
                    <div className="prescription-header">
                      <span className="prescription-badge">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>
                        Prescribed Medication
                      </span>
                    </div>
                    <div className="prescription-details">
                      <div>
                        <div className="prescription-label">Medicine</div>
                        <div className="prescription-value">{a.prescription.medicine}</div>
                      </div>
                      <div>
                        <div className="prescription-label">Dosage</div>
                        <div className="prescription-value">{a.prescription.dosage}</div>
                      </div>
                      <div>
                        <div className="prescription-label">Instructions</div>
                        <div className="prescription-value">{a.prescription.instruction || 'Follow standard precautions'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(cancelModalId)}
        onClose={() => setCancelModalId(null)}
        title="Cancel Appointment"
      >
        <p className="modal-body-text">
          Are you sure you want to cancel this appointment? This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setCancelModalId(null)}>
            Keep Appointment
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmCancel}>
            Yes, Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
