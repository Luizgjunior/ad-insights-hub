import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Onboarding from "@/pages/onboarding/Onboarding";
import GestorDashboard from "@/pages/dashboard/GestorDashboard";
import ClientDashboard from "@/pages/dashboard/ClientDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import CampaignsList from "@/pages/campaigns/CampaignsList";
import AlertsList from "@/pages/alerts/AlertsList";
import ReportsList from "@/pages/reports/ReportsList";
import ProfileSettings from "@/pages/settings/Profile";
import MetaConnection from "@/pages/settings/MetaConnection";
import PlanSettings from "@/pages/settings/Plan";
import GlobalMetrics from "@/pages/admin/GlobalMetrics";
import TenantsList from "@/pages/admin/TenantsList";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to appropriate dashboard
    if (profile.role === 'admin_global') return <Navigate to="/admin" replace />;
    if (profile.role === 'usuario_cliente') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/gestor" replace />;
  }

  return <>{children}</>;
}

function DefaultRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role === 'admin_global') return <Navigate to="/admin" replace />;
  if (profile.role === 'usuario_cliente') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/gestor" replace />;
}

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Default redirect */}
    <Route path="/" element={<DefaultRedirect />} />

    {/* Onboarding */}
    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

    {/* Gestor routes */}
    <Route path="/gestor" element={<ProtectedRoute allowedRoles={['admin_gestor']}><GestorDashboard /></ProtectedRoute>} />
    <Route path="/gestor/campanhas" element={<ProtectedRoute allowedRoles={['admin_gestor']}><CampaignsList /></ProtectedRoute>} />
    <Route path="/gestor/alertas" element={<ProtectedRoute allowedRoles={['admin_gestor']}><AlertsList /></ProtectedRoute>} />
    <Route path="/gestor/relatorios" element={<ProtectedRoute allowedRoles={['admin_gestor', 'usuario_cliente']}><ReportsList /></ProtectedRoute>} />

    {/* Client routes */}
    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['usuario_cliente']}><ClientDashboard /></ProtectedRoute>} />

    {/* Admin routes */}
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin_global']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/tenants" element={<ProtectedRoute allowedRoles={['admin_global']}><TenantsList /></ProtectedRoute>} />
    <Route path="/admin/metricas" element={<ProtectedRoute allowedRoles={['admin_global']}><GlobalMetrics /></ProtectedRoute>} />

    {/* Settings (all roles) */}
    <Route path="/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
    <Route path="/settings/meta" element={<ProtectedRoute><MetaConnection /></ProtectedRoute>} />
    <Route path="/settings/plano" element={<ProtectedRoute><PlanSettings /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
