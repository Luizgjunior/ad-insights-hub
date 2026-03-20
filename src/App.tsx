import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Onboarding from '@/pages/onboarding/Onboarding';
import GestorDashboard from '@/pages/dashboard/GestorDashboard';
import GestorClientDetail from '@/pages/dashboard/GestorClientDetail';
import ClientDashboard from '@/pages/dashboard/ClientDashboard';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import CampaignsList from '@/pages/campaigns/CampaignsList';
import AlertsList from '@/pages/alerts/AlertsList';
import ReportsList from '@/pages/reports/ReportsList';
import ProfileSettings from '@/pages/settings/Profile';
import MetaConnection from '@/pages/settings/MetaConnection';
import PlanSettings from '@/pages/settings/Plan';
import GlobalMetrics from '@/pages/admin/GlobalMetrics';
import TenantsList from '@/pages/admin/TenantsList';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function DefaultRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role === 'admin_global') return <Navigate to="/admin" replace />;
  if (profile.role === 'usuario_cliente') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/gestor" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<DefaultRedirect />} />

      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

      <Route path="/gestor" element={<ProtectedRoute allowedRoles={['admin_gestor']}><GestorDashboard /></ProtectedRoute>} />
      <Route path="/gestor/cliente/:id" element={<ProtectedRoute allowedRoles={['admin_gestor']}><GestorClientDetail /></ProtectedRoute>} />
      <Route path="/gestor/campanhas" element={<ProtectedRoute allowedRoles={['admin_gestor']}><CampaignsList /></ProtectedRoute>} />
      <Route path="/gestor/alertas" element={<ProtectedRoute allowedRoles={['admin_gestor']}><AlertsList /></ProtectedRoute>} />
      <Route path="/gestor/relatorios" element={<ProtectedRoute allowedRoles={['admin_gestor', 'usuario_cliente']}><ReportsList /></ProtectedRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['usuario_cliente']}><ClientDashboard /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin_global']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/tenants" element={<ProtectedRoute allowedRoles={['admin_global']}><TenantsList /></ProtectedRoute>} />
      <Route path="/admin/metricas" element={<ProtectedRoute allowedRoles={['admin_global']}><GlobalMetrics /></ProtectedRoute>} />

      <Route path="/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
      <Route path="/settings/meta" element={<ProtectedRoute><MetaConnection /></ProtectedRoute>} />
      <Route path="/settings/plano" element={<ProtectedRoute><PlanSettings /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              theme="dark"
              toastOptions={{
                style: {
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
