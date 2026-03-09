import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Bike, LogOut, Wrench } from "lucide-react";

export default function MechanicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 z-50 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Bike className="w-8 h-8 text-[#E31837]" />
          <span className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
            YEPEZ<span className="text-[#E31837]"> CONTROLS</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-zinc-400">
            <Wrench className="w-5 h-5" />
            <span className="font-medium">{user?.name}</span>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            data-testid="mechanic-logout-btn"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-2 hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 lg:px-8 pb-8">
        <Outlet />
      </main>
    </div>
  );
}
