import type { Fields, ListDef, RecordItem } from "../schema";

// Rango de fechas (YYYY-MM-DD, inclusive). Sin rango, se traen todos los registros.
export interface DateRange {
  from: string;
  to: string;
}

export interface Store {
  // Registros de la lista, los mas recientes primero
  list(list: ListDef, range?: DateRange): Promise<RecordItem[]>;
  create(list: ListDef, fields: Fields): Promise<RecordItem>;
  update(list: ListDef, id: string, fields: Fields): Promise<RecordItem>;
}

// Campos que se agregan al guardar un registro nuevo
export function newRecordFields(fields: Fields, nombre: string): Fields {
  return { ...fields, Title: nombre, Modificado: false, ModificadoPor: null, FechaModificacion: null };
}

// Campos que se agregan al corregir un registro ya guardado
export function editedRecordFields(fields: Fields, editor: string, now = new Date()): Fields {
  return { ...fields, Modificado: true, ModificadoPor: editor, FechaModificacion: now.toISOString() };
}

export function inRange(item: RecordItem, range?: DateRange) {
  if (!range) return true;
  const f = String(item.fields.Fecha ?? "");
  return f >= range.from && f <= range.to;
}
