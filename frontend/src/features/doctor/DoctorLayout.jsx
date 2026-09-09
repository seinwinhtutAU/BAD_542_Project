import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import AppShell from '../../components/AppShell';
import PageHeader from '../../components/PageHeader';
import { ToastProvider, useToast } from '../../context/ToastContext';

const QueueIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>;

export function useDoctorData() {
  return useOutletContext();
}

function isToday(value) {
  const d = new Date(value);
  const now = new Date();
  return d.getDate() === now.getDate()
    && d.getMonth() === now.getMonth()
    && d.getFullYear() === now.getFullYear();
}

function DoctorLayoutInner() {
  const showToast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/appointments');
      setAppointments(data || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load clinic appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const todayCount = appointments.filter((a) => isToday(a.appointmentDate) && a.status !== 'CANCELLED').length;
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;

  return (
    <AppShell
      navLabel="Doctor navigation"
      items={[
        {
          to: '/doctor/queue', label: 'Appointments', shortLabel: 'Queue', icon: QueueIcon, count: appointments.length,
        },
      ]}
    >
      <PageHeader
        title="Doctor Clinical Portal"
        badge="Physician Console"
        badgeClass="badge-doctor"
        description="Review incoming student appointments, analyze AI symptom summaries, and issue prescriptions."
      />

      <div className="context-line">
        <span className="context-line-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </span>
        <span className="context-line-text">
          <strong>{todayCount}</strong> {todayCount === 1 ? 'consultation' : 'consultations'} scheduled today
          {pendingCount > 0 && (
            <>
              {' · '}
              <strong>{pendingCount}</strong> waiting for your confirmation
            </>
          )}
        </span>
      </div>

      <Outlet context={{ appointments, loading, reload }} />
    </AppShell>
  );
}

export default function DoctorLayout() {
  return (
    <ToastProvider>
      <DoctorLayoutInner />
    </ToastProvider>
  );
}
