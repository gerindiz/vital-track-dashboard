import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[]) => {
  // 1. Mapeo exacto según tu captura de Supabase
  const worksheetData = data.map((s) => ({
    "ID": s.id,
    "Insumo Médico": s.insumo,
    "Estado de Envío": s.estado,       // <--- Agregado según tu imagen
    "Temperatura": `${s.temp}°C`,
    "Ubicación / Destino": s.ubicacion,
    "Fecha de Reporte": new Date().toLocaleString('es-AR'), // Fecha actual de descarga
  }));

  // 2. Creamos la hoja
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // 3. Ajuste de diseño (ancho de columnas)
  worksheet['!cols'] = [
    { wch: 8 },  // ID
    { wch: 20 }, // Insumo
    { wch: 15 }, // Estado
    { wch: 12 }, // Temp
    { wch: 25 }, // Ubicación
    { wch: 20 }, // Fecha
  ];

  // 4. Generación del libro
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Logística VitalTrack");

  // Descarga automática
  XLSX.writeFile(workbook, `Reporte_VitalTrack_Supabase.xlsx`);
};