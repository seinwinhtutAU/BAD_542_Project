import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'PENDING', 'CONFIRMED', 'COMPLETED'
  const [prescriptionModalAppt, setPrescriptionModalAppt] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({ medicine: '', dosage: '', instruction: '' });
  const [submittingPrescription, setSubmittingPrescription] = useState(false);
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = 'info') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  async function loadAppointments() {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/appointments');
      setAppointments(data || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load clinic appointments', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function updateStatus(id, status) {
    try {
      await apiClient.patch(`/api/appointments/${id}/status`, { status });
      showToast(`Appointment status changed to ${status}`, 'success');
      loadAppointments();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  }

  function openPrescriptionModal(appt) {
    setPrescriptionModalAppt(appt);
    if (appt.prescription) {
      setPrescriptionForm({
        medicine: appt.prescription.medicine || '',
        dosage: appt.prescription.dosage || '',
        instruction: appt.prescription.instruction || '',
      });
    } else {
      setPrescriptionForm({ medicine: '', dosage: '', instruction: '' });
    }
  }

  async function handlePrescriptionSubmit(e) {
    e.preventDefault();
    if (!prescriptionModalAppt) return;

    setSubmittingPrescription(true);
    try {
      await apiClient.post('/api/prescriptions', {
        appointmentId: prescriptionModalAppt.id,
        medicine: prescriptionForm.medicine,
        dosage: prescriptionForm.dosage,
        instruction: prescriptionForm.instruction,
      });

      // Also if appointment is not yet completed, optionally prompt or complete it
      showToast('Prescription saved successfully!', 'success');
      setPrescriptionModalAppt(null);
      loadAppointments();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save prescription', 'error');
    } finally {
      setSubmittingPrescription(false);
    }
  }

  // Parse symptoms and AI summary
  function parseSymptoms(symptomsText) {
    if (!symptomsText) return { studentSymptoms: '', aiSummary: '' };
    const parts = symptomsText.split(/\n\nAI summary:\s*/i);
    return {
      studentSymptoms: parts[0] || '',
      aiSummary: parts[1] || '',
    };
  }

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <>
      <Navbar />

      <main className="app-container">
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1>Doctor Clinical Portal</h1>
            <span className="badge badge-doctor">Physician Console</span>
          </div>
          <p>Review incoming student appointments, analyze AI symptom summaries, and issue prescriptions.</p>
        </div>

        {/* Doctor Metrics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div className="stat-value">{appointments.length}</div>
              <div className="stat-label">Total Assigned Patients</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Awaiting Confirmation</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
            </div>
            <div>
              <div className="stat-value">{confirmedCount}</div>
              <div className="stat-label">Scheduled Visits</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <div className="stat-value">{completedCount}</div>
              <div className="stat-label">Completed Consultations</div>
            </div>
          </div>
        </div>

        {/* Filter Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadAppointments}
            disabled={loading}
          >
            ↻ Refresh Schedule
          </button>
        </div>

        {/* Appointment Cards */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2.5rem' }}>Loading appointment schedule...</p>
        ) : filteredAppointments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p>No appointments found under the "{filter}" category.</p>
          </div>
        ) : (
          <div className="item-grid">
            {filteredAppointments.map((a) => {
              const { studentSymptoms, aiSummary } = parseSymptoms(a.symptoms);
              const apptDate = new Date(a.appointmentDate);

              const statusClass = {
                PENDING: 'badge-pending',
                CONFIRMED: 'badge-confirmed',
                COMPLETED: 'badge-completed',
                CANCELLED: 'badge-cancelled',
              }[a.status] || 'badge-pending';

              return (
                <div key={a.id} className="appointment-item">
                  <div className="appointment-header">
                    <div>
                      <div className="appointment-title">
                        {a.student?.name || 'Student Patient'}
                        <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                          ({a.student?.email || 'No email registered'})
                        </span>
                      </div>
                      <div className="appointment-meta">
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                          {apptDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${statusClass}`}>{a.status}</span>

                      {a.status === 'PENDING' && (
                        <button
                          type="button"
                          className="btn btn-teal btn-sm"
                          onClick={() => updateStatus(a.id, 'CONFIRMED')}
                        >
                          Confirm
                        </button>
                      )}

                      {a.status === 'CONFIRMED' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => openPrescriptionModal(a)}
                          >
                            {a.prescription ? 'Edit Prescription' : '+ Add Prescription'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => updateStatus(a.id, 'COMPLETED')}
                          >
                            Mark Completed
                          </button>
                        </>
                      )}

                      {a.status === 'COMPLETED' && !a.prescription && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => openPrescriptionModal(a)}
                        >
                          + Issue Prescription
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Student's Reported Symptoms */}
                  {studentSymptoms && (
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>
                        Reported Symptoms
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#e2e8f0', margin: 0 }}>
                        {studentSymptoms}
                      </p>
                    </div>
                  )}

                  {/* AI Symptom Summary Callout */}
                  {aiSummary && (
                    <div className="ai-summary-box">
                      <div className="ai-summary-header">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                        DeepSeek AI Clinical Summary
                      </div>
                      <div className="ai-summary-content">
                        {aiSummary}
                      </div>
                    </div>
                  )}

                  {/* Existing Prescription Details */}
                  {a.prescription && (
                    <div className="prescription-card">
                      <div className="prescription-header">
                        <span className="prescription-badge">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>
                          Issued Prescription
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          onClick={() => openPrescriptionModal(a)}
                        >
                          Modify
                        </button>
                      </div>
                      <div className="prescription-details">
                        <div>
                          <div className="prescription-label">Medication</div>
                          <div className="prescription-value">{a.prescription.medicine}</div>
                        </div>
                        <div>
                          <div className="prescription-label">Dosage & Frequency</div>
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

        {/* Prescription Modal */}
        <Modal
          isOpen={Boolean(prescriptionModalAppt)}
          onClose={() => setPrescriptionModalAppt(null)}
          title={`Prescribe Medicine — ${prescriptionModalAppt?.student?.name || 'Patient'}`}
        >
          <form onSubmit={handlePrescriptionSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="med-name">Medicine Name & Formulation *</label>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPrescriptionModalAppt(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingPrescription}
              >
                {submittingPrescription ? 'Saving...' : 'Save Prescription'}
              </button>
            </div>
          </form>
        </Modal>

        <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      </main>
    </>
  );
}
