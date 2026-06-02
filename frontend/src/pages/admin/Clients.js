import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { UserCheck, Search, Phone, Mail, Calendar, Car, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Clients() {
  const { API, getAuthHeaders } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API}/clients`, getAuthHeaders());
      setClients(res.data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
            Clientes
          </h1>
          <p className="text-zinc-500 mt-1">Clientes registrados en el sistema — {clients.length} total</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="bg-zinc-900 border-zinc-800 text-white pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-sm flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Verificados</p>
              <p className="text-white font-bold text-xl">{clients.filter(c => c.verified).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-sm flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Sin verificar</p>
              <p className="text-white font-bold text-xl">{clients.filter(c => !c.verified).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E31837]/20 rounded-sm flex items-center justify-center">
              <Car className="w-5 h-5 text-[#E31837]" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Total</p>
              <p className="text-white font-bold text-xl">{clients.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      {filtered.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <UserCheck className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">{search ? "No se encontraron clientes" : "No hay clientes registrados"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((client) => (
            <Card key={client.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#E31837]/10 rounded-sm flex items-center justify-center flex-shrink-0">
                      <span className="text-[#E31837] font-bold text-lg uppercase">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'Barlow Condensed' }}>
                          {client.name}
                        </h3>
                        <Badge variant="outline" className={cn(
                          "text-xs uppercase border",
                          client.verified
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        )}>
                          {client.verified ? "Verificado" : "Sin verificar"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {client.email}
                        </span>
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {client.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-zinc-600">
                          <Calendar className="w-3.5 h-3.5" />
                          Registrado: {new Date(client.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm hidden sm:block">
                    <p className="text-zinc-500 text-xs uppercase mb-1">Citas</p>
                    <p className="text-white font-bold text-xl">{client.total_appointments ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
