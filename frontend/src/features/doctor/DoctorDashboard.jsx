import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDashboard() {
  const { logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptionForm, setPrescriptionForm] = useState(null);

  async function load() {
    const { data } = await apiClient.get('/api/appointments');
    setAppointments(data);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    await apiClient.patch(`/api/appointments/${id}/status`, { status });
    load();
  }

  async function submitPrescription(e) {
    e.preventDefault();
    await apiClient.post('/api/prescriptions', prescriptionForm);
    setPrescriptionForm(null);
    load();
  }

  return (
    <div>
      <header>
        <h1>Doctor Dashboard</h1>
        <button type="button" onClick={logout}>Log out</button>
      </header>

      <ul>
        {appointments.map((a) => (
          <li key={a.id}>
            {`${new Date(a.appointmentDate).toLocaleString()} — ${a.student.name} — ${a.status}`}
            <p>{a.symptoms}</p>
            {a.status === 'PENDING' && (
              <button type="button" onClick={() => updateStatus(a.id, 'CONFIRMED')}>Confirm</button>
            )}
            {a.status === 'CONFIRMED' && (
              <button
                type="button"
                onClick={() => setPrescriptionForm({
                  appointmentId: a.id, medicine: '', dosage: '', instruction: '',
                })}
              >
                Add prescription
              </button>
            )}
          </li>
        ))}
      </ul>

      {prescriptionForm && (
        <form onSubmit={submitPrescription}>
          <input
            placeholder="Medicine"
            value={prescriptionForm.medicine}
            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicine: e.target.value })}
            required
          />
          <input
            placeholder="Dosage"
            value={prescriptionForm.dosage}
            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
            required
          />
          <input
            placeholder="Instructions"
            value={prescriptionForm.instruction}
            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instruction: e.target.value })}
          />
          <button type="submit">Save prescription</button>
        </form>
      )}
    </div>
  );
}
