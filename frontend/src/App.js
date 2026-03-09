import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import LandingPage from "@/pages/LandingPage";
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
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "mecanico") return <Navigate to="/mecanico" replace />;
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === "admin" ? "/admin" : "/mecanico"} />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="citas" element={<Appointments />} />
        <Route path="produccion" element={<Production />} />
        <Route path="finanzas" element={<Finances />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="mecanicos" element={<Mechanics />} />
      </Route>
      
      {/* Mechanic Routes */}
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
