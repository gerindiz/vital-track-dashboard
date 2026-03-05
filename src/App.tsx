import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  LayoutDashboard, Truck, Activity, Plus, Trash2,
  AlertCircle, Thermometer, Search, FileSpreadsheet,
  Bell, Package, Navigation, TrendingUp
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { createClient } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';

// --- CONFIGURACIÓN DE ICONOS DE MAPA ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const customIcon = (temp: number) => new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + (temp > 7 ? 'red' : 'blue') + '.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- CLIENTE SUPABASE ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- UTILIDADES ---
import { exportToExcel } from './utils/exportExcel';
import { getCoordinates } from './utils/geocoding';

export default function App() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'envios'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [tick, setTick] = useState(0); 
  
  const [nuevoInsumo, setNuevoInsumo] = useState('');
  const [nuevaTemp, setNuevaTemp] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');

  const fetchEnvios = async () => {
    try {
      const { data, error } = await supabase
        .from('envios')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      if (data) setShipments(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    }
  };

  useEffect(() => { 
    fetchEnvios(); 
  }, []);

  // Ticker para simular movimiento GPS cada 2 segundos
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(timer);
  }, []);

  const enviosFiltrados = shipments.filter(s => 
    s.insumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enviosCriticos = shipments.filter(s => s.temp > 7);

  const agregarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoInsumo || !nuevaTemp || !nuevaUbicacion) {
      toast.error("Datos incompletos");
      return;
    }

    const loading = toast.loading("Localizando unidad...");
    try {
      const coords = await getCoordinates(nuevaUbicacion);
      const lat = coords?.lat || -34.6037;
      const lng = coords?.lng || -58.3816;

      const { error } = await supabase.from('envios').insert([{ 
        insumo: nuevoInsumo, 
        temp: parseFloat(nuevaTemp), 
        ubicacion: nuevaUbicacion, 
        estado: parseFloat(nuevaTemp) > 7 ? 'CRÍTICO' : 'EN RUTA',
        lat: lat, 
        long: lng 
      }]);
      
      toast.dismiss(loading);
      if (error) throw error;
      toast.success("Envío en camino");
      setNuevoInsumo(''); setNuevaTemp(''); setNuevaUbicacion(''); 
      fetchEnvios(); 
    } catch (error) {
      toast.dismiss(loading);
      toast.error("Error al registrar");
    }
  };

  const eliminarEnvio = async (id: number) => {
    const { error } = await supabase.from('envios').delete().eq('id', id);
    if (!error) { 
      toast.success("Registro eliminado"); 
      fetchEnvios(); 
    }
  };

  const promedio = shipments.length > 0 
    ? (shipments.reduce((acc, s) => acc + s.temp, 0) / shipments.length).toFixed(1) 
    : 0;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      <Toaster position="top-right" />
      
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-64 bg-white border-r flex flex-col p-6 z-20 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Activity size={24} /></div>
          <span className="font-bold text-xl hidden lg:block tracking-tighter text-slate-900 uppercase">VitalTrack</span>
        </div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setVistaActiva('dashboard')} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${vistaActiva === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutDashboard size={22} /> <span className="font-bold hidden lg:block text-sm">Dashboard</span>
          </button>
          <button onClick={() => setVistaActiva('envios')} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${vistaActiva === 'envios' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Truck size={22} /> <span className="font-bold hidden lg:block text-sm">Envíos</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-10 sticky top-0 z-30">
            <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="Buscar telemetría activa..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black border border-emerald-100 flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> SISTEMA LIVE GPS
                </div>
            </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto space-y-10">
            {vistaActiva === 'dashboard' ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Monitor de Flota Crítica</h1>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                <TrendingUp size={14} className="text-blue-600" /> Analítica de Cadena de Frío
                            </p>
                        </div>
                        <button onClick={() => exportToExcel(shipments)} className="px-6 py-4 bg-white border border-slate-100 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-all active:scale-95">
                            <FileSpreadsheet size={18} className="text-emerald-500" /> Descargar Reporte
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <MetricCard icon={<AlertCircle size={28}/>} color="bg-red-50 text-red-500" label="Zonas de Riesgo" value={enviosCriticos.length} />
                        <MetricCard icon={<Package size={28}/>} color="bg-emerald-50 text-emerald-500" label="Cargas en Ruta" value={shipments.length} />
                        <MetricCard icon={<Thermometer size={28}/>} color="bg-blue-50 text-blue-500" label="Media Térmica" value={`${promedio}°C`} />
                    </div>

                    {/* --- GRÁFICO DE TENDENCIA PREMIUM --- */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <Activity size={16} className="text-blue-600" /> Curva Térmica Operacional
                                </h3>
                                <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Fluctuación de temperatura por unidad registrada</p>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={shipments}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="insumo" hide />
                                    <YAxis hide domain={[0, 'auto']} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTemp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* MAPA GPS SIMULADO */}
                        <div className="col-span-12 lg:col-span-8 bg-white rounded-[40px] border border-slate-100 p-3 shadow-xl h-[500px]">
                            <MapContainer center={[-34.6037, -58.3816]} zoom={4} style={{ height: '100%', width: '100%', borderRadius: '32px' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {enviosFiltrados.map((s) => {
                                    // Simulación de movimiento constante
                                    const oLat = Math.sin(Date.now() / 10000) * 0.12;
                                    const oLng = Math.cos(Date.now() / 10000) * 0.12;
                                    const simPos: [number, number] = [(s.lat || -34.6) + oLat, (s.long || s.lng || -58.3) + oLng];

                                    return (
                                        <Marker key={s.id} position={simPos} icon={customIcon(s.temp)}>
                                            <Popup>
                                                <div className="p-2 min-w-[150px]">
                                                  <div className="flex justify-between items-center mb-2">
                                                    <span className="font-black text-[10px] text-blue-600 uppercase tracking-tighter">{s.insumo}</span>
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

                        <div className="col-span-12 lg:col-span-4 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                                <Bell size={14} className="text-red-500 animate-bounce" /> Centro de Notificaciones
                            </h3>
                            <div className="space-y-5 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar">
                                {enviosCriticos.length > 0 ? (
                                    enviosCriticos.map(s => (
                                        <div key={s.id} className="p-5 bg-red-50/50 rounded-3xl border border-red-100 transition-all hover:scale-[1.02]">
                                            <p className="text-[10px] font-black text-red-700 uppercase">{s.insumo}</p>
                                            <p className="text-xs font-bold text-red-600 mt-1">Alerta: {s.temp}°C</p>
                                            <p className="text-[9px] text-red-400 font-bold mt-2 uppercase tracking-tighter">{s.ubicacion}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 opacity-20">
                                        <Activity size={48} className="mx-auto mb-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin alertas activas</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                            <Plus size={18} className="text-blue-600" /> Alta de Telemetría Médica
                        </h3>
                        <form onSubmit={agregarEnvio} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Insumo</label>
                                <input type="text" placeholder="Ej: Insulina" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={nuevoInsumo} onChange={(e) => setNuevoInsumo(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Temp C°</label>
                                <input type="number" step="0.1" placeholder="4.5" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={nuevaTemp} onChange={(e) => setNuevaTemp(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Ciudad</label>
                                <input type="text" placeholder="Ej: Rosario" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} />
                            </div>
                            <div className="flex items-end">
                                <button type="submit" className="w-full h-[52px] bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">Desplegar Unidad</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión Operativa</h1>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">Control maestro de inventario en ruta</p>
                        </div>
                        <div className="bg-blue-600 text-white px-6 py-2 rounded-2xl text-[11px] font-black shadow-lg shadow-blue-100">
                            {shipments.length} UNIDADES ACTIVAS
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                        <table className="w-full text-left font-bold text-[11px]">
                            <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-[0.2em]">
                                <tr>
                                    <th className="px-10 py-8">Unidad ID</th>
                                    <th className="px-10 py-8">Insumo Médico</th>
                                    <th className="px-10 py-8">Geolocalización</th>
                                    <th className="px-10 py-8 text-center">Temp. Real</th>
                                    <th className="px-10 py-8 text-center">Nivel Riesgo</th>
                                    <th className="px-10 py-8 text-right">Administrar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {shipments.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6 text-slate-300">#VT-{s.id}</td>
                                        <td className="px-10 py-6 text-slate-800 font-black uppercase">{s.insumo}</td>
                                        <td className="px-10 py-6 text-slate-400 font-bold uppercase tracking-tighter italic">{s.ubicacion}</td>
                                        <td className={`px-10 py-6 text-center text-sm ${s.temp > 7 ? 'text-red-500' : 'text-emerald-500'} font-black`}>{s.temp.toFixed(1)}°C</td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${s.temp > 7 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                {s.temp > 7 ? 'CRÍTICO' : 'ESTABLE'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button onClick={() => eliminarEnvio(s.id)} className="text-slate-200 hover:text-red-500 transition-all p-3 hover:bg-red-50 rounded-2xl group-hover:text-slate-400">
                                                <Trash2 size={18}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({ icon, color, label, value }: any) {
  return (
    <div className="bg-white p-10 rounded-[40px] border border-slate-100 flex items-center gap-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
      <div className={`${color} p-6 rounded-[30px] shadow-inner`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
        <p className="text-4xl font-black text-slate-800 tracking-tighter">{value}</p>
      </div>
    </div>
  );
}