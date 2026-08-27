import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorForm, setDoctorForm] = useState({ name: '', specialty: '', room: '' });

  async function load() {
    const [u, d] = await Promise.all([
      apiClient.get('/api/users'),
      apiClient.get('/api/doctors'),
    ]);
    setUsers(u.data);
    setDoctors(d.data);
  }

  useEffect(() => { load(); }, []);

  async function addDoctor(e) {
    e.preventDefault();
    await apiClient.post('/api/doctors', doctorForm);
    setDoctorForm({ name: '', specialty: '', room: '' });
    load();
  }

  async function changeRole(id, role) {
    await apiClient.patch(`/api/users/${id}/role`, { role });
    load();
  }

  return (
    <div>
      <header>
        <h1>Admin Dashboard</h1>
        <button type="button" onClick={logout}>Log out</button>
      </header>

      <section>
        <h2>Users</h2>
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              {`${u.name} (${u.email}) — ${u.role}`}
              <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                <option value="STUDENT">STUDENT</option>
                <option value="DOCTOR">DOCTOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Doctors</h2>
        <ul>
          {doctors.map((d) => (
            <li key={d.id}>{`${d.name} — ${d.specialty} — Room ${d.room}`}</li>
          ))}
        </ul>
        <form onSubmit={addDoctor}>
          <input placeholder="Name" value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} required />
          <input placeholder="Specialty" value={doctorForm.specialty} onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })} required />
          <input placeholder="Room" value={doctorForm.room} onChange={(e) => setDoctorForm({ ...doctorForm, room: e.target.value })} required />
          <button type="submit">Add doctor</button>
        </form>
      </section>
    </div>
  );
}
