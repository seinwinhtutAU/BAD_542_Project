import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import AlertBanner from '../../components/AlertBanner';
import SlotPicker from './SlotPicker';
import { useToast } from '../../context/ToastContext';
import { useStudentData } from './StudentLayout';

export default function BookAppointmentPage() {
  const { doctors, reload } = useStudentData();
  const showToast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ doctorId: '', appointmentDate: '', symptoms: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);

  async function handleBook(e) {
    e.preventDefault();
    if (!form.doctorId || !form.appointmentDate) {
      showToast('Please choose a doctor and one of their available times.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/api/appointments', form);
      showToast('Appointment successfully scheduled! DeepSeek AI is analyzing symptoms.', 'success');
      setForm({ doctorId: '', appointmentDate: '', symptoms: '' });
      await reload();
      navigate('/student/appointments');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not book appointment';
      showToast(msg, 'error');
      if (err.response?.status === 409) {
        setActiveAlert({ title: 'Booking Suspended', message: msg, severity: 'CRITICAL' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {activeAlert && (
        <AlertBanner alert={activeAlert} onClose={() => setActiveAlert(null)} />
      )}

      <div className="split-layout">
        <div className="card">
          <div className="card-header">
            <h3>Schedule a Doctor Consultation</h3>
            <span className="badge badge-student">Direct Booking</span>
          </div>

          <form onSubmit={handleBook}>
            <div className="form-group">
              <label className="form-label" htmlFor="doctor-select">Select Doctor &amp; Specialty *</label>
              <select
                id="doctor-select"
                className="select"
                value={form.doctorId}
                onChange={(e) => setForm((prev) => ({ ...prev, doctorId: e.target.value, appointmentDate: '' }))}
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

            <SlotPicker
              doctorId={form.doctorId}
              value={form.appointmentDate}
              onChange={(startsAt) => setForm((prev) => ({ ...prev, appointmentDate: startsAt }))}
            />

            <div className="form-group">
              <label className="form-label" htmlFor="symptoms-input">Symptoms &amp; Medical Notes</label>
              <textarea
                id="symptoms-input"
                className="textarea"
                placeholder="Describe what you are experiencing (e.g., headache, fever, sore throat for 3 days)..."
                value={form.symptoms}
                onChange={(e) => setForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                rows="4"
              />
              <div className="ai-summary-box">
                <div className="ai-summary-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                  DeepSeek AI Integration
                </div>
                <p className="ai-summary-content">
                  Reported symptoms are automatically synthesized by DeepSeek AI to provide your attending doctor with a clinical executive summary before your visit.
                </p>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Booking & Processing AI...' : 'Confirm Appointment'}
            </button>
          </form>
        </div>

        <div className="stack">
          <div className="card">
            <h3>Available Physicians</h3>
            {doctors.length === 0 ? (
              <p className="text-sm">No doctors currently listed. Check back shortly.</p>
            ) : (
              <div className="stack-sm">
                {doctors.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`pick-card ${form.doctorId === String(d.id) ? 'selected' : ''}`}
                    aria-pressed={form.doctorId === String(d.id)}
                    onClick={() => setForm((prev) => ({ ...prev, doctorId: String(d.id), appointmentDate: '' }))}
                  >
                    <div className="pick-card-name">Dr. {d.name}</div>
                    <div className="pick-card-specialty">{d.specialty}</div>
                    <div className="pick-card-meta">Clinic Room: <strong>{d.room}</strong></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card info-card">
            <h4>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Emergency Safety Integration
            </h4>
            <p>
              The campus clinic is integrated with the university Emergency Alert Network. If a severe campus alert is active, new appointments will automatically be rescheduled.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
