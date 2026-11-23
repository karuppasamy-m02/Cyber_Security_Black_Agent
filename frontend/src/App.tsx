import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';

// Layout
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Monitoring } from './pages/Monitoring';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { Incidents } from './pages/Incidents';
import { IncidentDetail } from './pages/IncidentDetail';
import { ThreatIntelligence } from './pages/ThreatIntelligence';
import { AttackScenarios } from './pages/AttackScenarios';
import { AttackLogin } from './pages/AttackLogin';
import { AiAnalyst } from './pages/AiAnalyst';
import { ModelLab } from './pages/ModelLab';
import { ModelTraining } from './pages/ModelTraining';
import { ModelEvaluation } from './pages/ModelEvaluation';
import { ResponseCenter } from './pages/ResponseCenter';
import { AuditLogs } from './pages/AuditLogs';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { AiSettings } from './pages/AiSettings';
import { SystemSettings } from './pages/SystemSettings';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-mono text-[#F5F5F2] text-xs">
        Authenticating CYBER BLACK SOC session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dedicated Red Team Attack Simulation Portal (Independent Site) */}
          <Route path="/attacks/login" element={<AttackLogin />} />
          <Route path="/attacks" element={<AttackScenarios />} />

          {/* Protected SOC Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
            <Route path="/ai-analyst" element={<AiAnalyst />} />
            <Route path="/model-lab" element={<ModelLab />} />
            <Route path="/model-lab/training" element={<ModelTraining />} />
            <Route path="/model-lab/evaluation" element={<ModelEvaluation />} />
            <Route path="/response-center" element={<ResponseCenter />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/users" element={<Users />} />
            
            {/* Settings Nested Routes */}
            <Route path="/settings" element={<Settings />}>
              <Route index element={<SystemSettings />} />
              <Route path="ai" element={<AiSettings />} />
              <Route path="system" element={<SystemSettings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
