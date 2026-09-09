import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import StatusTimeline from '../../components/StatusTimeline';
import { useToast } from '../../context/ToastContext';
import { useDoctorData } from './DoctorLayout';

const STATUS_CLASS = {
  PENDING: 'badge-pending',
  CONFIRMED: 'badge-confirmed',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
};

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams();
  const { appointments, loading, reload } = useDoctorData();
  const showToast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ medicine: '', dosage: '', instruction: '' });
  const [saving, setSaving] = useState(false);

  const appointment = appointments.find((a) => String(a.id) === String(id));

  if (loading) {
    return <EmptyState title="Loading consultation…" description="Fetching this appointment." />;
  }

  if (!appointment) {
    return (
      <EmptyState
        icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        title="Appointment not found"
        description="This consultation is not in the clinic schedule."
        action={<Link className="btn btn-primary btn-sm" to="/doctor/queue">Back to the queue</Link>}
      />
    );
  }

  const when = new Date(appointment.appointmentDate);
  const parts = (appointment.symptoms || '').split(/\n\nAI summary:\s*/i);
  const reported = parts[0] || '';
  const aiSummary = parts[1] || '';

  function openModal() {
    setForm({
      medicine: appointment.prescription?.medicine || '',
      dosage: appointment.prescription?.dosage || '',
      instruction: appointment.prescription?.instruction || '',
    });
    setModalOpen(true);
  }

  async function updateStatus(status) {
    try {
      await apiClient.patch(`/api/appointments/${appointment.id}/status`, { status });
      showToast(`Appointment status changed to ${status}`, 'success');
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  }

  async function savePrescription(e) {
    e.preventDefault();
    setSaving(true);
    const existing = appointment.prescription;

    try {
      if (existing) {
        await apiClient.patch(`/api/prescriptions/${existing.id}`, form);
      } else {
        await apiClient.post('/api/prescriptions', { appointmentId: appointment.id, ...form });
      }
      showToast(existing ? 'Prescription updated.' : 'Prescription saved.', 'success');
      setModalOpen(false);
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save prescription', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack-lg">
      <div className="detail-back">
        <Link to="/doctor/queue" className="btn btn-secondary btn-sm">← Appointment queue</Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>{appointment.student?.name || 'Student Patient'}</h3>
            <p className="text-sm">{appointment.student?.email || 'No email registered'}</p>
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
            <div className="detail-value">{when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div>
            <div className="detail-label">Room</div>
            <div className="detail-value">{appointment.doctor?.room || '—'}</div>
          </div>
        </div>

        <StatusTimeline status={appointment.status} />

        <div className="card-footer-actions">
          {appointment.status === 'PENDING' && (
            <button type="button" className="btn btn-teal btn-sm" onClick={() => updateStatus('CONFIRMED')}>
              Confirm appointment
            </button>
          )}
          {appointment.status === 'CONFIRMED' && (
            <>
              <button type="button" className="btn btn-primary btn-sm" onClick={openModal}>
                {appointment.prescription ? 'Edit prescription' : 'Add prescription'}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => updateStatus('COMPLETED')}>
                Mark completed
              </button>
            </>
          )}
          {appointment.status === 'COMPLETED' && !appointment.prescription && (
            <button type="button" className="btn btn-primary btn-sm" onClick={openModal}>
              Issue prescription
            </button>
          )}
        </div>
      </div>

      {reported && (
        <div className="card">
          <h3>Reported symptoms</h3>
          <div className="note-block">
            <p className="note-text">{reported}</p>
          </div>
        </div>
      )}

      {aiSummary && (
        <div className="ai-summary-box">
          <div className="ai-summary-header">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
            DeepSeek AI Clinical Summary
          </div>
          <div className="ai-summary-content">{aiSummary}</div>
        </div>
      )}

      {appointment.prescription && (
        <div className="card card-accent-teal">
          <div className="card-header">
            <h3>Issued prescription</h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={openModal}>Modify</button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Medication</div>
              <div className="detail-value">{appointment.prescription.medicine}</div>
            </div>
            <div>
              <div className="detail-label">Dosage &amp; frequency</div>
              <div className="detail-value">{appointment.prescription.dosage}</div>
            </div>
            <div>
              <div className="detail-label">Instructions</div>
              <div className="detail-value">{appointment.prescription.instruction || 'None noted'}</div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Prescribe Medicine — ${appointment.student?.name || 'Patient'}`}
      >
        <form onSubmit={savePrescription}>
          <div className="form-group">
            <label className="form-label" htmlFor="detail-med">Medicine Name &amp; Formulation *</label>
            <input
              id="detail-med"
              className="input"
              placeholder="e.g., Amoxicillin 500mg capsules"
              value={form.medicine}
              onChange={(e) => setForm({ ...form, medicine: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="detail-dosage">Dosage Instructions *</label>
            <input
              id="detail-dosage"
              className="input"
              placeholder="e.g., 1 capsule 3 times daily after meals for 5 days"
              value={form.dosage}
              onChange={(e) => setForm({ ...form, dosage: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="detail-instruction">Additional Clinical Advice</label>
            <textarea
              id="detail-instruction"
              className="textarea"
              placeholder="e.g., Drink plenty of fluids. Return if fever persists beyond 48 hours."
              value={form.instruction}
              onChange={(e) => setForm({ ...form, instruction: e.target.value })}
              rows="3"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
