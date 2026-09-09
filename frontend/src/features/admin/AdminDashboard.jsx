import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'doctors', 'appointments', 'integrations'
  const [toasts, setToasts] = useState([]);

  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('ALL');

  // Doctor Form Modal (for Add and Edit)
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({ name: '', specialty: '', room: '' });

  // Delete Confirmation Modals
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deleteDoctorTarget, setDeleteDoctorTarget] = useState(null);
  const [cancelAppointmentTarget, setCancelAppointmentTarget] = useState(null);

  function showToast(message, type = 'info') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  async function loadAllData() {
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
  }

  useEffect(() => {
    loadAllData();
  }, []);

  // User Actions
  async function handleChangeRole(userId, newRole) {
    try {
      await apiClient.patch(`/api/users/${userId}/role`, { role: newRole });
      showToast(`User role updated to ${newRole}`, 'success');
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user role', 'error');
    }
  }

  async function confirmDeleteUser() {
    if (!deleteUserTarget) return;
    try {
      await apiClient.delete(`/api/users/${deleteUserTarget.id}`);
      showToast(`User "${deleteUserTarget.name}" was deleted.`, 'success');
      setDeleteUserTarget(null);
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  }

  // Doctor Actions
  function openAddDoctorModal() {
    setEditingDoctor(null);
    setDoctorForm({ name: '', specialty: '', room: '' });
    setDoctorModalOpen(true);
  }

  function openEditDoctorModal(doctor) {
    setEditingDoctor(doctor);
    setDoctorForm({ name: doctor.name, specialty: doctor.specialty, room: doctor.room });
    setDoctorModalOpen(true);
  }

  async function handleDoctorFormSubmit(e) {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await apiClient.patch(`/api/doctors/${editingDoctor.id}`, doctorForm);
        showToast(`Dr. ${doctorForm.name} updated successfully.`, 'success');
      } else {
        await apiClient.post('/api/doctors', doctorForm);
        showToast(`Dr. ${doctorForm.name} added to clinic staff.`, 'success');
      }
      setDoctorModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save doctor', 'error');
    }
  }

  async function confirmDeleteDoctor() {
    if (!deleteDoctorTarget) return;
    try {
      await apiClient.delete(`/api/doctors/${deleteDoctorTarget.id}`);
      showToast(`Dr. ${deleteDoctorTarget.name} removed from system.`, 'success');
      setDeleteDoctorTarget(null);
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete doctor', 'error');
    }
  }

  // Appointment Actions
  async function handleUpdateAppointmentStatus(id, status) {
    try {
      await apiClient.patch(`/api/appointments/${id}/status`, { status });
      showToast(`Appointment status changed to ${status}`, 'success');
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update appointment status', 'error');
    }
  }

  async function confirmCancelAppointment() {
    if (!cancelAppointmentTarget) return;
    try {
      await apiClient.patch(`/api/appointments/${cancelAppointmentTarget.id}/cancel`);
      showToast('Appointment cancelled by administrator.', 'success');
      setCancelAppointmentTarget(null);
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel appointment', 'error');
    }
  }

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredDoctors = doctors.filter((d) => {
    return (
      d.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.room?.toLowerCase().includes(doctorSearch.toLowerCase())
    );
  });

  const filteredAppointments = appointments.filter((a) => {
    if (appointmentFilter === 'ALL') return true;
    return a.status === appointmentFilter;
  });

  return (
    <>
      <Navbar />

      <main className="app-container">
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1>Clinic Administration Hub</h1>
            <span className="badge badge-admin">Master Control</span>
          </div>
          <p>Manage system identity accounts, clinical personnel, campus schedules, and peer integrations.</p>
        </div>

        {/* System Summary Metrics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Registered Accounts</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(45, 212, 191, 0.15)', color: '#2dd4bf' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div>
              <div className="stat-value">{doctors.length}</div>
              <div className="stat-label">Active Physicians</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div className="stat-value">{appointments.length}</div>
              <div className="stat-label">Total Appointments</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.25rem', color: '#34d399', paddingTop: '4px' }}>OPERATIONAL</div>
              <div className="stat-label">RBAC & API Services</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="tabs-nav" aria-label="Admin Navigation">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            User Accounts ({users.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Physicians ({doctors.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
            All Appointments ({appointments.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            External & Peer Integrations
          </button>
        </nav>

        {/* Tab 1: User Management */}
        {activeTab === 'users' && (
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3>User Accounts & RBAC Assignment</h3>
                <p style={{ fontSize: '0.825rem' }}>Assign roles (STUDENT, DOCTOR, ADMIN) or remove user accounts.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ width: '220px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                />
                <select
                  className="select"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  style={{ width: '130px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Student</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Auth Type</th>
                    <th>Current Role</th>
                    <th>Change Role</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                        No users found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const roleClass = {
                        STUDENT: 'badge-student',
                        DOCTOR: 'badge-doctor',
                        ADMIN: 'badge-admin',
                      }[u.role] || 'badge-student';

                      return (
                        <tr key={u.id}>
                          <td>
                            <strong style={{ color: 'var(--text-primary)' }}>{u.name}</strong>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td>
                            {u.adId ? (
                              <span className="badge" style={{ background: 'rgba(5, 166, 240, 0.15)', color: '#05a6f0' }}>
                                Azure AD
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>
                                Local Password
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${roleClass}`}>{u.role}</span>
                          </td>
                          <td>
                            <select
                              className="select"
                              style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="DOCTOR">DOCTOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteUserTarget(u)}
                              title="Delete user account"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Doctor Directory */}
        {activeTab === 'doctors' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <input
                type="text"
                className="input"
                placeholder="Search physician by name, specialty, room..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                style={{ width: '280px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              />

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openAddDoctorModal}
              >
                + Add New Doctor
              </button>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>No physicians currently registered in the clinic directory.</p>
                <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={openAddDoctorModal}>
                  Register Doctor
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {filteredDoctors.map((d) => (
                  <div key={d.id} className="card" style={{ borderLeft: '4px solid var(--primary-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.15rem' }}>Dr. {d.name}</h4>
                        <span className="badge badge-doctor" style={{ marginTop: '4px' }}>{d.specialty}</span>
                      </div>
                      <span className="badge badge-student">Room {d.room}</span>
                    </div>

                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      University Medical Staff — Available for student bookings.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditDoctorModal(d)}
                      >
                        Edit Details
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteDoctorTarget(d)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Appointments Overview */}
        {activeTab === 'appointments' && (
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3>Clinic Appointment Central</h3>
                <p style={{ fontSize: '0.825rem' }}>Complete log of university medical consultations.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn btn-sm ${appointmentFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAppointmentFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Appointment ID</th>
                    <th>Date & Time</th>
                    <th>Patient</th>
                    <th>Doctor & Room</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Admin Override</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((a) => {
                      const statusClass = {
                        PENDING: 'badge-pending',
                        CONFIRMED: 'badge-confirmed',
                        COMPLETED: 'badge-completed',
                        CANCELLED: 'badge-cancelled',
                      }[a.status] || 'badge-pending';

                      return (
                        <tr key={a.id}>
                          <td>#{a.id}</td>
                          <td>
                            <strong>{new Date(a.appointmentDate).toLocaleDateString()}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(a.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td>
                            <strong>{a.student?.name || `Student #${a.studentId}`}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.student?.email}</div>
                          </td>
                          <td>
                            <div>Dr. {a.doctor?.name || `Doctor #${a.doctorId}`}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room: {a.doctor?.room}</div>
                          </td>
                          <td>
                            <span className={`badge ${statusClass}`}>{a.status}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              {a.status === 'PENDING' && (
                                <button
                                  type="button"
                                  className="btn btn-teal btn-sm"
                                  onClick={() => handleUpdateAppointmentStatus(a.id, 'CONFIRMED')}
                                >
                                  Confirm
                                </button>
                              )}
                              {a.status === 'CONFIRMED' && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleUpdateAppointmentStatus(a.id, 'COMPLETED')}
                                >
                                  Complete
                                </button>
                              )}
                              {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => setCancelAppointmentTarget(a)}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: External Integrations */}
        {activeTab === 'integrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <div className="card-header">
                <h3>External & Peer Integrations Architecture</h3>
                <span className="badge badge-student">Course Project Spec</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {/* Peer API Card */}
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ⇄
                    </div>
                    <div>
                      <strong style={{ display: 'block' }}>Peer Team API Integration</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Campus Emergency & Safety Alert System</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Bi-directional integration for campus safety coordination during emergencies.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ color: '#38bdf8' }}>Consuming: </strong>
                      <code>GET &#123;PEER_API&#125;/api/alerts</code>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>With header <code>x-api-key: PEER_API_KEY_OUTBOUND</code> to pause appointments during campus crisis.</div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ color: '#34d399' }}>Exposing: </strong>
                      <code>GET /api/appointments?date=YYYY-MM-DD</code>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>With header <code>x-api-key</code> to share clinic appointments for emergency evacuation.</div>
                    </div>
                  </div>
                </div>

                {/* DeepSeek AI Card */}
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--ai-purple-bg)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✦
                    </div>
                    <div>
                      <strong style={{ display: 'block' }}>DeepSeek AI Clinical Assistant</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Third-Party AI Integration</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Processes student self-reported symptoms into concise clinical summaries for attending physicians.
                  </p>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <div style={{ color: '#c084fc', fontWeight: 600, marginBottom: '4px' }}>Model Pipeline</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Automated background prompt synthesizing reported symptoms into chief complaints, duration, and clinical red flags.
                    </div>
                  </div>
                </div>

                {/* Azure AD Card */}
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      #
                    </div>
                    <div>
                      <strong style={{ display: 'block' }}>Identity & Secrets Architecture</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Azure AD + Azure Key Vault</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Campus single sign-on (SSO) with Microsoft Active Directory and runtime key retrieval from Azure Key Vault.
                  </p>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>RBAC Hierarchy</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Strict role-based authorization: Students, Doctors, Administrators verified through signed JWT tokens.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Add/Edit Modal */}
        <Modal
          isOpen={doctorModalOpen}
          onClose={() => setDoctorModalOpen(false)}
          title={editingDoctor ? `Edit Dr. ${editingDoctor.name}` : 'Register New Physician'}
        >
          <form onSubmit={handleDoctorFormSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="doc-name">Physician Full Name *</label>
              <input
                id="doc-name"
                className="input"
                placeholder="e.g., Sarah Connor"
                value={doctorForm.name}
                onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doc-specialty">Specialty / Department *</label>
              <input
                id="doc-specialty"
                className="input"
                placeholder="e.g., General Practice, Sports Medicine, Dermatology"
                value={doctorForm.specialty}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doc-room">Clinic Room Number *</label>
              <input
                id="doc-room"
                className="input"
                placeholder="e.g., 204-B"
                value={doctorForm.room}
                onChange={(e) => setDoctorForm({ ...doctorForm, room: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDoctorModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingDoctor ? 'Save Changes' : 'Register Doctor'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete User Confirmation Modal */}
        <Modal
          isOpen={Boolean(deleteUserTarget)}
          onClose={() => setDeleteUserTarget(null)}
          title="Delete User Account"
        >
          <p style={{ marginBottom: '1.25rem' }}>
            Are you sure you want to permanently delete user account <strong>{deleteUserTarget?.name}</strong> ({deleteUserTarget?.email})?
            All associated data will be removed.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteUserTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDeleteUser}>
              Yes, Delete Account
            </button>
          </div>
        </Modal>

        {/* Delete Doctor Confirmation Modal */}
        <Modal
          isOpen={Boolean(deleteDoctorTarget)}
          onClose={() => setDeleteDoctorTarget(null)}
          title="Delete Physician"
        >
          <p style={{ marginBottom: '1.25rem' }}>
            Are you sure you want to remove <strong>Dr. {deleteDoctorTarget?.name}</strong> from the clinic staff directory?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteDoctorTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDeleteDoctor}>
              Yes, Remove Doctor
            </button>
          </div>
        </Modal>

        {/* Cancel Appointment Confirmation Modal */}
        <Modal
          isOpen={Boolean(cancelAppointmentTarget)}
          onClose={() => setCancelAppointmentTarget(null)}
          title="Cancel Appointment"
        >
          <p style={{ marginBottom: '1.25rem' }}>
            Are you sure you want to cancel appointment <strong>#{cancelAppointmentTarget?.id}</strong> for {cancelAppointmentTarget?.student?.name}?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCancelAppointmentTarget(null)}>
              Keep
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmCancelAppointment}>
              Cancel Appointment
            </button>
          </div>
        </Modal>

        <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      </main>
    </>
  );
}
