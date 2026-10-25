import type { ListDef, RecordItem } from "../schema";

export interface Sheet {
  list: ListDef;
  items: RecordItem[];
}

// Descarga un .xlsx con una hoja por lista, con las mismas hojas y columnas que
// "Registros Water Stock Pits.xlsx". Las filas modificadas van en amarillo.
export async function exportToExcel(sheets: Sheet[], fileName: string) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  for (const { list, items } of sheets) addSheet(wb.addWorksheet(list.title), list, items);

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

type Worksheet = import("exceljs").Worksheet;

function addSheet(ws: Worksheet, list: ListDef, items: RecordItem[]) {
  ws.columns = [
    ...list.fields.map((f) => ({ header: f.label, key: f.key, width: Math.max(14, f.label.length + 4) })),
    { header: "Entered by", key: "Title", width: 20 },
    { header: "Entered at", key: "_created", width: 20 },
    { header: "Modified", key: "Modificado", width: 12 },
    { header: "Modified by", key: "ModificadoPor", width: 20 },
    { header: "Modified at", key: "FechaModificacion", width: 22 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2C3E50" } };

  for (const item of items) {
    const f = item.fields;
    const row = ws.addRow({
      ...Object.fromEntries(list.fields.map((d) => [d.key, d.type === "date" ? toDate(f[d.key]) : f[d.key]])),
      Title: f.Title,
      _created: new Date(item.created),
      Modificado: f.Modificado ? "Yes" : "No",
      ModificadoPor: f.ModificadoPor,
      FechaModificacion: typeof f.FechaModificacion === "string" ? new Date(f.FechaModificacion) : null,
    });
    if (f.Modificado) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
  }

  for (const d of list.fields) if (d.type === "date") ws.getColumn(d.key).numFmt = "dd-mm-yyyy";
  ws.getColumn("_created").numFmt = "dd-mm-yyyy hh:mm";
  ws.getColumn("FechaModificacion").numFmt = "dd-mm-yyyy hh:mm";
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

// YYYY-MM-DD a fecha de Excel sin corrimiento por zona horaria
function toDate(v: unknown) {
  if (typeof v !== "string") return null;
  const [y, m, d] = v.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
