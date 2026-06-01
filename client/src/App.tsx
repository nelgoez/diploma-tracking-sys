import { Navigate, Route, Routes } from 'react-router-dom';

import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminPage } from './pages/AdminPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { CoursesPage } from './pages/CoursesPage';
import { DashboardPage } from './pages/DashboardPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { LoginPage } from './pages/LoginPage';
import { SysAdminPage } from './pages/SysAdminPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route
            path="admin"
            element={(
              <ProtectedRoute allowedRoles={['admin', 'sysadmin']}>
                <AdminPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="sysadmin"
            element={(
              <ProtectedRoute allowedRoles={['sysadmin']}>
                <SysAdminPage />
              </ProtectedRoute>
            )}
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
