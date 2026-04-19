import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Thermometer, AlertCircle, Package } from 'lucide-react';
import { Envio, EstadoEnvio, AlertaTemperatura } from '../../types';
import { TEMP_RANGO_MIN, TEMP_RANGO_MAX, ALERT_STORAGE_KEY } from '../../constants';

interface Props {
  shipments: Envio[];
}

const ESTADO_COLORS: Record<string, string> = {
  [EstadoEnvio.EN_RUTA]:    '#3b82f6',
  [EstadoEnvio.CRITICO]:    '#ef4444',
  [EstadoEnvio.ENTREGADO]:  '#10b981',
  [EstadoEnvio.EN_ESPERA]:  '#f59e0b',
};
const FALLBACK_COLOR = '#94a3b8';

function loadAlertas(): AlertaTemperatura[] {
  try {
    return JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export default function KPIPanel({ shipments }: Props) {
  const total = shipments.length;

  const enRango = shipments.filter(
    s => s.temp >= TEMP_RANGO_MIN && s.temp <= TEMP_RANGO_MAX,
  ).length;
  const pctSeguro = total > 0 ? Math.round((enRango / total) * 100) : 0;

  const tempPromedio =
    total > 0
      ? (shipments.reduce((acc, s) => acc + s.temp, 0) / total).toFixed(1)
      : '—';

  const hace24h = Date.now() - 24 * 60 * 60 * 1000;
  const incidentes24h = loadAlertas().filter(
    a => new Date(a.timestamp).getTime() > hace24h,
  ).length;

  const estadoMap = new Map<string, number>();
  shipments.forEach(s => {
    const key = s.estado ?? 'Desconocido';
    estadoMap.set(key, (estadoMap.get(key) ?? 0) + 1);
  });
  const donutData = Array.from(estadoMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: ESTADO_COLORS[name] ?? FALLBACK_COLOR,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[40px] border border-slate-100 dark:border-slate-700 flex items-center gap-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 p-6 rounded-[30px] shadow-inner">
          <ShieldCheck size={28} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            En Rango Seguro
          </p>
          <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{pctSeguro}%</p>
          <p className="text-[9px] text-slate-300 dark:text-slate-500 font-bold uppercase mt-1">
            {TEMP_RANGO_MIN}°C – {TEMP_RANGO_MAX}°C
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[40px] border border-slate-100 dark:border-slate-700 flex items-center gap-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-500 p-6 rounded-[30px] shadow-inner">
          <Thermometer size={28} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Media Térmica
          </p>
          <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{tempPromedio}°C</p>
          <p className="text-[9px] text-slate-300 dark:text-slate-500 font-bold uppercase mt-1">
            {total} unidades activas
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] p-10 rounded-[40px] border border-slate-100 dark:border-slate-700 flex items-center gap-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-500 p-6 rounded-[30px] shadow-inner">
          <AlertCircle size={28} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Incidentes 24hs
          </p>
          <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{incidentes24h}</p>
          <p className="text-[9px] text-slate-300 dark:text-slate-500 font-bold uppercase mt-1">alertas registradas</p>
        </div>
      </div>

      {donutData.length > 0 && (
        <div className="md:col-span-3 bg-white dark:bg-[#1E293B] p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 mb-6">
            <Package size={14} className="text-blue-600" />
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Distribución por Estado
            </h3>
          </div>
          <div className="flex items-center gap-10">
            <div className="h-44 w-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                    formatter={(value: number | undefined) => [`${value ?? 0} unidades`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-4 flex-1">
              {donutData.map((entry, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-black text-slate-700 dark:text-white">{entry.value}</span>
                    <span className="text-[9px] text-slate-300 dark:text-slate-500 font-bold w-8 text-right">
                      {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
