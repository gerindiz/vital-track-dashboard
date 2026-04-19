import { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Thermometer, Activity } from 'lucide-react';
import { Envio, AlertaTemperatura } from '../../types';
import { TEMP_CRITICA, TEMP_PREVENTIVA, ALERT_STORAGE_KEY } from '../../constants';

interface Props {
  shipments: Envio[];
  onCountChange: (count: number) => void;
}

function loadAlertas(): AlertaTemperatura[] {
  try {
    return JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveAlertas(alertas: AlertaTemperatura[]): void {
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alertas));
}

function elapsedLabel(timestamp: string): string {
  const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins === 1) return 'hace 1 min';
  return `hace ${mins} min`;
}

export default function AlertSystem({ shipments, onCountChange }: Props) {
  const [alertas, setAlertas] = useState<AlertaTemperatura[]>(() => loadAlertas());

  // Tracks the last known temp per envío to detect threshold crossings
  const prevTemps = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (shipments.length === 0) return;

    const nuevas: AlertaTemperatura[] = [];

    shipments.forEach(s => {
      const prev = prevTemps.current.get(s.id);

      if (prev === undefined) {
        // First time seeing this envío — record temp without alerting
        prevTemps.current.set(s.id, s.temp);
        return;
      }

      const wasCritica = prev > TEMP_CRITICA;
      const wasPreventiva = prev > TEMP_PREVENTIVA && prev <= TEMP_CRITICA;

      if (s.temp > TEMP_CRITICA && !wasCritica) {
        nuevas.push({
          id: Date.now() + s.id,
          envioId: s.id,
          temp: s.temp,
          timestamp: new Date().toISOString(),
          duracion: 0,
          tipo: 'CRITICA',
        });
      } else if (s.temp > TEMP_PREVENTIVA && s.temp <= TEMP_CRITICA && !wasPreventiva) {
        nuevas.push({
          id: Date.now() + s.id + 1,
          envioId: s.id,
          temp: s.temp,
          timestamp: new Date().toISOString(),
          duracion: 0,
          tipo: 'PREVENTIVA',
        });
      }

      prevTemps.current.set(s.id, s.temp);
    });

    if (nuevas.length === 0) return;

    setAlertas(prev => {
      const updated = [...nuevas, ...prev].slice(0, 50);
      saveAlertas(updated);
      return updated;
    });
  }, [shipments]);

  useEffect(() => {
    onCountChange(alertas.filter(a => a.tipo === 'CRITICA').length);
  }, [alertas, onCountChange]);

  const handleLimpiar = () => {
    setAlertas([]);
    saveAlertas([]);
  };

  return (
    <div className="col-span-12 lg:col-span-4 bg-white dark:bg-[#1E293B] p-6 sm:p-10 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col transition-colors duration-200">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <Bell size={14} className="text-red-500 animate-bounce" /> Centro de Alertas
        </h3>
        {alertas.length > 0 && (
          <button
            onClick={handleLimpiar}
            className="text-[8px] font-black uppercase text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors tracking-widest"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar flex-1">
        {alertas.length > 0 ? (
          alertas.map(a => (
            <div
              key={a.id}
              className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] ${
                a.tipo === 'CRITICA'
                  ? 'bg-red-50/50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                  : 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {a.tipo === 'CRITICA' ? (
                    <AlertCircle size={10} className="text-red-500" />
                  ) : (
                    <Thermometer size={10} className="text-amber-500" />
                  )}
                  <span
                    className={`text-[9px] font-black uppercase ${
                      a.tipo === 'CRITICA' ? 'text-red-600' : 'text-amber-600'
                    }`}
                  >
                    {a.tipo === 'CRITICA' ? 'Alerta Crítica' : 'Alerta Preventiva'}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-black tabular-nums ${
                    a.tipo === 'CRITICA' ? 'text-red-500' : 'text-amber-500'
                  }`}
                >
                  {a.temp.toFixed(1)}°C
                </span>
              </div>
              <p
                className={`text-[8px] font-bold uppercase tracking-tighter ${
                  a.tipo === 'CRITICA' ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                Unidad #{a.envioId} · {elapsedLabel(a.timestamp)}
              </p>
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
  );
}
