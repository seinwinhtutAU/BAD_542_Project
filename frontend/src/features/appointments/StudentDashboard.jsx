import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctorId: '', appointmentDate: '', symptoms: '' });
  const [error, setError] = useState('');

  async function load() {
    const [appts, docs] = await Promise.all([
      apiClient.get('/api/appointments/mine'),
      apiClient.get('/api/doctors'),
    ]);
    setAppointments(appts.data);
    setDoctors(docs.data);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/api/appointments', form);
      setForm({ doctorId: '', appointmentDate: '', symptoms: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not book appointment');
    }
  }

  async function handleCancel(id) {
    await apiClient.patch(`/api/appointments/${id}/cancel`);
    load();
  }

  return (
    <div>
      <header>
        <h1>My Appointments</h1>
        <button type="button" onClick={logout}>Log out</button>
      </header>

      <form onSubmit={handleSubmit}>
        <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} required>
          <option value="">Select doctor</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{`${d.name} (${d.specialty})`}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={form.appointmentDate}
          onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
          required
        />
        <textarea
          placeholder="Describe your symptoms"
          value={form.symptoms}
          onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
        />
        <button type="submit">Book appointment</button>
      </form>
      {error && <p role="alert">{error}</p>}

      <ul>
        {appointments.map((a) => (
          <li key={a.id}>
            {`${new Date(a.appointmentDate).toLocaleString()} — Dr. ${a.doctor.name} — ${a.status}`}
            {a.status === 'PENDING' && <button type="button" onClick={() => handleCancel(a.id)}>Cancel</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
