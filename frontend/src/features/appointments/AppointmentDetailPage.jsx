import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import StatusTimeline from '../../components/StatusTimeline';
import PrescriptionSlip from '../../components/PrescriptionSlip';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useStudentData } from './StudentLayout';

const STATUS_CLASS = {
  PENDING: 'badge-pending',
  CONFIRMED: 'badge-confirmed',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
};

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const { appointments, loading, reload } = useStudentData();
  const { user } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);

  const appointment = appointments.find((a) => String(a.id) === String(id));

  if (loading) {
    return <EmptyState title="Loading appointment…" description="Fetching the details of this consultation." />;
  }

  if (!appointment) {
    return (
      <EmptyState
        icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        title="Appointment not found"
        description="This appointment either does not exist or does not belong to your account."
        action={<Link className="btn btn-primary btn-sm" to="/student/appointments">Back to my appointments</Link>}
      />
    );
  }

  const when = new Date(appointment.appointmentDate);
  const [reported] = (appointment.symptoms || '').split('\n\nAI summary:');

  async function confirmCancel() {
    try {
      await apiClient.patch(`/api/appointments/${appointment.id}/cancel`);
      showToast('Appointment cancelled successfully.', 'success');
      setCancelOpen(false);
      await reload();
      navigate('/student/appointments');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel appointment', 'error');
    }
  }

  return (
    <div className="stack-lg">
      <div className="detail-back">
        <Link to="/student/appointments" className="btn btn-secondary btn-sm">
          ← All appointments
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Dr. {appointment.doctor?.name}</h3>
            <p className="text-sm">{appointment.doctor?.specialty} · Room {appointment.doctor?.room}</p>
          </div>
          <span className={`badge ${STATUS_CLASS[appointment.status] || 'badge-pending'}`}>
            {appointment.status}
          </span>
        </div>

        <div className="detail-grid">
          <div>
            <div className="detail-label">Date</div>
            <div className="detail-value">
              {when.toLocaleDateString(undefined, {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </div>
          </div>
          <div>
            <div className="detail-label">Time</div>
            <div className="detail-value">
              {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div>
            <div className="detail-label">Reference</div>
            <div className="detail-value">#{appointment.id}</div>
          </div>
        </div>

        <StatusTimeline status={appointment.status} />

        {appointment.status === 'PENDING' && (
          <div className="card-footer-actions">
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setCancelOpen(true)}>
              Cancel this appointment
            </button>
          </div>
        )}
      </div>

      {reported && (
        <div className="card">
          <h3>What you reported</h3>
          <div className="note-block">
            <p className="note-text">{reported}</p>
          </div>
          <p className="field-hint">
            Your doctor also receives an AI-generated clinical summary of these notes before the visit.
          </p>
        </div>
      )}

      {appointment.prescription ? (
        <div className="card card-accent-teal">
          <div className="card-header">
            <div>
              <h3>Prescription</h3>
              <p className="text-sm">Issued by Dr. {appointment.doctor?.name}</p>
            </div>
            <button type="button" className="btn btn-teal btn-sm" onClick={() => window.print()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print prescription
            </button>
          </div>

          <div className="detail-grid">
            <div>
              <div className="detail-label">Medicine</div>
              <div className="detail-value">{appointment.prescription.medicine}</div>
            </div>
            <div>
              <div className="detail-label">Dosage</div>
              <div className="detail-value">{appointment.prescription.dosage}</div>
            </div>
            <div>
              <div className="detail-label">Instructions</div>
              <div className="detail-value">
                {appointment.prescription.instruction || 'Take as directed'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3>Prescription</h3>
          <p className="text-sm">
            {appointment.status === 'COMPLETED'
              ? 'No medicine was prescribed at this consultation.'
              : 'Any medicine your doctor prescribes will appear here after the consultation.'}
          </p>
        </div>
      )}

      <PrescriptionSlip
        appointment={appointment}
        prescription={appointment.prescription}
        patientName={user?.name}
      />

      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Appointment">
        <p className="modal-body-text">
          Cancel your appointment with <strong>Dr. {appointment.doctor?.name}</strong> on{' '}
          <strong>{when.toLocaleString(undefined, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</strong>?
          The slot will be released for another student.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setCancelOpen(false)}>
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
