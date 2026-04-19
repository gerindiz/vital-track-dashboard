export const exportToExcel = async (data: any[]) => {
  if (data.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Reporte");

  worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
  data.forEach(row => worksheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Reporte_VitalTrack.xlsx';
  a.click();
  URL.revokeObjectURL(url);
};
