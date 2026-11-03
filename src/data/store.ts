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

// Cuenta que registra o corrige: su nombre queda a la vista y su uid identifica la cuenta
export interface Author {
  uid: string;
  name: string;
}

// Campos que se agregan al guardar un registro nuevo
export function newRecordFields(fields: Fields, by: Author): Fields {
  return { ...fields, Title: by.name, createdBy: by.uid, Modificado: false, ModificadoPor: null, modifiedBy: null, FechaModificacion: null };
}

// Campos que se agregan al corregir un registro ya guardado
export function editedRecordFields(fields: Fields, by: Author, now = new Date()): Fields {
  return { ...fields, Modificado: true, ModificadoPor: by.name, modifiedBy: by.uid, FechaModificacion: now.toISOString() };
}

export function inRange(item: RecordItem, range?: DateRange) {
  if (!range) return true;
  const f = String(item.fields.Fecha ?? "");
  return f >= range.from && f <= range.to;
}
