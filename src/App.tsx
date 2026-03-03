import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Truck, Bell, Activity, MapPin, Trash2, Plus, 
  AlertCircle, Thermometer, Search, Settings, Package, Navigation, Filter
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE CONEXIÓN ---

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [shipments, setShipments] = useState<any[]>([]);
  
  // Estados para el formulario de carga
  const [nuevoInsumo, setNuevoInsumo] = useState('');
  const [nuevaTemp, setNuevaTemp] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');

  // 1. Función para obtener datos
  const fetchEnvios = async () => {
    try {
      const { data, error } = await supabase
        .from('envios')
        .select('*')
        .order('id', { ascending: false });
      if (data) setShipments(data);
      if (error) console.error("Error Supabase:", error.message);
    } catch (err) {
      console.error("Error de conexión:", err);
    }
  };

  useEffect(() => { 
    fetchEnvios(); 
  }, []);

  // 2. Función para agregar nuevo envío
  const agregarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoInsumo || !nuevaTemp || !nuevaUbicacion) return;
    
    const tempNum = parseFloat(nuevaTemp);
    const { error } = await supabase.from('envios').insert([
      { 
        insumo: nuevoInsumo, 
        temp: tempNum, 
        ubicacion: nuevaUbicacion, 
        estado: tempNum > 7 ? 'CRÍTICO' : 'EN RUTA' 
      }
    ]);
    
    if (!error) { 
      setNuevoInsumo(''); 
      setNuevaTemp(''); 
      setNuevaUbicacion(''); 
      fetchEnvios(); 
    }
  };

  // 3. Función para eliminar
  const eliminarEnvio = async (id: number) => {
    const { error } = await supabase.from('envios').delete().eq('id', id);
    if (!error) fetchEnvios();
  };

  // Métricas
  const criticos = shipments.filter(s => s.temp > 7).length;
  const normales = shipments.filter(s => s.temp <= 7).length;
  const promedio = shipments.length > 0 
    ? (shipments.reduce((acc, s) => acc + s.temp, 0) / shipments.length).toFixed(1) 
    : 0;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r flex flex-col p-6 z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
            <Activity size={24} />
          </div>
          <span className="font-bold text-xl hidden lg:block tracking-tighter">VitalTrack</span>
        </div>
        <nav className="flex-1 space-y-3">
          <NavItem icon={<LayoutDashboard size={22} />} label="Dashboard" active />
          <NavItem icon={<Truck size={22} />} label="Envíos" />
          <NavItem icon={<Navigation size={22} />} label="Rutas" />
        </nav>
        <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">AR</div>
                <div className="hidden lg:block font-black">
                    <p className="text-[10px] leading-tight text-slate-900">Dr. Aris</p>
                    <p className="text-[9px] text-slate-400 uppercase">Admin</p>
                </div>
            </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-10 sticky top-0 z-10">
            <div className="relative w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input type="text" placeholder="Buscar registros..." className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-full text-xs font-medium outline-none focus:ring-2 ring-blue-100 transition-all" />
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-2 border border-emerald-100">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> SISTEMA ACTIVO
                </div>
            </div>
        </header>

        <div className="p-10">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Telemetría de Carga</h1>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Gestión de cadena de frío y logística médica</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <MetricCard icon={<AlertCircle size={28}/>} color="bg-red-50 text-red-500" label="Alertas Críticas" value={criticos} />
                <MetricCard icon={<Truck size={28}/>} color="bg-emerald-50 text-emerald-500" label="En Tránsito" value={normales} />
                <MetricCard icon={<Thermometer size={28}/>} color="bg-blue-50 text-blue-500" label="Temp. Promedio" value={`${promedio}°C`} />
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Mapa con Animación */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] border border-slate-100 p-2 shadow-sm h-[400px] relative overflow-hidden group">
                    <div className="w-full h-full bg-slate-900 rounded-[28px] relative overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80" className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" alt="Mapa" />
                        {shipments.map((s, i) => (
                            <div key={s.id} className="absolute" style={{ top: `${25 + (i * 10) % 50}%`, left: `${15 + (i * 15) % 70}%` }}>
                                <div className="relative">
                                    <div className={`absolute -inset-4 rounded-full opacity-20 animate-ping ${s.temp > 7 ? 'bg-red-500' : 'bg-blue-400'}`} />
                                    <MapPin className={`${s.temp > 7 ? 'text-red-500 fill-red-500' : 'text-blue-400 fill-blue-400'}`} size={32} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[32px] text-white shadow-xl">
                        <h3 className="font-bold text-sm mb-2">Optimización</h3>
                        <p className="text-[10px] opacity-80 mb-6">Analizando rutas para reducir tiempos de exposición térmica.</p>
                        <button className="w-full py-3 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Recalcular Ruta</button>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400 mb-6">Estado Global</h3>
                        <ProgressBar label="Eficiencia" value={92} color="bg-blue-600" />
                        <div className="mt-4">
                            <ProgressBar label="Seguridad" value={88} color="bg-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* --- NUEVA BARRA DE CARGA INTEGRADA --- */}
                <div className="col-span-12 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <Plus size={18} className="text-blue-600" /> Nuevo Registro de Envío
                    </h3>
                    <form onSubmit={agregarEnvio} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input 
                            type="text" 
                            placeholder="Insumo (ej. Sueros)" 
                            className="p-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-100"
                            value={nuevoInsumo}
                            onChange={(e) => setNuevoInsumo(e.target.value)}
                        />
                        <input 
                            type="number" 
                            step="0.1"
                            placeholder="Temp (°C)" 
                            className="p-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-100"
                            value={nuevaTemp}
                            onChange={(e) => setNuevaTemp(e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Destino" 
                            className="p-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-100"
                            value={nuevaUbicacion}
                            onChange={(e) => setNuevaUbicacion(e.target.value)}
                        />
                        <button type="submit" className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                            Confirmar Envío
                        </button>
                    </form>
                </div>

                {/* Tabla de Actividad */}
                <div className="col-span-12 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-20">
                    <div className="p-8 border-b bg-slate-50/30">
                        <h3 className="font-black text-lg text-slate-800">Historial de Despachos</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">ID</th>
                                <th className="px-8 py-5">Contenido</th>
                                <th className="px-8 py-5">Destino</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                                <th className="px-8 py-5 text-center">Temp.</th>
                                <th className="px-8 py-5 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[11px] font-bold">
                            {shipments.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6 text-blue-600">#VT-{s.id}</td>
                                    <td className="px-8 py-6 text-slate-700">{s.insumo}</td>
                                    <td className="px-8 py-6 text-slate-400 font-medium">{s.ubicacion}</td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${s.temp > 7 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {s.temp > 7 ? 'CRÍTICO' : 'NOMINAL'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center font-black">{s.temp}°C</td>
                                    <td className="px-8 py-6 text-right">
                                        <button onClick={() => eliminarEnvio(s.id)} className="p-2 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={16}/>
                                        </button>
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

// Componentes Auxiliares
function NavItem({ icon, label, active = false }: any) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
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
            <div className="flex justify-between text-[10px] font-black mb-2 uppercase text-slate-500 tracking-tighter">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}