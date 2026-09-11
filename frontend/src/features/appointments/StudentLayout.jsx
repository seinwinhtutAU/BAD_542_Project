import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import AppShell from '../../components/AppShell';
import PageHeader from '../../components/PageHeader';
import { ToastProvider, useToast } from '../../context/ToastContext';

const PlusIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
const CalendarIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>;
const PillIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>;

export function useStudentData() {
  return useOutletContext();
}

/** The next visit a student actually has to turn up to, or null. */
function nextUpcoming(appointments) {
  const now = Date.now();
  return appointments
    .filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status)
      && new Date(a.appointmentDate).getTime() >= now)
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0] || null;
}

function StudentLayoutInner() {
  const showToast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
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
  }, [showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const prescriptions = appointments
    .filter((a) => a.prescription)
    .map((a) => ({
      ...a.prescription,
      doctor: a.doctor,
      appointmentDate: a.appointmentDate,
      appointmentId: a.id,
    }));

  const next = nextUpcoming(appointments);

  return (
    <AppShell
      navLabel="Student navigation"
      items={[
        {
          to: '/student/book', label: 'Book Appointment', shortLabel: 'Book', icon: PlusIcon,
        },
        {
          to: '/student/appointments', label: 'Appointments', shortLabel: 'Visits', icon: CalendarIcon, count: appointments.length,
        },
        {
          to: '/student/prescriptions', label: 'Prescriptions', shortLabel: 'Medicine', icon: PillIcon, count: prescriptions.length,
        },
      ]}
    >
      <PageHeader
        title="Student"
        description="Book consultations with campus doctors, track appointments, and review your prescriptions."
      />

      {/* One line of context beats four counters: this is what you turn up to. */}
      {next && (
        <div className="context-line">
          <span className="context-line-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>
          <span className="context-line-text">
            Next visit: <strong>Dr. {next.doctor?.name}</strong>
            {' — '}
            <strong>
              {new Date(next.appointmentDate).toLocaleString(undefined, {
                weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </strong>
            {next.doctor?.room ? `, Room ${next.doctor.room}` : ''}
          </span>
          <span className={`badge ${next.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-pending'}`}>
            {next.status}
          </span>
        </div>
      )}

      <Outlet context={{
        appointments, doctors, prescriptions, loading, reload,
      }}
      />
    </AppShell>
  );
}

export default function StudentLayout() {
  return (
    <ToastProvider>
      <StudentLayoutInner />
    </ToastProvider>
  );
}
