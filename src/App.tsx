import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LayoutDashboard, Truck, Activity, Plus, Trash2,
  Search, Bell, Navigation, TrendingUp,
  Moon, Sun, AlertCircle, Package, FileText,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { fetchEnvios, crearEnvio, eliminarEnvio } from './services/enviosService';
import { exportToExcel } from './utils/exportExcel';
import { getCoordinates } from './utils/geocoding';
import { Envio } from './types';
import { useDarkMode } from './hooks/useDarkMode';
import AlertSystem from './components/alerts/AlertSystem';
import KPIPanel from './components/dashboard/KPIPanel';
import ReportGenerator, { generateEnvioPDF } from './components/reports/ReportGenerator';
import { KPIPanelSkeleton, TableSkeleton, ChartSkeleton } from './components/ui/Skeleton';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const customIcon = (temp: number) =>
  new L.Icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' +
      (temp > 7 ? 'red' : 'blue') + '.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

export default function App() {
  const [shipments, setShipments] = useState<Envio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'envios'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setTick] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const [nuevoInsumo, setNuevoInsumo] = useState('');
  const [nuevaTemp, setNuevaTemp] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');

  const { isDark, toggle: toggleDark } = useDarkMode();

  const cargarEnvios = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchEnvios();
      setShipments(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setLoadError(`No se pudo conectar con Supabase. ${msg}`);
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { cargarEnvios(); }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(timer);
  }, []);

  const enviosFiltrados = shipments.filter(
    s =>
      s.insumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAgregarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoInsumo || !nuevaTemp || !nuevaUbicacion) {
      toast.error('Datos incompletos');
      return;
    }
    const loading = toast.loading('Localizando unidad...');
    try {
      const coords = await getCoordinates(nuevaUbicacion);
      await crearEnvio({
        insumo: nuevoInsumo,
        temp: parseFloat(nuevaTemp),
        ubicacion: nuevaUbicacion,
        lat: coords?.lat ?? -34.6037,
        long: coords?.lng ?? -58.3816,
      });
      toast.dismiss(loading);
      toast.success('Envío en camino');
      setNuevoInsumo('');
      setNuevaTemp('');
      setNuevaUbicacion('');
      cargarEnvios();
    } catch {
      toast.dismiss(loading);
      toast.error('Error al registrar');
    }
  };

  const handleEliminarEnvio = async (id: number) => {
    try {
      await eliminarEnvio(id);
      toast.success('Registro eliminado');
      cargarEnvios();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-white font-sans overflow-hidden transition-colors duration-200">
      <Toaster position="top-right" />

      {/* SIDEBAR */}
      <aside className="w-16 lg:w-64 bg-white dark:bg-[#1E293B] border-r border-slate-100 dark:border-slate-700 flex flex-col p-4 lg:p-6 z-20 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)] flex-shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg flex-shrink-0">
            <Activity size={22} />
          </div>
          <span className="font-bold text-xl hidden lg:block tracking-tighter text-slate-900 dark:text-white uppercase">
            VitalTrack
          </span>
        </div>
        <nav className="flex-1 space-y-3">
          <button
            onClick={() => setVistaActiva('dashboard')}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${
              vistaActiva === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutDashboard size={20} className="flex-shrink-0" />
            <span className="font-bold hidden lg:block text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => setVistaActiva('envios')}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${
              vistaActiva === 'envios'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Truck size={20} className="flex-shrink-0" />
            <span className="font-bold hidden lg:block text-sm">Envíos</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0 custom-scrollbar">
        {/* HEADER */}
        <header className="h-16 sm:h-20 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 transition-colors duration-200">
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Buscar telemetría..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-4">
            <div className="hidden sm:flex bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl text-[10px] font-black border border-emerald-100 dark:border-emerald-800 items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> LIVE GPS
            </div>
            {alertCount > 0 && (
              <div className="relative">
                <Bell size={20} className="text-slate-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-black text-white flex items-center justify-center">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              </div>
            )}
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-8">

          {/* ERROR BANNER */}
          {loadError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700 dark:text-red-400 flex-1">{loadError}</p>
              <button
                onClick={cargarEnvios}
                className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors whitespace-nowrap"
              >
                Reintentar
              </button>
            </div>
          )}

          {vistaActiva === 'dashboard' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

              {/* PAGE HEADER */}
              <div className="flex flex-wrap justify-between items-end gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Monitor de Flota Crítica
                  </h1>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                    <TrendingUp size={14} className="text-blue-600" /> Analítica de Cadena de Frío
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToExcel(shipments)}
                    disabled={isLoading || shipments.length === 0}
                    className="px-4 py-3 bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm hidden sm:flex items-center gap-2 transition-all active:scale-95 disabled:opacity-40"
                  >
                    Excel
                  </button>
                  <ReportGenerator shipments={shipments} />
                </div>
              </div>

              {/* KPI PANEL — skeleton while loading */}
              {isLoading ? <KPIPanelSkeleton /> : <KPIPanel shipments={shipments} />}

              {/* THERMAL CHART */}
              <div className="bg-white dark:bg-[#1E293B] p-6 sm:p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
                <div className="mb-6 sm:mb-10">
                  <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" /> Curva Térmica Operacional
                  </h3>
                  <p className="text-[10px] text-slate-300 dark:text-slate-500 font-bold uppercase mt-1">
                    Fluctuación de temperatura por unidad registrada
                  </p>
                </div>
                {isLoading ? (
                  <ChartSkeleton />
                ) : (
                  <div className="h-56 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={shipments}>
                        <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="insumo" hide />
                        <YAxis hide domain={[0, 'auto']} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '20px',
                            border: 'none',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: isDark ? '#1E293B' : '#ffffff',
                            color: isDark ? '#F8FAFC' : '#1E293B',
                          }}
                        />
                        <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTemp)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* MAP + ALERTS */}
              <div className="grid grid-cols-12 gap-6 sm:gap-8">
                <div className="col-span-12 lg:col-span-8 bg-white dark:bg-[#1E293B] rounded-[40px] border border-slate-100 dark:border-slate-700 p-3 shadow-xl h-[300px] sm:h-[440px] lg:h-[500px] transition-colors duration-200">
                  <MapContainer
                    center={[-34.6037, -58.3816]}
                    zoom={4}
                    style={{ height: '100%', width: '100%', borderRadius: '32px' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {enviosFiltrados.map(s => {
                      const oLat = Math.sin(Date.now() / 10000) * 0.12;
                      const oLng = Math.cos(Date.now() / 10000) * 0.12;
                      const simPos: [number, number] = [
                        (s.lat || -34.6) + oLat,
                        (s.long || -58.3) + oLng,
                      ];
                      return (
                        <Marker key={s.id} position={simPos} icon={customIcon(s.temp)}>
                          <Popup>
                            <div className="p-2 min-w-[150px]">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-black text-[10px] text-blue-600 uppercase tracking-tighter">
                                  {s.insumo}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${s.temp > 7 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                              </div>
                              <p className="text-xl font-black text-slate-800 mb-1">{s.temp.toFixed(1)}°C</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mb-3">{s.ubicacion}</p>
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[8px] font-black text-emerald-600 uppercase">Señal: 100%</span>
                                <Navigation size={10} className="text-blue-500" />
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>

                <AlertSystem shipments={shipments} onCountChange={setAlertCount} />
              </div>

              {/* ADD FORM */}
              <div className="bg-white dark:bg-[#1E293B] p-6 sm:p-10 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-6 sm:mb-8 flex items-center gap-2">
                  <Plus size={18} className="text-blue-600" /> Alta de Telemetría Médica
                </h3>
                <form onSubmit={handleAgregarEnvio} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Insumo</label>
                    <input
                      type="text"
                      placeholder="Ej: Insulina"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
                      value={nuevoInsumo}
                      onChange={e => setNuevoInsumo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Temp C°</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="4.5"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
                      value={nuevaTemp}
                      onChange={e => setNuevaTemp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Ciudad</label>
                    <input
                      type="text"
                      placeholder="Ej: Rosario"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
                      value={nuevaUbicacion}
                      onChange={e => setNuevaUbicacion(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full h-[52px] bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                      Desplegar Unidad
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* GESTIÓN OPERATIVA VIEW */
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Gestión Operativa
                  </h1>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">
                    Control maestro de inventario en ruta
                  </p>
                </div>
                <div className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-[11px] font-black shadow-lg shadow-blue-100">
                  {shipments.length} UNIDADES ACTIVAS
                </div>
              </div>

              {isLoading ? (
                <TableSkeleton />
              ) : shipments.length === 0 && !loadError ? (
                <div className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-slate-100 dark:border-slate-700 py-20 flex flex-col items-center gap-4 text-slate-400">
                  <Package size={48} className="opacity-30" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sin envíos registrados</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden transition-colors duration-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left font-bold text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase text-[9px] tracking-[0.2em]">
                        <tr>
                          <th className="px-6 sm:px-10 py-6 sm:py-8">Unidad ID</th>
                          <th className="px-6 sm:px-10 py-6 sm:py-8">Insumo</th>
                          <th className="px-6 sm:px-10 py-6 sm:py-8 hidden md:table-cell">Localización</th>
                          <th className="px-6 sm:px-10 py-6 sm:py-8 text-center">Temp.</th>
                          <th className="px-6 sm:px-10 py-6 sm:py-8 text-center">Riesgo</th>
                          <th className="px-6 sm:px-10 py-6 sm:py-8 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                        {shipments.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                            <td className="px-6 sm:px-10 py-5 text-slate-300 dark:text-slate-500 text-[10px]">
                              #VT-{s.id}
                            </td>
                            <td className="px-6 sm:px-10 py-5 text-slate-800 dark:text-white font-black uppercase text-[11px]">
                              {s.insumo}
                            </td>
                            <td className="px-6 sm:px-10 py-5 text-slate-400 font-bold uppercase tracking-tighter italic hidden md:table-cell">
                              {s.ubicacion}
                            </td>
                            <td className={`px-6 sm:px-10 py-5 text-center text-sm ${s.temp > 7 ? 'text-red-500' : 'text-emerald-500'} font-black`}>
                              {s.temp.toFixed(1)}°C
                            </td>
                            <td className="px-6 sm:px-10 py-5 text-center">
                              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase ${
                                s.temp > 7
                                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800'
                                  : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                              }`}>
                                {s.temp > 7 ? 'CRÍTICO' : 'ESTABLE'}
                              </span>
                            </td>
                            <td className="px-6 sm:px-10 py-5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => generateEnvioPDF(s)}
                                  title="Generar PDF"
                                  className="text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-all p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl group-hover:text-slate-400"
                                >
                                  <FileText size={16} />
                                </button>
                                <button
                                  onClick={() => handleEliminarEnvio(s.id)}
                                  title="Eliminar"
                                  className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl group-hover:text-slate-400"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
