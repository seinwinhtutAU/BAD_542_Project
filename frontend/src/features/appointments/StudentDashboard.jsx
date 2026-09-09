import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import Navbar from '../../components/Navbar';
import AlertBanner from '../../components/AlertBanner';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

export default function StudentDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctorId: '', appointmentDate: '', symptoms: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('book'); // 'book', 'appointments', 'prescriptions'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  const [cancelModalId, setCancelModalId] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);

  function showToast(message, type = 'info') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [apptsRes, docsRes] = await Promise.all([
        apiClient.get('/api/appointments/mine'),
        apiClient.get('/api/doctors'),
      ]);
      setAppointments(apptsRes.data || []);
      setDoctors(docsRes.data || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load appointments or doctors', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleBook(e) {
    e.preventDefault();
    if (!form.doctorId || !form.appointmentDate) {
      showToast('Please select a doctor and appointment date & time.', 'error');
      return;
    }

    const selectedTime = new Date(form.appointmentDate).getTime();
    if (selectedTime < Date.now()) {
      showToast('Appointment date & time must be in the future.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/api/appointments', form);
      showToast('Appointment successfully scheduled! DeepSeek AI is analyzing symptoms.', 'success');
      setForm({ doctorId: '', appointmentDate: '', symptoms: '' });
      setActiveTab('appointments');
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not book appointment';
      showToast(msg, 'error');
      if (err.response?.status === 409) {
        setActiveAlert({
          title: 'Booking Suspended',
          message: msg,
          severity: 'CRITICAL',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCancel() {
    if (!cancelModalId) return;
    try {
      await apiClient.patch(`/api/appointments/${cancelModalId}/cancel`);
      showToast('Appointment cancelled successfully.', 'success');
      setCancelModalId(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel appointment', 'error');
    }
  }

  const prescriptions = appointments
    .filter((a) => a.prescription)
    .map((a) => ({
      ...a.prescription,
      doctor: a.doctor,
      appointmentDate: a.appointmentDate,
      appointmentId: a.id,
    }));

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;

  const nowString = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <>
      <Navbar />

      <main className="app-container">
        {activeAlert && (
          <AlertBanner alert={activeAlert} onClose={() => setActiveAlert(null)} />
        )}

        <div style={{ marginBottom: '1.75rem' }}>
          <h1>Student Health Portal</h1>
          <p>Book consultations with campus doctors, track appointments, and review your prescriptions.</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div className="stat-value">{appointments.length}</div>
              <div className="stat-label">Total Appointments</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Pending Approval</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <div className="stat-value">{confirmedCount}</div>
              <div className="stat-label">Confirmed Visits</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(13, 148, 136, 0.15)', color: '#2dd4bf' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
            </div>
            <div>
              <div className="stat-value">{prescriptions.length}</div>
              <div className="stat-label">Prescriptions</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="tabs-nav" aria-label="Student Navigation">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => setActiveTab('book')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Book Appointment
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
            My Appointments ({appointments.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>
            My Prescriptions ({prescriptions.length})
          </button>
        </nav>

        {/* Tab 1: Book Appointment */}
        {activeTab === 'book' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <h3>Schedule a Doctor Consultation</h3>
                <span className="badge badge-student">Direct Booking</span>
              </div>

              <form onSubmit={handleBook}>
                <div className="form-group">
                  <label className="form-label" htmlFor="doctor-select">Select Doctor & Specialty *</label>
                  <select
                    id="doctor-select"
                    className="select"
                    value={form.doctorId}
                    onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                    required
                  >
                    <option value="">Choose a university physician...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {`Dr. ${d.name} — ${d.specialty} (Room ${d.room})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="appointment-date">Preferred Date & Time *</label>
                  <input
                    id="appointment-date"
                    className="input"
                    type="datetime-local"
                    min={nowString}
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                    Clinic operating hours: Monday – Friday, 08:30 AM – 05:00 PM
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="symptoms-input">Symptoms & Medical Notes</label>
                  <textarea
                    id="symptoms-input"
                    className="textarea"
                    placeholder="Describe what you are experiencing (e.g., headache, fever, sore throat for 3 days)..."
                    value={form.symptoms}
                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                    rows="4"
                  />
                  <div className="ai-summary-box" style={{ marginTop: '8px' }}>
                    <div className="ai-summary-header">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                      DeepSeek AI Integration
                    </div>
                    <p className="ai-summary-content" style={{ fontSize: '0.8rem' }}>
                      Reported symptoms are automatically synthesized by DeepSeek AI to provide your attending doctor with a clinical executive summary before your visit.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Booking & Processing AI...' : 'Confirm Appointment'}
                </button>
              </form>
            </div>

            {/* Doctor Info Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Available Physicians</h3>
                {doctors.length === 0 ? (
                  <p style={{ fontSize: '0.875rem' }}>No doctors currently listed. Check back shortly.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {doctors.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          padding: '0.75rem',
                          background: form.doctorId === String(d.id) ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${form.doctorId === String(d.id) ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                        onClick={() => setForm({ ...form, doctorId: String(d.id) })}
                      >
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          Dr. {d.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                          {d.specialty}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Clinic Room: <strong>{d.room}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ background: 'rgba(13, 148, 136, 0.05)', borderColor: 'rgba(13, 148, 136, 0.2)' }}>
                <h4 style={{ color: '#2dd4bf', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Emergency Safety Integration
                </h4>
                <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                  The campus clinic is integrated with the university Emergency Alert Network. If a severe campus alert is active, new appointments will automatically be rescheduled.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My Appointments */}
        {activeTab === 'appointments' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={loadData}
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Loading appointments...</p>
            ) : filteredAppointments.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <p style={{ marginBottom: '1rem' }}>No appointments found matching your filter.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab('book')}>
                  Book an Appointment Now
                </button>
              </div>
            ) : (
              <div className="item-grid">
                {filteredAppointments.map((a) => {
                  const statusClass = {
                    PENDING: 'badge-pending',
                    CONFIRMED: 'badge-confirmed',
                    COMPLETED: 'badge-completed',
                    CANCELLED: 'badge-cancelled',
                  }[a.status] || 'badge-pending';

                  const apptDate = new Date(a.appointmentDate);

                  return (
                    <div key={a.id} className="appointment-item">
                      <div className="appointment-header">
                        <div>
                          <div className="appointment-title">
                            Dr. {a.doctor?.name || 'Assigned Physician'}
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '8px' }}>
                              ({a.doctor?.specialty || 'General Practice'})
                            </span>
                          </div>
                          <div className="appointment-meta">
                            <span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                              {apptDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>
                              Room: <strong>{a.doctor?.room || 'Clinic Desk'}</strong>
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className={`badge ${statusClass}`}>{a.status}</span>
                          {a.status === 'PENDING' && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setCancelModalId(a.id)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Symptoms display */}
                      {a.symptoms && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                          <strong style={{ color: 'var(--text-secondary)' }}>Symptoms noted: </strong>
                          <span style={{ color: 'var(--text-primary)' }}>{a.symptoms.split('\n\nAI summary:')[0]}</span>
                        </div>
                      )}

                      {/* Attached Prescription (if present) */}
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
          </div>
        )}

        {/* Tab 3: My Prescriptions */}
        {activeTab === 'prescriptions' && (
          <div>
            <div className="card-header" style={{ marginBottom: '1.25rem' }}>
              <h3>Prescriptions & Medications</h3>
              <span className="badge badge-doctor">{prescriptions.length} Active Prescriptions</span>
            </div>

            {prescriptions.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
                  <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
                </svg>
                <p>No prescriptions have been issued to you yet.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Once your doctor completes a consultation and prescribes medicine, your medication schedule will appear here.
                </p>
              </div>
            ) : (
              <div className="item-grid">
                {prescriptions.map((p) => (
                  <div key={p.id} className="card" style={{ borderLeft: '4px solid var(--teal)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.2rem', color: '#2dd4bf' }}>{p.medicine}</h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Prescribed by Dr. {p.doctor?.name} ({p.doctor?.specialty})
                        </div>
                      </div>
                      <span className="badge badge-doctor">Prescription #{p.id}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.25)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dosage Regimen</div>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.dosage}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Usage Instructions</div>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.instruction || 'Take as directed'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultation Date</div>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {new Date(p.appointmentDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        <Modal
          isOpen={Boolean(cancelModalId)}
          onClose={() => setCancelModalId(null)}
          title="Cancel Appointment"
        >
          <p style={{ marginBottom: '1.25rem' }}>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCancelModalId(null)}>
              Keep Appointment
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmCancel}>
              Yes, Cancel
            </button>
          </div>
        </Modal>

        <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      </main>
    </>
  );
}
