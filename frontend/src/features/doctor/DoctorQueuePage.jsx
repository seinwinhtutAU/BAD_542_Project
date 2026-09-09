import React, { useState } from 'react';
import apiClient from '../../services/apiClient';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useDoctorData } from './DoctorLayout';

const STATUS_CLASS = {
  PENDING: 'badge-pending',
  CONFIRMED: 'badge-confirmed',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
};

// The AI summary is appended to the symptoms column by the backend rather than
// stored separately, so it has to be split back out for display.
function parseSymptoms(symptomsText) {
  if (!symptomsText) return { studentSymptoms: '', aiSummary: '' };
  const parts = symptomsText.split(/\n\nAI summary:\s*/i);
  return { studentSymptoms: parts[0] || '', aiSummary: parts[1] || '' };
}

export default function DoctorQueuePage() {
  const { appointments, loading, reload } = useDoctorData();
  const showToast = useToast();

  const [filter, setFilter] = useState('ALL');
  const [prescriptionModalAppt, setPrescriptionModalAppt] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({ medicine: '', dosage: '', instruction: '' });
  const [submittingPrescription, setSubmittingPrescription] = useState(false);

  const filteredAppointments = appointments.filter((a) => (
    filter === 'ALL' ? true : a.status === filter
  ));

  async function updateStatus(id, status) {
    try {
      await apiClient.patch(`/api/appointments/${id}/status`, { status });
      showToast(`Appointment status changed to ${status}`, 'success');
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  }

  function openPrescriptionModal(appt) {
    setPrescriptionModalAppt(appt);
    setPrescriptionForm({
      medicine: appt.prescription?.medicine || '',
      dosage: appt.prescription?.dosage || '',
      instruction: appt.prescription?.instruction || '',
    });
  }

  async function handlePrescriptionSubmit(e) {
    e.preventDefault();
    if (!prescriptionModalAppt) return;

    setSubmittingPrescription(true);
    const existing = prescriptionModalAppt.prescription;

    try {
      if (existing) {
        // An appointment can only ever hold one prescription (appointmentId is
        // unique), so editing has to update the existing row, not create another.
        await apiClient.patch(`/api/prescriptions/${existing.id}`, {
          medicine: prescriptionForm.medicine,
          dosage: prescriptionForm.dosage,
          instruction: prescriptionForm.instruction,
        });
      } else {
        await apiClient.post('/api/prescriptions', {
          appointmentId: prescriptionModalAppt.id,
          medicine: prescriptionForm.medicine,
          dosage: prescriptionForm.dosage,
          instruction: prescriptionForm.instruction,
        });
      }

      showToast(existing ? 'Prescription updated successfully!' : 'Prescription saved successfully!', 'success');
      setPrescriptionModalAppt(null);
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save prescription', 'error');
    } finally {
      setSubmittingPrescription(false);
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
              className={`btn btn-sm ${filter === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(st)}
            >
              {st} ({appointments.filter((a) => (st === 'ALL' ? true : a.status === st)).length})
            </button>
          ))}
        </div>

        <button type="button" className="btn btn-outline btn-sm" onClick={reload} disabled={loading}>
          ↻ Refresh Schedule
        </button>
      </div>

      {loading ? (
        <EmptyState title="Loading appointment schedule…" description="Fetching the clinic's consultations." />
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          title={filter === 'ALL' ? 'No appointments in the clinic yet' : `No ${filter.toLowerCase()} appointments`}
          description={filter === 'ALL'
            ? 'Consultations booked by students will appear here as soon as they are made.'
            : 'Try a different status filter to see the rest of the schedule.'}
          action={filter !== 'ALL' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFilter('ALL')}>
              Show all appointments
            </button>
          )}
        />
      ) : (
        <div className="item-grid">
          {filteredAppointments.map((a) => {
            const { studentSymptoms, aiSummary } = parseSymptoms(a.symptoms);
            const apptDate = new Date(a.appointmentDate);
            const statusClass = STATUS_CLASS[a.status] || 'badge-pending';

            return (
              <div key={a.id} className="appointment-item">
                <div className="appointment-header">
                  <div>
                    <div className="appointment-title">
                      {a.student?.name || 'Student Patient'}
                      <span className="appointment-title-sub">
                        ({a.student?.email || 'No email registered'})
                      </span>
                    </div>
                    <div className="appointment-meta">
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                        {apptDate.toLocaleDateString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>
                        Doctor: <strong>Dr. {a.doctor?.name}</strong> (Room {a.doctor?.room})
                      </span>
                    </div>
                  </div>

                  <div className="row">
                    <span className={`badge ${statusClass}`}>{a.status}</span>

                    {a.status === 'PENDING' && (
                      <button type="button" className="btn btn-teal btn-sm" onClick={() => updateStatus(a.id, 'CONFIRMED')}>
                        Confirm
                      </button>
                    )}

                    {a.status === 'CONFIRMED' && (
                      <>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => openPrescriptionModal(a)}>
                          {a.prescription ? 'Edit Prescription' : '+ Add Prescription'}
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => updateStatus(a.id, 'COMPLETED')}>
                          Mark Completed
                        </button>
                      </>
                    )}

                    {a.status === 'COMPLETED' && !a.prescription && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => openPrescriptionModal(a)}>
                        + Issue Prescription
                      </button>
                    )}
                  </div>
                </div>

                {studentSymptoms && (
                  <div className="note-block">
                    <div className="note-label">Reported Symptoms</div>
                    <p className="note-text">{studentSymptoms}</p>
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

                {a.prescription && (
                  <div className="prescription-card">
                    <div className="prescription-header">
                      <span className="prescription-badge">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>
                        Issued Prescription
                      </span>
                      <button type="button" className="btn btn-outline btn-xs" onClick={() => openPrescriptionModal(a)}>
                        Modify
                      </button>
                    </div>
                    <div className="prescription-details">
                      <div>
                        <div className="prescription-label">Medication</div>
                        <div className="prescription-value">{a.prescription.medicine}</div>
                      </div>
                      <div>
                        <div className="prescription-label">Dosage &amp; Frequency</div>
                        <div className="prescription-value">{a.prescription.dosage}</div>
                      </div>
                      <div>
                        <div className="prescription-label">Instructions</div>
                        <div className="prescription-value">{a.prescription.instruction || 'None noted'}</div>
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
        isOpen={Boolean(prescriptionModalAppt)}
        onClose={() => setPrescriptionModalAppt(null)}
        title={`Prescribe Medicine — ${prescriptionModalAppt?.student?.name || 'Patient'}`}
      >
        <form onSubmit={handlePrescriptionSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="med-name">Medicine Name &amp; Formulation *</label>
            <input
              id="med-name"
              className="input"
              placeholder="e.g., Amoxicillin 500mg capsules"
              value={prescriptionForm.medicine}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicine: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="med-dosage">Dosage Instructions *</label>
            <input
              id="med-dosage"
              className="input"
              placeholder="e.g., 1 capsule 3 times daily after meals for 5 days"
              value={prescriptionForm.dosage}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="med-instruction">Additional Clinical Advice / Instructions</label>
            <textarea
              id="med-instruction"
              className="textarea"
              placeholder="e.g., Drink plenty of fluids. Return if fever persists beyond 48 hours."
              value={prescriptionForm.instruction}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instruction: e.target.value })}
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setPrescriptionModalAppt(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submittingPrescription}>
              {submittingPrescription ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
