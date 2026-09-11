import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import AppShell from '../../components/AppShell';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { ToastProvider, useToast } from '../../context/ToastContext';

const UsersIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>;
const PulseIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const CalendarIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>;
const GlobeIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

export function useAdminData() {
  return useOutletContext();
}

function AdminLayoutInner() {
  const showToast = useToast();
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, dRes, aRes] = await Promise.all([
        apiClient.get('/api/users'),
        apiClient.get('/api/doctors'),
        apiClient.get('/api/appointments').catch(() => ({ data: [] })),
      ]);
      setUsers(uRes.data || []);
      setDoctors(dRes.data || []);
      setAppointments(aRes.data || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load administrative data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <AppShell
      navLabel="Admin navigation"
      items={[
        {
          to: '/admin/users', label: 'User Accounts', shortLabel: 'Users', icon: UsersIcon, count: users.length,
        },
        {
          to: '/admin/doctors', label: 'Physicians', shortLabel: 'Doctors', icon: PulseIcon, count: doctors.length,
        },
        {
          to: '/admin/appointments', label: 'All Appointments', shortLabel: 'Visits', icon: CalendarIcon, count: appointments.length,
        },
        {
          to: '/admin/integrations', label: 'Integrations', shortLabel: 'APIs', icon: GlobeIcon,
        },
      ]}
    >
      <PageHeader
        title="Clinic Administration Hub"
        badge="Master Control"
        badgeClass="badge-admin"
        description="Manage system identity accounts, clinical personnel, campus schedules, and external integrations."
      />

      {/* Counts stay here: on the admin screens, counting is the job. */}
      <div className="stats-grid">
        <StatCard
          tint="rgba(168, 85, 247, 0.15)"
          color="#c084fc"
          value={users.length}
          label="Registered Accounts"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard
          tint="rgba(45, 212, 191, 0.15)"
          color="#2dd4bf"
          value={doctors.length}
          label="Active Physicians"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        />
        <StatCard
          tint="rgba(14, 165, 233, 0.15)"
          color="#38bdf8"
          value={appointments.length}
          label="Total Appointments"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
      </div>

      <Outlet context={{
        users, doctors, appointments, loading, reload,
      }}
      />
    </AppShell>
  );
}

export default function AdminLayout() {
  return (
    <ToastProvider>
      <AdminLayoutInner />
    </ToastProvider>
  );
}
