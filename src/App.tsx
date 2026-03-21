import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import GlobalLoader from '@/components/ui/GlobalLoader';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

const Onboarding = lazy(() => import('@/pages/onboarding/Onboarding'));
const GestorDashboard = lazy(() => import('@/pages/dashboard/GestorDashboard'));
const GestorClientDetail = lazy(() => import('@/pages/dashboard/GestorClientDetail'));
const ClientDashboard = lazy(() => import('@/pages/dashboard/ClientDashboard'));
const AiCenter = lazy(() => import('@/pages/ai/AiCenter'));
const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'));
const CampaignsList = lazy(() => import('@/pages/campaigns/CampaignsList'));
const AlertsList = lazy(() => import('@/pages/alerts/AlertsList'));
const ReportsList = lazy(() => import('@/pages/reports/ReportsList'));
const ReportView = lazy(() => import('@/pages/reports/ReportView'));
const ProfileSettings = lazy(() => import('@/pages/settings/Profile'));
const MetaConnection = lazy(() => import('@/pages/settings/MetaConnection'));
const PlanSettings = lazy(() => import('@/pages/settings/Plan'));
const GlobalMetrics = lazy(() => import('@/pages/admin/GlobalMetrics'));
const TenantsList = lazy(() => import('@/pages/admin/TenantsList'));
const ApiCosts = lazy(() => import('@/pages/admin/ApiCosts'));
const AdminLogs = lazy(() => import('@/pages/admin/AdminLogs'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

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

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <GlobalLoader />;

  return (
    <Suspense fallback={<LazyFallback />}>
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
        <Route path="/gestor/relatorios/:id" element={<ProtectedRoute allowedRoles={['admin_gestor', 'usuario_cliente']}><ReportView /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute allowedRoles={['admin_gestor', 'usuario_cliente']}><ReportView /></ProtectedRoute>} />
        <Route path="/gestor/ia" element={<ProtectedRoute allowedRoles={['admin_gestor']}><AiCenter /></ProtectedRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['usuario_cliente']}><ClientDashboard /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin_global']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/tenants" element={<ProtectedRoute allowedRoles={['admin_global']}><TenantsList /></ProtectedRoute>} />
        <Route path="/admin/metricas" element={<ProtectedRoute allowedRoles={['admin_global']}><GlobalMetrics /></ProtectedRoute>} />
        <Route path="/admin/custos" element={<ProtectedRoute allowedRoles={['admin_global']}><ApiCosts /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['admin_global']}><AdminLogs /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin_global']}><AdminSettings /></ProtectedRoute>} />

        <Route path="/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
        <Route path="/settings/meta" element={<ProtectedRoute><MetaConnection /></ProtectedRoute>} />
        <Route path="/settings/plano" element={<ProtectedRoute><PlanSettings /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
