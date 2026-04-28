import { Routes, Route, Navigate } from "react-router-dom";

import { MainLayout } from "./components/layout/MainLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CertificatesPage } from "./pages/CertificatesPage";
import { CoursesPage } from "./pages/CoursesPage";
import { AdminPage } from "./pages/AdminPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

export default function App() {
  return (
    <>
      <LanguageSwitcher />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}