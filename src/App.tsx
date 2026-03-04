import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  LayoutDashboard, Truck, Activity, Plus, Trash2,
  AlertCircle, Thermometer, Search, FileSpreadsheet,
  Bell
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';

// --- CONFIGURACIÓN DE ICONOS ---
const customIcon = (temp: number) => new L.Icon({
  iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
  className: temp > 7 ? 'filter-red' : 'filter-blue'
});

// --- CLIENTE SUPABASE ---
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- UTILIDADES ---
import { exportToExcel } from './utils/exportExcel';
import { getCoordinates } from './utils/geocoding';

export default function App() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'envios'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [nuevoInsumo, setNuevoInsumo] = useState('');
  const [nuevaTemp, setNuevaTemp] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');

  const fetchEnvios = async () => {
    const { data, error } = await supabase
      .from('envios')
      .select('*')
      .order('id', { ascending: false });
    if (data) setShipments(data);
  };

  useEffect(() => { fetchEnvios(); }, []);

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
    const loading = toast.loading("Geolocalizando...");
    const coords = await getCoordinates(nuevaUbicacion);
    const tempNum = parseFloat(nuevaTemp);
    
    const { error } = await supabase.from('envios').insert([{ 
      insumo: nuevoInsumo, 
      temp: tempNum, 
      ubicacion: nuevaUbicacion, 
      estado: tempNum > 7 ? 'CRÍTICO' : 'EN RUTA',
      lat: coords ? coords.lat : -34.6037, 
      long: coords ? coords.lng : -58.3816
    }]);
    
    toast.dismiss(loading);
    if (!error) { 
      toast.success("Registro exitoso");
      setNuevoInsumo(''); setNuevaTemp(''); setNuevaUbicacion(''); 
      fetchEnvios(); 
    }
  };

  const eliminarEnvio = async (id: number) => {
    const { error } = await supabase.from('envios').delete().eq('id', id);
    if (!error) { toast.success("Registro eliminado"); fetchEnvios(); }
  };

  // CÁLCULOS RÁPIDOS
  const criticosCount = enviosCriticos.length;
  const promedio = shipments.length > 0 
    ? (shipments.reduce((acc, s) => acc + s.temp, 0) / shipments.length).toFixed(1) 
    : 0;

  // COMPONENTE TABLA REUTILIZABLE
  const TablaGeneral = () => (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left font-bold text-[11px]">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                    <th className="px-8 py-5">ID</th>
                    <th className="px-8 py-5">Insumo</th>
                    <th className="px-8 py-5">Ubicación</th>
                    <th className="px-8 py-5 text-center">Estado</th>
                    <th className="px-8 py-5 text-center">Temp</th>
                    <th className="px-8 py-5 text-right">Acción</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {enviosFiltrados.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-8 py-5 text-blue-600 font-mono">#VT-{s.id}</td>
                        <td className="px-8 py-5 text-slate-700">{s.insumo}</td>
                        <td className="px-8 py-5 text-slate-400 font-normal">{s.ubicacion}</td>
                        <td className="px-8 py-5 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${s.temp > 7 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {s.temp > 7 ? 'CRÍTICO' : 'NOMINAL'}
                            </span>
                        </td>
                        <td className="px-8 py-5 text-center">{s.temp}°C</td>
                        <td className="px-8 py-5 text-right">
                            <button onClick={() => eliminarEnvio(s.id)} className="text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                <Trash2 size={16}/>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );

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
          <NavItem icon={<LayoutDashboard size={22} />} label="Dashboard" active={vistaActiva === 'dashboard'} onClick={() => setVistaActiva('dashboard')} />
          <NavItem icon={<Truck size={22} />} label="Envíos" active={vistaActiva === 'envios'} onClick={() => setVistaActiva('envios')} />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-10 sticky top-0 z-10">
            <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="Filtrar por insumo o ciudad..." className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-full text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black border border-emerald-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> SISTEMA ACTIVO
                </div>
            </div>
        </header>

        <div className="p-10">
            {vistaActiva === 'dashboard' ? (
                /* --- VISTA DASHBOARD COMPLETA --- */
                <div className="space-y-8">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Monitoreo</h1>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Vista global de telemetría</p>
                        </div>
                        <button onClick={() => exportToExcel(enviosFiltrados)} className="px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                            <FileSpreadsheet size={16} /> Exportar Reporte
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard icon={<AlertCircle size={28}/>} color="bg-red-50 text-red-500" label="Alertas Críticas" value={criticosCount} />
                        <MetricCard icon={<Truck size={28}/>} color="bg-emerald-50 text-emerald-500" label="Total Envíos" value={shipments.length} />
                        <MetricCard icon={<Thermometer size={28}/>} color="bg-blue-50 text-blue-500" label="Temp. Global" value={`${promedio}°C`} />
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* MAPA */}
                        <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] border border-slate-100 p-2 shadow-sm h-[450px] overflow-hidden">
                            <MapContainer center={[-34.6037, -58.3816]} zoom={4} className="h-full w-full rounded-[28px]">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {enviosFiltrados.map((s) => (
                                    s.lat && s.long && (
                                        <Marker key={s.id} position={[s.lat, s.long]} icon={customIcon(s.temp)}>
                                            <Popup><div className="text-xs font-bold">{s.insumo} - {s.temp}°C</div></Popup>
                                        </Marker>
                                    )
                                ))}
                            </MapContainer>
                        </div>

                        {/* FEED DE ALERTAS DINÁMICO */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Bell size={14} className="text-red-500" /> Historial de Riesgos
                                    </h3>
                                    {criticosCount > 0 && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                    )}
                                </div>
                                
                                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {enviosCriticos.length > 0 ? (
                                        enviosCriticos.map(s => (
                                            <div key={s.id} className="p-4 bg-red-50/50 rounded-2xl border border-red-100 transition-all hover:bg-red-50">
                                                <p className="text-[11px] font-black text-red-700 uppercase tracking-tight">{s.insumo}</p>
                                                <p className="text-[10px] text-red-500 font-bold mt-1">{s.temp}°C • {s.ubicacion}</p>
                                                <div className="mt-2 flex items-center gap-1 text-[9px] text-red-400 font-bold uppercase">
                                                    <AlertCircle size={10} /> Acción Requerida
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-50 rounded-3xl">
                                            <div className="bg-emerald-50 text-emerald-500 p-3 rounded-full mb-3"><Activity size={20} /></div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Cadena de frío estable en toda la red</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN INFERIOR: CARGA Y TABLA */}
                    <div className="grid grid-cols-1 gap-8">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Plus size={16} className="text-blue-600" /> Registro Rápido de Telemetría
                            </h3>
                            <form onSubmit={agregarEnvio} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input type="text" placeholder="Insumo Médico" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-blue-100 transition-all" value={nuevoInsumo} onChange={(e) => setNuevoInsumo(e.target.value)} />
                                <input type="number" step="0.1" placeholder="Temp (°C)" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-blue-100 transition-all" value={nuevaTemp} onChange={(e) => setNuevaTemp(e.target.value)} />
                                <input type="text" placeholder="Ciudad de Destino" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-blue-100 transition-all" value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} />
                                <button type="submit" className="bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">Registrar</button>
                            </form>
                        </div>
                        <TablaGeneral />
                    </div>
                </div>
            ) : (
                /* --- VISTA ENVÍOS (GESTIÓN PURA) --- */
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Flota</h1>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100">{enviosFiltrados.length} Registros totales</span>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <form onSubmit={agregarEnvio} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input type="text" placeholder="Insumo" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" value={nuevoInsumo} onChange={(e) => setNuevoInsumo(e.target.value)} />
                            <input type="number" step="0.1" placeholder="Temp" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" value={nuevaTemp} onChange={(e) => setNuevaTemp(e.target.value)} />
                            <input type="text" placeholder="Ubicación" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} />
                            <button type="submit" className="bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl">Añadir Registro</button>
                        </form>
                    </div>
                    <TablaGeneral />
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
function NavItem({ icon, label, active = false, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
      {icon} <span className="font-bold hidden lg:block text-sm">{label}</span>
    </div>
  );
}

function MetricCard({ icon, color, label, value }: any) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 flex items-center gap-6 shadow-sm hover:translate-y-[-4px] transition-all duration-300">
      <div className={`${color} p-5 rounded-[24px]`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
      </div>
    </div>
  );
}