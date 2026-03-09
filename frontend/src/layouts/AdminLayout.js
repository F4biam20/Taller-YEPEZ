import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bike, 
  LayoutDashboard, 
  Calendar, 
  Wrench, 
  DollarSign, 
  Package, 
  Users, 
  LogOut,
  Menu,
  X,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/citas", icon: Calendar, label: "Citas" },
  { to: "/admin/produccion", icon: Wrench, label: "Producción" },
  { to: "/admin/finanzas", icon: DollarSign, label: "Finanzas" },
  { to: "/admin/inventario", icon: Package, label: "Inventario" },
  { to: "/admin/mecanicos", icon: Users, label: "Mecánicos" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavItem = ({ to, icon: Icon, label, end }) => (
    <NavLink
      to={to}
      end={end}
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200",
          isActive
            ? "bg-[#E31837]/10 border-l-2 border-[#E31837] text-white"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        )
      }
      data-testid={`nav-${label.toLowerCase()}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {(sidebarOpen || mobileMenuOpen) && (
        <span className="font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed' }}>
          {label}
        </span>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 z-50 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center w-full")}>
            <Bike className="w-8 h-8 text-[#E31837] flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                YEPEZ
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "text-zinc-500 hover:text-white transition-colors",
              !sidebarOpen && "hidden"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-zinc-800">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-white font-medium text-sm">{user?.name}</p>
              <p className="text-zinc-500 text-xs uppercase tracking-wider">Administrador</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            data-testid="logout-btn"
            className={cn(
              "w-full text-zinc-400 hover:text-white hover:bg-zinc-800/50",
              !sidebarOpen && "p-2"
            )}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-2">Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Bike className="w-8 h-8 text-[#E31837]" />
          <span className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
            YEPEZ
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white p-2"
          data-testid="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-zinc-950 z-40 p-4 animate-slide-in">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
          <div className="mt-8 pt-4 border-t border-zinc-800">
            <div className="mb-3">
              <p className="text-white font-medium text-sm">{user?.name}</p>
              <p className="text-zinc-500 text-xs uppercase tracking-wider">Administrador</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 pt-16 lg:pt-0",
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        )}
      >
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
