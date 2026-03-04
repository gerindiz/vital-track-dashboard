import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  LayoutDashboard, Truck, Activity, Plus, Trash2,
  AlertCircle, Thermometer, Search, FileSpreadsheet 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Importación de utilidades
import { exportToExcel } from './utils/exportExcel';
import { getCoordinates } from './utils/geocoding';

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

export default function App() {
  const [shipments, setShipments] = useState<any[]>([]);
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

  // AGREGAR ENVÍO CON PRECISIÓN GEOGRÁFICA
  const agregarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoInsumo || !nuevaTemp || !nuevaUbicacion) return;
    
    // 1. Obtener coordenadas reales de la dirección escrita
    const coords = await getCoordinates(nuevaUbicacion);
    const tempNum = parseFloat(nuevaTemp);
    
    // 2. Insertar en Supabase incluyendo LAT y LNG
    const { error } = await supabase.from('envios').insert([{ 
      insumo: nuevoInsumo, 
      temp: tempNum, 
      ubicacion: nuevaUbicacion, 
      estado: tempNum > 7 ? 'CRÍTICO' : 'EN RUTA',
      lat: coords ? coords.lat : -34.6037, // Default a Buenos Aires si falla
      lng: coords ? coords.lng : -58.3816
    }]);
    
    if (!error) { 
      setNuevoInsumo(''); setNuevaTemp(''); setNuevaUbicacion(''); 
      fetchEnvios(); 
    }
  };

  const eliminarEnvio = async (id: number) => {
    const { error } = await supabase.from('envios').delete().eq('id', id);
    if (!error) fetchEnvios();
  };

  const criticos = shipments.filter(s => s.temp > 7).length;
  const normales = shipments.filter(s => s.temp <= 7).length;
  const promedio = shipments.length > 0 
    ? (shipments.reduce((acc, s) => acc + s.temp, 0) / shipments.length).toFixed(1) 
    : 0;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-64 bg-white border-r flex flex-col p-6 z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Activity size={24} /></div>
          <span className="font-bold text-xl hidden lg:block tracking-tighter text-slate-900">VitalTrack</span>
        </div>
        <nav className="flex-1 space-y-3">
          <NavItem icon={<LayoutDashboard size={22} />} label="Dashboard" active />
          <NavItem icon={<Truck size={22} />} label="Envíos" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-10 sticky top-0 z-10">
            <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="Buscar flota..." className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-full text-xs font-medium outline-none" />
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black border border-emerald-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> SISTEMA EN VIVO
            </div>
        </header>

        <div className="p-10">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Telemetría Geográfica de Precisión</h1>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Monitoreo con Geocodificación Activa</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <MetricCard icon={<AlertCircle size={28}/>} color="bg-red-50 text-red-500" label="Alertas Críticas" value={criticos} />
                <MetricCard icon={<Truck size={28}/>} color="bg-emerald-50 text-emerald-500" label="En Tránsito" value={normales} />
                <MetricCard icon={<Thermometer size={28}/>} color="bg-blue-50 text-blue-500" label="Temp. Promedio" value={`${promedio}°C`} />
            </div>

            <div className="grid grid-cols-12 gap-8">
                
                {/* MAPA CON POSICIONES REALES */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] border border-slate-100 p-2 shadow-sm h-[500px] relative overflow-hidden">
                    <MapContainer center={[-34.6037, -58.3816]} zoom={4} className="h-full w-full rounded-[28px]">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {shipments.map((s) => (
                          s.lat && s.lng && (
                            <Marker key={s.id} position={[s.lat, s.lng]} icon={customIcon(s.temp)}>
                              <Popup>
                                <div className="p-1 font-sans text-xs">
                                  <h3 className="font-bold text-blue-600">{s.insumo}</h3>
                                  <p>Temp: <b>{s.temp}°C</b> | {s.ubicacion}</p>
                                </div>
                              </Popup>
                            </Marker>
                          )
                        ))}
                    </MapContainer>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-xl shadow-blue-100">
                        <h3 className="font-bold text-lg mb-2">Reportes Oficiales</h3>
                        <p className="text-sm opacity-80 mb-6 leading-relaxed">Genera documentos de auditoría técnica en tiempo real.</p>
                        <button onClick={() => exportToExcel(shipments)} className="w-full py-4 bg-white text-blue-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg">
                            <FileSpreadsheet size={18} /> Exportar Reporte Excel
                        </button>
                    </div>
                    
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400 mb-6">Estado del Sistema</h3>
                        <ProgressBar label="Precisión GPS" value={98} color="bg-blue-600" />
                    </div>
                </div>

                {/* FORMULARIO DE CARGA */}
                <div className="col-span-12 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Plus size={18} className="text-blue-600" /> Nuevo Registro con Geo-localización</h3>
                    <form onSubmit={agregarEnvio} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="text" placeholder="Insumo Médico" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={nuevoInsumo} onChange={(e) => setNuevoInsumo(e.target.value)} />
                        <input type="number" step="0.1" placeholder="Temp (°C)" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={nuevaTemp} onChange={(e) => setNuevaTemp(e.target.value)} />
                        <input type="text" placeholder="Ciudad o Dirección (ej: Cordoba, AR)" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} />
                        <button type="submit" className="bg-blue-600 text-white font-black text-[10px] uppercase rounded-xl">Registrar en Mapa</button>
                    </form>
                </div>

                <div className="col-span-12 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-20">
                    <table className="w-full text-left font-bold text-[11px]">
                        <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Identificador</th>
                                <th className="px-8 py-5">Insumo</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                                <th className="px-8 py-5 text-center">Temp</th>
                                <th className="px-8 py-5 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {shipments.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-6 text-blue-600">#VT-{s.id}</td>
                                    <td className="px-8 py-6 text-slate-700">{s.insumo}</td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${s.temp > 7 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {s.temp > 7 ? 'CRÍTICO' : 'NOMINAL'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">{s.temp}°C</td>
                                    <td className="px-8 py-6 text-right">
                                        <button onClick={() => eliminarEnvio(s.id)} className="text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

// COMPONENTES AUXILIARES
function NavItem({ icon, label, active = false }: any) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
      {icon} <span className="font-bold hidden lg:block text-sm">{label}</span>
    </div>
  );
}

function MetricCard({ icon, color, label, value }: any) {
  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 flex items-center gap-5 shadow-sm">
      <div className={`${color} p-4 rounded-2xl`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: any) {
    return (
        <div>
            <div className="flex justify-between text-[10px] font-black mb-2 uppercase text-slate-500">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}