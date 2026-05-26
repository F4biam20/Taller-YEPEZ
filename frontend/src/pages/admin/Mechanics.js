import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axios from "axios";
import { Users, Plus, UserPlus, Trash2, Power, Wrench, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Mechanics() {
  const { API, getAuthHeaders } = useAuth();
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialty: "",
    whatsapp_apikey: ""
  });

  useEffect(() => {
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    try {
      const response = await axios.get(`${API}/mechanics`, getAuthHeaders());
      setMechanics(response.data);
    } catch (error) {
      toast.error("Error al cargar mecánicos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/mechanics`, formData, getAuthHeaders());
      toast.success("Mecánico creado exitosamente");
      setDialogOpen(false);
      resetForm();
      fetchMechanics();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear mecánico");
    }
  };

  const handleToggle = async (id) => {
    try {
      const response = await axios.put(`${API}/mechanics/${id}/toggle`, {}, getAuthHeaders());
      toast.success(response.data.message);
      fetchMechanics();
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este mecánico? Esta acción no se puede deshacer.")) return;
    try {
      await axios.delete(`${API}/mechanics/${id}`, getAuthHeaders());
      toast.success("Mecánico eliminado");
      fetchMechanics();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      specialty: "",
      whatsapp_apikey: ""
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="mechanics-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
            Mecánicos
          </h1>
          <p className="text-zinc-500 mt-1">Gestión del equipo de trabajo</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button
              data-testid="new-mechanic-btn"
              className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Nuevo Mecánico
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                Crear Cuenta de Mecánico
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest">Nombre Completo*</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Erick Yepes"
                  data-testid="mech-name"
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest">Correo Electrónico*</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="erick@yepezcontrols.com"
                  data-testid="mech-email"
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest">Contraseña*</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="Mínimo 6 caracteres"
                  data-testid="mech-password"
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Teléfono</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="993 123 4567"
                    data-testid="mech-phone"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Especialidad</Label>
                  <Input
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    placeholder="Ej: Motor, Frenos..."
                    data-testid="mech-specialty"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2 p-4 bg-green-500/10 border border-green-500/30 rounded-sm">
                <Label className="text-green-400 text-xs uppercase tracking-widest flex items-center gap-2">
                  📱 WhatsApp - Notificaciones Automáticas
                </Label>
                <Input
                  value={formData.whatsapp_apikey}
                  onChange={(e) => setFormData({...formData, whatsapp_apikey: e.target.value})}
                  placeholder="API Key de CallMeBot (opcional)"
                  data-testid="mech-whatsapp"
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
                <p className="text-xs text-zinc-500">
                  Obtén tu API key en: callmebot.com/blog/free-api-whatsapp-messages
                </p>
              </div>

              <Button
                type="submit"
                data-testid="mech-submit-btn"
                className="w-full bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Crear Mecánico
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
              {mechanics.length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Total Mecánicos</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Barlow Condensed' }}>
              {mechanics.filter(m => m.active).length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Activos</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-zinc-500" style={{ fontFamily: 'Barlow Condensed' }}>
              {mechanics.filter(m => !m.active).length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Inactivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Mechanics List */}
      {mechanics.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No hay mecánicos registrados</p>
            <p className="text-zinc-600 text-sm mt-1">Crea el primer mecánico para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mechanics.map((mechanic) => (
            <Card 
              key={mechanic.id} 
              className={cn(
                "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all",
                !mechanic.active && "opacity-60"
              )}
              data-testid={`mechanic-${mechanic.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-sm flex items-center justify-center",
                      mechanic.active ? "bg-[#E31837]/20" : "bg-zinc-800"
                    )}>
                      <Wrench className={cn(
                        "w-6 h-6",
                        mechanic.active ? "text-[#E31837]" : "text-zinc-600"
                      )} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
                        {mechanic.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          mechanic.active 
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                        )}
                      >
                        {mechanic.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={mechanic.active}
                    onCheckedChange={() => handleToggle(mechanic.id)}
                    data-testid={`toggle-${mechanic.id}`}
                  />
                </div>

                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{mechanic.email}</span>
                  </div>
                  {mechanic.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{mechanic.phone}</span>
                    </div>
                  )}
                  {mechanic.specialty && (
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      <span>Especialidad: {mechanic.specialty}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(mechanic.id)}
                    data-testid={`delete-mech-${mechanic.id}`}
                    className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
