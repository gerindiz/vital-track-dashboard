import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  LayoutDashboard, Truck, Activity, Plus, Trash2,
  AlertCircle, Thermometer, Search, FileSpreadsheet,
  Bell, Package
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';

// --- ARREGLO DE ICONOS DE LEAFLET ---
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
      console.error("Error cargando datos:", error);
      toast.error("Error de conexión con la base de datos");
    }
  };

  useEffect(() => { 
    fetchEnvios(); 
  }, []);

  const enviosFiltrados = shipments.filter(s => 
    s.insumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enviosCriticos = shipments.filter(s => s.temp > 7);

  const agregarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoInsumo || !nuevaTemp || !nuevaUbicacion) {
      toast.error("Completa todos los campos");
      return;
    }

    const loading = toast.loading("Registrando telemetría...");
    
    try {
      const coords = await getCoordinates(nuevaUbicacion);
      const lat = coords?.lat || -34.6037;
      const lng = coords?.lng || -58.3816; // Usamos 'long' para el insert si así se llama en tu DB

      const tempNum = parseFloat(nuevaTemp);
      
      const { error } = await supabase.from('envios').insert([{ 
        insumo: nuevoInsumo, 
        temp: tempNum, 
        ubicacion: nuevaUbicacion, 
        estado: tempNum > 7 ? 'CRÍTICO' : 'EN RUTA',
        lat: lat, 
        long: lng // Verifica si en Supabase es 'long' o 'lng'
      }]);
      
      toast.dismiss(loading);
      if (error) throw error;

      toast.success("Envío registrado correctamente");
      setNuevoInsumo(''); setNuevaTemp(''); setNuevaUbicacion(''); 
      fetchEnvios(); 
    } catch (error) {
      toast.dismiss(loading);
      toast.error("Error al guardar registro");
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
                <input type="text" placeholder="Filtrar por insumo o ciudad..." className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-full text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black border border-emerald-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> CLOUD CONNECTED
                </div>
            </div>
        </header>

        <div className="p-10">
            {vistaActiva === 'dashboard' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Monitor de Red Crítica</h1>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Cadena de Frío en Tiempo Real</p>
                        </div>
                        <button onClick={() => exportToExcel(shipments)} className="px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                            <FileSpreadsheet size={16} /> Descargar Reporte
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard icon={<AlertCircle size={28}/>} color="bg-red-50 text-red-500" label="Alertas Críticas" value={enviosCriticos.length} />
                        <MetricCard icon={<Package size={28}/>} color="bg-emerald-50 text-emerald-500" label="En Tránsito" value={shipments.length} />
                        <MetricCard icon={<Thermometer size={28}/>} color="bg-blue-50 text-blue-500" label="Temp. Global" value={`${promedio}°C`} />
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] border border-slate-100 p-2 shadow-sm h-[450px]">
                            <MapContainer center={[-34.6037, -58.3816]} zoom={4} style={{ height: '100%', width: '100%', borderRadius: '26px' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {enviosFiltrados.map((s) => (
                                    s.lat && (s.long || s.lng) && (
                                        <Marker key={s.id} position={[s.lat, s.long || s.lng]} icon={customIcon(s.temp)}>
                                            <Popup>
                                                <div className="text-xs">
                                                  <p className="font-bold">{s.insumo}</p>
                                                  <p>{s.temp}°C - {s.ubicacion}</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )
                                ))}
                            </MapContainer>
                        </div>

                        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
                            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Bell size={14} className="text-red-500" /> Historial de Alertas
                            </h3>
                            <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                                {enviosCriticos.length > 0 ? (
                                    enviosCriticos.map(s => (
                                        <div key={s.id} className="p-4 bg-red-50/50 rounded-2xl border border-red-100 animate-in slide-in-from-right-2">
                                            <p className="text-[11px] font-black text-red-700 uppercase">{s.insumo}</p>
                                            <p className="text-[10px] text-red-500 font-bold">{s.temp}°C • {s.ubicacion}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-[10px] text-slate-300 font-black uppercase">Sin incidencias</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <Plus size={16} className="text-blue-600" /> Registrar Nuevo Despacho
                        </h3>
                        <form onSubmit={agregarEnvio} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input type="text" placeholder="Nombre del Insumo" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={nuevoInsumo} onChange={(e) => setNuevoInsumo(e.target.value)} />
                            <input type="number" step="0.1" placeholder="Temp (°C)" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={nuevaTemp} onChange={(e) => setNuevaTemp(e.target.value)} />
                            <input type="text" placeholder="Ciudad de Destino" className="p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} />
                            <button type="submit" className="bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">Crear Registro</button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Gestión de Envíos</h1>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Administración de registros y logística</p>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <h3 className="font-bold text-sm">Listado Maestro de Flota</h3>
                            <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-bold shadow-md shadow-blue-100">
                                {shipments.length} Registros Activos
                            </span>
                        </div>
                        <table className="w-full text-left font-bold text-[11px]">
                            <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Identificador</th>
                                    <th className="px-8 py-5">Insumo Médico</th>
                                    <th className="px-8 py-5">Destino Final</th>
                                    <th className="px-8 py-5 text-center">Temperatura</th>
                                    <th className="px-8 py-5 text-center">Estado</th>
                                    <th className="px-8 py-5 text-right">Gestión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {shipments.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5 text-slate-300">#VT-0{s.id}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3 font-black text-slate-700">
                                                <div className={`w-2 h-2 rounded-full ${s.temp > 7 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                {s.insumo}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-slate-400 font-medium">{s.ubicacion}</td>
                                        <td className={`px-8 py-5 text-center text-sm ${s.temp > 7 ? 'text-red-500 font-black' : 'text-emerald-500 font-black'}`}>
                                            {s.temp.toFixed(1)}°C
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${s.temp > 7 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                {s.temp > 7 ? 'CRÍTICO' : 'ESTABLE'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => eliminarEnvio(s.id)} className="text-slate-200 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl group-hover:text-slate-400">
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {shipments.length === 0 && (
                            <div className="p-32 text-center">
                                <Activity size={48} className="mx-auto text-slate-100 mb-4" />
                                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">No hay datos en el sistema</p>
                            </div>
                        )}
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
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={`${color} p-5 rounded-[24px]`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
      </div>
    </div>
  );
}