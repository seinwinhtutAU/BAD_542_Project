import React, { useState } from 'react';
import apiClient from '../../services/apiClient';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from './AdminLayout';

const STATUS_CLASS = {
  PENDING: 'badge-pending',
  CONFIRMED: 'badge-confirmed',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
};

export default function AdminAppointmentsPage() {
  const { appointments, reload } = useAdminData();
  const showToast = useToast();

  const [appointmentFilter, setAppointmentFilter] = useState('ALL');
  const [cancelAppointmentTarget, setCancelAppointmentTarget] = useState(null);

  const filteredAppointments = appointments.filter((a) => (
    appointmentFilter === 'ALL' ? true : a.status === appointmentFilter
  ));

  async function handleUpdateAppointmentStatus(id, status) {
    try {
      await apiClient.patch(`/api/appointments/${id}/status`, { status });
      showToast(`Appointment status changed to ${status}`, 'success');
      reload();
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
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel appointment', 'error');
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Clinic Appointment Central</h3>
          <p className="text-sm">Complete log of university medical consultations.</p>
        </div>

        <div className="filter-row">
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
              <th>Date &amp; Time</th>
              <th>Patient</th>
              <th>Doctor &amp; Room</th>
              <th>Status</th>
              <th className="cell-right">Admin Override</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="6" className="cell-empty">
                  No appointments match this status filter.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((a) => (
                <tr key={a.id}>
                  <td data-label="Reference">#{a.id}</td>
                  <td data-label="Date & time">
                    <strong>{new Date(a.appointmentDate).toLocaleDateString()}</strong>
                    <div className="cell-sub">
                      {new Date(a.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td data-label="Patient">
                    <strong>{a.student?.name || `Student #${a.studentId}`}</strong>
                    <div className="cell-sub">{a.student?.email}</div>
                  </td>
                  <td data-label="Doctor">
                    <div>Dr. {a.doctor?.name || `Doctor #${a.doctorId}`}</div>
                    <div className="cell-sub">Room: {a.doctor?.room}</div>
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${STATUS_CLASS[a.status] || 'badge-pending'}`}>{a.status}</span>
                  </td>
                  <td data-label="Override" className="cell-right">
                    <div className="row-tight">
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={Boolean(cancelAppointmentTarget)}
        onClose={() => setCancelAppointmentTarget(null)}
        title="Cancel Appointment"
      >
        <p className="modal-body-text">
          Are you sure you want to cancel appointment <strong>#{cancelAppointmentTarget?.id}</strong> for {cancelAppointmentTarget?.student?.name}?
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setCancelAppointmentTarget(null)}>
            Keep
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmCancelAppointment}>
            Cancel Appointment
          </button>
        </div>
      </Modal>
    </div>
  );
}
