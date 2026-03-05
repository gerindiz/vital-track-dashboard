import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  LayoutDashboard, Truck, Activity, Plus, Trash2,
  AlertCircle, Thermometer, Search, FileSpreadsheet,
  Bell, Package, Navigation
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';

// --- ARREGLO DE ICONOS DE LEAFLET (Evita que desaparezcan los markers) ---
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
  const [tick, setTick] = useState(0); // Para forzar el refresco de los movimientos GPS
  
  const [nuevoInsumo, setNuevoInsumo] = useState('');
  const [nuevaTemp, setNuevaTemp] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');

  // 1. Cargar datos de Supabase
  const fetchEnvios = async () => {
    try {
      const { data, error } = await supabase
        .from('envios')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      if (data) setShipments(data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error de conexión");
    }
  };

  useEffect(() => { 
    fetchEnvios(); 
  }, []);

  // 2. Efecto de "Ticker" para simular movimiento GPS en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 2000); // Se mueve cada 2 segundos
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
      toast.error("Campos incompletos");
      return;
    }

    const loading = toast.loading("Geolocalizando unidad...");
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
      toast.success("Envío registrado");
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
      <aside className="w-20 lg:w-64 bg-white border-r flex flex-col p-6 z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Activity size={24} /></div>
          <span className="font-bold text-xl hidden lg:block tracking-tighter text-slate-900">VitalTrack</span>
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

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-10 sticky top-0 z-10">
            <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="Filtrar telemetría..." className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-full text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black border border-blue-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> LIVE GPS ACTIVE
                </div>
            </div>
        </header>

        <div className="p-10">
            {vistaActiva === 'dashboard' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Monitor de Cadena de Frío</h1>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Geolocalización Satelital en Vivo</p>
                        </div>
                        <button onClick={() => exportToExcel(shipments)} className="px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm flex items-center gap-2">
                            <FileSpreadsheet size={16} /> Exportar Excel
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard icon={<AlertCircle size={28}/>} color="bg-red-50 text-red-500" label="Zonas Críticas" value={enviosCriticos.length} />
                        <MetricCard icon={<Package size={28}/>} color="bg-emerald-50 text-emerald-500" label="Unidades en Ruta" value={shipments.length} />
                        <MetricCard icon={<Thermometer size={28}/>} color="bg-blue-50 text-blue-500" label="Promedio Red" value={`${promedio}°C`} />
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* MAPA CON MOVIMIENTO SIMULADO */}
                        <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] border border-slate-100 p-2 shadow-sm h-[450px]">
                            <MapContainer center={[-34.6037, -58.3816]} zoom={4} style={{ height: '100%', width: '100%', borderRadius: '26px' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {enviosFiltrados.map((s) => {
                                    // Cálculo de movimiento suave para la demo
                                    const offsetLat = Math.sin(Date.now() / 8000) * 0.08;
                                    const offsetLng = Math.cos(Date.now() / 8000) * 0.08;
                                    const pos: [number, number] = [(s.lat || -34.6), (s.long || s.lng || -58.3)];
                                    const simulatedPos: [number, number] = [pos[0] + offsetLat, pos[1] + offsetLng];

                                    return (
                                        <Marker key={s.id} position={simulatedPos} icon={customIcon(s.temp)}>
                                            <Popup>
                                                <div className="p-1">
                                                  <p className="font-black text-[10px] text-blue-600 uppercase mb-1">{s.insumo}</p>
                                                  <p className="text-[11px] font-bold">{s.temp}°C • {s.ubicacion}</p>
                                                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                                      <span className="text-[8px] font-black text-emerald-600 uppercase">GPS Activo</span>
                                                  </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        </div>

                        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
                            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Bell size={14} className="text-red-500" /> Registro de Incidencias
                            </h3>
                            <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2">
                                {enviosCriticos.length > 0 ? (
                                    enviosCriticos.map(s => (
                                        <div key={s.id} className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                                            <p className="text-[11px] font-black text-red-700 uppercase italic">{s.insumo}</p>
                                            <p className="text-[10px] text-red-500 font-bold tracking-tight">EXCURSIÓN TÉRMICA: {s.temp}°C</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-30">
                                        <Navigation size={32} className="mx-auto mb-2" />
                                        <p className="text-[9px] font-black uppercase">Red Operando Normal</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <Plus size={16} className="text-blue-600" /> Nuevo Despacho de Insumo
                        </h3>
                        <form onSubmit={agregarEnvio} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input type="text" placeholder="Insumo Médico" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" value={nuevoInsumo} onChange={(e) => setNuevoInsumo(e.target.value)} />
                            <input type="number" step="0.1" placeholder="Temp (°C)" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" value={nuevaTemp} onChange={(e) => setNuevaTemp(e.target.value)} />
                            <input type="text" placeholder="Localidad" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} />
                            <button type="submit" className="bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-blue-700 transition-all">Iniciar Tracking</button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Gestión de Flota</h1>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Control detallado de envíos médicos</p>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left font-bold text-[11px]">
                            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[9px] tracking-widest">
                                <tr>
                                    <th className="px-8 py-6">Cod. Envío</th>
                                    <th className="px-8 py-6">Insumo</th>
                                    <th className="px-8 py-6">Ubicación</th>
                                    <th className="px-8 py-6 text-center">Temp. Actual</th>
                                    <th className="px-8 py-6 text-center">Estatus</th>
                                    <th className="px-8 py-6 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {shipments.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 text-slate-300">#VT-{s.id}</td>
                                        <td className="px-8 py-5">{s.insumo}</td>
                                        <td className="px-8 py-5 text-slate-400 font-medium">{s.ubicacion}</td>
                                        <td className={`px-8 py-5 text-center font-black ${s.temp > 7 ? 'text-red-500' : 'text-emerald-500'}`}>{s.temp}°C</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black ${s.temp > 7 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                {s.temp > 7 ? 'CRÍTICO' : 'ESTABLE'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => eliminarEnvio(s.id)} className="text-slate-200 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={16}/>
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
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 flex items-center gap-6 shadow-sm">
      <div className={`${color} p-5 rounded-[24px]`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
      </div>
    </div>
  );
}