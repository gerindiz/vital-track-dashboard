import { FileSpreadsheet, FileText } from 'lucide-react';
import { Envio, AlertaTemperatura } from '../../types';
import { ALERT_STORAGE_KEY } from '../../constants';

interface Props {
  shipments: Envio[];
}

function getAlertas(): AlertaTemperatura[] {
  try {
    return JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function exportToCSV(shipments: Envio[]): void {
  if (shipments.length === 0) return;

  const headers = ['ID', 'Insumo', 'Temperatura (°C)', 'Ubicación', 'Estado', 'Lat', 'Long'];
  const rows = shipments.map(s => [
    `VT-${s.id}`,
    `"${s.insumo}"`,
    s.temp.toFixed(1),
    `"${s.ubicacion}"`,
    `"${s.estado ?? ''}"`,
    s.lat ?? '',
    s.long ?? '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VitalTrack_Envios_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function generateFleetPDF(shipments: Envio[]): Promise<void> {
  if (shipments.length === 0) return;

  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();
  const now = new Date().toLocaleString('es-AR');
  const criticos = shipments.filter(s => s.temp > 8).length;
  const enRango = shipments.filter(s => s.temp >= 2 && s.temp <= 8).length;
  const promedio = (shipments.reduce((acc, s) => acc + s.temp, 0) / shipments.length).toFixed(1);

  doc.setFillColor('#0F172A');
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('VITALTRACK', 14, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Monitor de Flota Crítica — Cadena de Frío', 14, 22);
  doc.text(`Generado: ${now}`, 14, 29);

  doc.setTextColor('#1E293B');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN OPERATIVO', 14, 48);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de unidades: ${shipments.length}`, 14, 56);
  doc.text(`En rango seguro (2°C – 8°C): ${enRango}`, 14, 63);
  doc.text(`Unidades críticas (>8°C): ${criticos}`, 14, 70);
  doc.text(`Temperatura promedio: ${promedio}°C`, 14, 77);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE UNIDADES', 14, 90);

  autoTable(doc, {
    startY: 95,
    head: [['ID', 'Insumo', 'Temp.', 'Ubicación', 'Estado']],
    body: shipments.map(s => [
      `#VT-${s.id}`,
      s.insumo,
      `${s.temp.toFixed(1)}°C`,
      s.ubicacion,
      s.estado ?? '—',
    ]),
    headStyles: { fillColor: '#0F172A', textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: '#F8FAFC' },
    columnStyles: { 2: { halign: 'center' }, 4: { halign: 'center' } },
  });

  doc.save(`VitalTrack_Flota_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateEnvioPDF(envio: Envio): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();
  const now = new Date().toLocaleString('es-AR');
  const esCritico = envio.temp > 8;

  doc.setFillColor('#0F172A');
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('VITALTRACK', 14, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reporte de Telemetría — Unidad #VT-${envio.id}`, 14, 22);
  doc.text(`Generado: ${now}`, 14, 29);

  doc.setFillColor(esCritico ? '#EF4444' : '#10B981');
  doc.rect(14, 42, 45, 9, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(esCritico ? 'ESTADO: CRITICO' : 'ESTADO: ESTABLE', 16, 48.5);

  doc.setTextColor('#1E293B');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL INSUMO', 14, 63);

  autoTable(doc, {
    startY: 68,
    body: [
      ['Insumo médico', envio.insumo],
      ['Temperatura actual', `${envio.temp.toFixed(1)}°C`],
      ['Ubicación', envio.ubicacion],
      ['Estado operativo', envio.estado ?? '—'],
      ['Lat / Long GPS', `${envio.lat ?? '—'} / ${envio.long ?? '—'}`],
    ],
    headStyles: { fillColor: '#0F172A' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: '#F8FAFC' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
  });

  const docAny = doc as unknown as { lastAutoTable: { finalY: number } };
  const finalY = docAny.lastAutoTable?.finalY ?? 135;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#1E293B');
  doc.text('HISTORIAL DE ALERTAS', 14, finalY + 15);

  const alertas = getAlertas().filter(a => a.envioId === envio.id);

  if (alertas.length > 0) {
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Tipo', 'Temperatura', 'Fecha y hora']],
      body: alertas.map(a => [
        a.tipo,
        `${a.temp.toFixed(1)}°C`,
        new Date(a.timestamp).toLocaleString('es-AR'),
      ]),
      headStyles: { fillColor: '#0F172A', textColor: '#FFFFFF', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#94A3B8');
    doc.text('Sin alertas registradas para esta unidad.', 14, finalY + 28);
  }

  doc.save(`VitalTrack_VT${envio.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function ReportGenerator({ shipments }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => exportToCSV(shipments)}
        disabled={shipments.length === 0}
        className="px-5 py-3.5 bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FileSpreadsheet size={16} className="text-emerald-500" /> CSV
      </button>
      <button
        onClick={() => generateFleetPDF(shipments)}
        disabled={shipments.length === 0}
        className="px-5 py-3.5 bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FileText size={16} className="text-blue-500" /> PDF
      </button>
    </div>
  );
}
