import React, { useState } from 'react';
import apiClient from '../../services/apiClient';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from './AdminLayout';

const ROLE_CLASS = {
  STUDENT: 'badge-student',
  DOCTOR: 'badge-doctor',
  ADMIN: 'badge-admin',
};

export default function UsersPage() {
  const { users, reload } = useAdminData();
  const showToast = useToast();

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);

  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    const matchesSearch = u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  async function handleChangeRole(userId, newRole) {
    try {
      await apiClient.patch(`/api/users/${userId}/role`, { role: newRole });
      showToast(`User role updated to ${newRole}`, 'success');
      reload();
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
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>User Accounts &amp; RBAC Assignment</h3>
          <p className="text-sm">Assign roles (STUDENT, DOCTOR, ADMIN) or remove user accounts.</p>
        </div>

        <div className="row">
          <input
            type="text"
            className="input search-input"
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <select
            className="select select-sm"
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
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
              <th className="cell-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="cell-empty">
                  No users match your search or role filter.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td data-label="User"><strong>{u.name}</strong></td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Auth type">
                    {u.adId ? (
                      <span className="badge badge-azure">Azure AD</span>
                    ) : (
                      <span className="badge badge-local">Local Password</span>
                    )}
                  </td>
                  <td data-label="Current role">
                    <span className={`badge ${ROLE_CLASS[u.role] || 'badge-student'}`}>{u.role}</span>
                  </td>
                  <td data-label="Change role">
                    <select
                      className="select select-inline"
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="DOCTOR">DOCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td data-label="Actions" className="cell-right">
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={Boolean(deleteUserTarget)}
        onClose={() => setDeleteUserTarget(null)}
        title="Delete User Account"
      >
        <p className="modal-body-text">
          Are you sure you want to permanently delete user account <strong>{deleteUserTarget?.name}</strong> ({deleteUserTarget?.email})?
          All associated data will be removed.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteUserTarget(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmDeleteUser}>
            Yes, Delete Account
          </button>
        </div>
      </Modal>
    </div>
  );
}
