import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import LandingPage from "@/pages/LandingPage";
import ClientPortal from "@/pages/ClientPortal";
import AdminLayout from "@/layouts/AdminLayout";
import MechanicLayout from "@/layouts/MechanicLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Appointments from "@/pages/admin/Appointments";
import Production from "@/pages/admin/Production";
import Finances from "@/pages/admin/Finances";
import Inventory from "@/pages/admin/Inventory";
import Mechanics from "@/pages/admin/Mechanics";
import MechanicDashboard from "@/pages/mechanic/MechanicDashboard";
import "@/App.css";

const getHomePathByRole = (role) => {
  if (role === "admin") return "/admin";
  if (role === "mecanico") return "/mecanico";
  return "/cliente";
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePathByRole(user.role)} replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  const canAccessAuth = !user || user.role === "cliente";

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={canAccessAuth ? <LoginPage /> : <Navigate to={getHomePathByRole(user.role)} replace />} />
      <Route path="/registro" element={canAccessAuth ? <RegisterPage /> : <Navigate to={getHomePathByRole(user.role)} replace />} />

      {/* Portal del cliente */}
      <Route path="/cliente" element={<ClientPortal />} />
      <Route path="/rastreo" element={<Navigate to="/cliente" replace />} />

      {/* Rutas de Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="citas" element={<Appointments />} />
        <Route path="produccion" element={<Production />} />
        <Route path="finanzas" element={<Finances />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="mecanicos" element={<Mechanics />} />
      </Route>

      {/* Rutas de Mecánico */}
      <Route path="/mecanico" element={<ProtectedRoute allowedRoles={["mecanico"]}><MechanicLayout /></ProtectedRoute>}>
        <Route index element={<MechanicDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
