import React, { useState } from 'react';
import apiClient from '../../services/apiClient';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from './AdminLayout';

export default function DoctorsPage() {
  const { doctors, reload } = useAdminData();
  const showToast = useToast();

  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({ name: '', specialty: '', room: '' });
  const [deleteDoctorTarget, setDeleteDoctorTarget] = useState(null);

  const filteredDoctors = doctors.filter((d) => {
    const term = doctorSearch.toLowerCase();
    return d.name?.toLowerCase().includes(term)
      || d.specialty?.toLowerCase().includes(term)
      || d.room?.toLowerCase().includes(term);
  });

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
      reload();
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
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete doctor', 'error');
    }
  }

  return (
    <div>
      <div className="section-toolbar">
        <input
          type="text"
          className="input search-input"
          placeholder="Search physician by name, specialty, room..."
          value={doctorSearch}
          onChange={(e) => setDoctorSearch(e.target.value)}
        />

        <button type="button" className="btn btn-primary btn-sm" onClick={openAddDoctorModal}>
          + Add New Doctor
        </button>
      </div>

      {filteredDoctors.length === 0 ? (
        <EmptyState
          icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
          title={doctorSearch ? 'No physicians match that search' : 'No physicians registered yet'}
          description={doctorSearch
            ? 'Clear the search box to see the full clinic directory.'
            : 'Students cannot book a consultation until at least one physician exists.'}
          action={(
            <button type="button" className="btn btn-primary btn-sm" onClick={openAddDoctorModal}>
              Register a Doctor
            </button>
          )}
        />
      ) : (
        <div className="grid-auto">
          {filteredDoctors.map((d) => (
            <div key={d.id} className="card card-accent-primary">
              <div className="card-header">
                <div className="stack-sm">
                  <h4 className="doctor-name">Dr. {d.name}</h4>
                  <span className="badge badge-doctor">{d.specialty}</span>
                </div>
                <span className="badge badge-student">Room {d.room}</span>
              </div>

              <p className="text-sm text-muted">
                University Medical Staff — Available for student bookings.
              </p>

              <div className="card-footer-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditDoctorModal(d)}>
                  Edit Details
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteDoctorTarget(d)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setDoctorModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingDoctor ? 'Save Changes' : 'Register Doctor'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteDoctorTarget)}
        onClose={() => setDeleteDoctorTarget(null)}
        title="Delete Physician"
      >
        <p className="modal-body-text">
          Are you sure you want to remove <strong>Dr. {deleteDoctorTarget?.name}</strong> from the clinic staff directory?
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteDoctorTarget(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmDeleteDoctor}>
            Yes, Remove Doctor
          </button>
        </div>
      </Modal>
    </div>
  );
}
