import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { 
  Bike, 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Users,
  Clock,
  RefreshCw
} from "lucide-react";

export default function Dashboard() {
  const { API, getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fixed date as per requirements: LUN 09 MARZO 2026
  const displayDate = "LUN 09 MARZO 2026";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, chartsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, getAuthHeaders()),
        axios.get(`${API}/dashboard/charts`, getAuthHeaders())
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
    } catch (error) {
      toast.error("Error al cargar estadísticas");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "white" }) => (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-[#E31837]/50 transition-all group relative overflow-hidden cursor-pointer">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E31837] opacity-0 group-hover:opacity-100 transition-all" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2">
              {title}
            </p>
            <p className={`text-3xl font-bold ${color === "red" ? "text-[#E31837]" : "text-white"}`} style={{ fontFamily: 'Barlow Condensed' }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-sm ${color === "red" ? "bg-[#E31837]/20" : "bg-zinc-800/50"}`}>
            <Icon className={`w-6 h-6 ${color === "red" ? "text-[#E31837]" : "text-zinc-400"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-sm shadow-lg">
          <p className="text-white font-bold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ${entry.value?.toLocaleString() || 0} MXN
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-6">
          {/* Motorcycle Icon Centered */}
          <div className="hidden lg:flex items-center justify-center w-20 h-20 bg-[#E31837]/20 rounded-sm animate-pulse">
            <Bike className="w-12 h-12 text-[#E31837]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Dashboard
            </h1>
            <p className="text-zinc-500 mt-1">Panel de control - YEPEZ CONTROLS</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-sm px-6 py-3">
            <Calendar className="w-5 h-5 text-[#E31837]" />
            <span className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }} data-testid="dashboard-date">
              {displayDate}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Motorcycle Icon */}
      <div className="lg:hidden flex justify-center">
        <div className="flex items-center justify-center w-24 h-24 bg-[#E31837]/20 rounded-sm">
          <Bike className="w-14 h-14 text-[#E31837]" strokeWidth={1.5} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ingresos Hoy"
          value={`$${stats?.today_revenue?.toLocaleString() || 0}`}
          subtitle="Efectivo + Transferencias"
          icon={DollarSign}
          color="red"
        />
        <StatCard
          title="Servicios Activos"
          value={stats?.active_services || 0}
          subtitle={`${stats?.completed_services || 0} completados`}
          icon={Wrench}
        />
        <StatCard
          title="Mecánicos Activos"
          value={stats?.active_mechanics || 0}
          subtitle="En turno"
          icon={Users}
        />
        <StatCard
          title="Stock Bajo"
          value={stats?.low_stock_count || 0}
          subtitle="Requieren atención"
          icon={AlertTriangle}
          color={stats?.low_stock_count > 0 ? "red" : "white"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart - Interactive */}
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
              <TrendingUp className="w-5 h-5 text-[#E31837]" />
              Ingresos de la Semana
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {charts?.daily_revenue && charts.daily_revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={charts.daily_revenue}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E31837" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#E31837" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickFormatter={(v) => `$${v}`}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    name="Total"
                    stroke="#E31837" 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    strokeWidth={3}
                    dot={{ fill: '#E31837', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, fill: '#E31837', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-zinc-500">
                No hay datos de ingresos esta semana
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services Pie Chart - Interactive */}
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
              <Wrench className="w-5 h-5 text-[#E31837]" />
              Servicios por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {charts?.services_by_status && charts.services_by_status.some(s => s.count > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={charts.services_by_status}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {charts.services_by_status.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill}
                        stroke="transparent"
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a', 
                      borderRadius: '4px' 
                    }}
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40}
                    formatter={(value) => <span className="text-zinc-300 text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-zinc-500">
                <Wrench className="w-12 h-12 mb-3 opacity-30" />
                <p>No hay servicios registrados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown with Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Desglose Efectivo vs Transferencia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-zinc-800/30 rounded-sm hover:bg-zinc-800/50 transition-all cursor-pointer">
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2">Total General</p>
                <p className="text-3xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>
                  ${stats?.total_revenue?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-zinc-800/30 rounded-sm hover:bg-green-500/10 transition-all cursor-pointer border border-transparent hover:border-green-500/30">
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2">Efectivo</p>
                <p className="text-3xl font-bold text-green-400" style={{ fontFamily: 'Barlow Condensed' }}>
                  ${stats?.cash_revenue?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-zinc-800/30 rounded-sm hover:bg-blue-500/10 transition-all cursor-pointer border border-transparent hover:border-blue-500/30">
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2">Transferencias</p>
                <p className="text-3xl font-bold text-blue-400" style={{ fontFamily: 'Barlow Condensed' }}>
                  ${stats?.transfer_revenue?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            {charts?.daily_revenue && charts.daily_revenue.length > 0 && (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={charts.daily_revenue} barGap={0}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="efectivo" 
                    name="Efectivo"
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                  />
                  <Bar 
                    dataKey="transferencia" 
                    name="Transferencia"
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Activity Panel */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-sm hover:bg-blue-500/10 transition-all cursor-pointer">
              <div className="p-2 bg-blue-500/20 rounded-sm">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{stats?.pending_appointments || 0} Citas</p>
                <p className="text-zinc-500 text-sm">Pendientes</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-sm hover:bg-orange-500/10 transition-all cursor-pointer">
              <div className="p-2 bg-orange-500/20 rounded-sm">
                <Wrench className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{stats?.active_services || 0} Servicios</p>
                <p className="text-zinc-500 text-sm">En proceso</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-sm hover:bg-green-500/10 transition-all cursor-pointer">
              <div className="p-2 bg-green-500/20 rounded-sm">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{stats?.total_services || 0} Total</p>
                <p className="text-zinc-500 text-sm">Servicios registrados</p>
              </div>
            </div>

            {/* Inventory */}
            {charts?.inventory_by_category && charts.inventory_by_category.length > 0 && (
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-3">Inventario</p>
                {charts.inventory_by_category.slice(0, 3).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-sm hover:bg-zinc-800/30 px-2 rounded-sm transition-all cursor-pointer">
                    <span className="text-zinc-400">{cat.category}</span>
                    <span className="text-white font-medium">{cat.cantidad} uds</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logo Footer */}
      <div className="flex items-center justify-center pt-8">
        <div className="flex items-center gap-4 opacity-30 hover:opacity-50 transition-all cursor-pointer">
          <Bike className="w-12 h-12 text-zinc-500" />
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-500 uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              YEPEZ CONTROLS
            </p>
            <p className="text-xs text-zinc-600 tracking-widest uppercase">Centro de Servicio Autorizado VENTO</p>
          </div>
        </div>
      </div>
    </div>
  );
}
