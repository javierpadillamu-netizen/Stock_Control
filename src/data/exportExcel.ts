import type { ListDef, RecordItem } from "../schema";

// Descarga un .xlsx con los registros. Las filas modificadas van en amarillo.
export async function exportToExcel(list: ListDef, items: RecordItem[], fileName: string) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(list.title);

  ws.columns = [
    ...list.fields.map((f) => ({ header: f.label, key: f.key, width: Math.max(14, f.label.length + 4) })),
    { header: "Ingresado por", key: "Title", width: 20 },
    { header: "Fecha de ingreso", key: "_created", width: 20 },
    { header: "Modificado", key: "Modificado", width: 12 },
    { header: "Modificado por", key: "ModificadoPor", width: 20 },
    { header: "Fecha de modificación", key: "FechaModificacion", width: 22 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };

  for (const item of items) {
    const f = item.fields;
    const row = ws.addRow({
      ...Object.fromEntries(list.fields.map((d) => [d.key, d.type === "date" ? toDate(f[d.key]) : f[d.key]])),
      Title: f.Title,
      _created: new Date(item.created),
      Modificado: f.Modificado ? "Sí" : "No",
      ModificadoPor: f.ModificadoPor,
      FechaModificacion: typeof f.FechaModificacion === "string" ? new Date(f.FechaModificacion) : null,
    });
    if (f.Modificado) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
  }

  for (const d of list.fields) if (d.type === "date") ws.getColumn(d.key).numFmt = "dd-mm-yyyy";
  ws.getColumn("_created").numFmt = "dd-mm-yyyy hh:mm";
  ws.getColumn("FechaModificacion").numFmt = "dd-mm-yyyy hh:mm";
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// YYYY-MM-DD a fecha de Excel sin corrimiento por zona horaria
function toDate(v: unknown) {
  if (typeof v !== "string") return null;
  const [y, m, d] = v.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
