import { Navigate, Route, Routes } from 'react-router-dom';

import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionManager } from './components/SessionManager';
import { AdminPage } from './pages/AdminPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { CoordinatorPage } from './pages/CoordinatorPage';
import { CoursesPage } from './pages/CoursesPage';
import { DashboardPage } from './pages/DashboardPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { QAPage } from './pages/qa/QAPage';
import { SysAdminPage } from './pages/SysAdminPage';

export default function App() {
  return (
    <>
      <SessionManager />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/qa" element={<QAPage />} />
        <Route
          path="/app"
          element={(
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route
            path="coordinator"
            element={(
              <ProtectedRoute allowedRoles={['coordinador', 'admin', 'sysadmin']}>
                <CoordinatorPage />
              </ProtectedRoute>
            )}
          />
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
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </>
  );
}
