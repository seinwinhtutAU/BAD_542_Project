import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

import StudentLayout from '../features/appointments/StudentLayout';
import BookAppointmentPage from '../features/appointments/BookAppointmentPage';
import MyAppointmentsPage from '../features/appointments/MyAppointmentsPage';
import MyPrescriptionsPage from '../features/appointments/MyPrescriptionsPage';

import DoctorLayout from '../features/doctor/DoctorLayout';
import DoctorQueuePage from '../features/doctor/DoctorQueuePage';

import AdminLayout from '../features/admin/AdminLayout';
import UsersPage from '../features/admin/UsersPage';
import DoctorsPage from '../features/admin/DoctorsPage';
import AdminAppointmentsPage from '../features/admin/AdminAppointmentsPage';
import IntegrationsPage from '../features/admin/IntegrationsPage';

import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Each section below is a real address: it survives a refresh, can be
          bookmarked, and the browser Back button steps through them. */}
      <Route
        path="/student"
        element={<ProtectedRoute roles={['STUDENT']}><StudentLayout /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="book" replace />} />
        <Route path="book" element={<BookAppointmentPage />} />
        <Route path="appointments" element={<MyAppointmentsPage />} />
        <Route path="prescriptions" element={<MyPrescriptionsPage />} />
      </Route>

      <Route
        path="/doctor"
        element={<ProtectedRoute roles={['DOCTOR']}><DoctorLayout /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="queue" replace />} />
        <Route path="queue" element={<DoctorQueuePage />} />
      </Route>

      <Route
        path="/admin"
        element={<ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
