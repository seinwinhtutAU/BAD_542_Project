import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import StudentDashboard from '../features/appointments/StudentDashboard';
import DoctorDashboard from '../features/doctor/DoctorDashboard';
import AdminDashboard from '../features/admin/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/student"
        element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>}
      />
      <Route
        path="/doctor"
        element={<ProtectedRoute roles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>}
      />
      <Route
        path="/admin"
        element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
