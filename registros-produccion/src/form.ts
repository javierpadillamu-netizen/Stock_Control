import { nowTime, today, type Fields, type ListDef } from "./schema";

export type Draft = Record<string, string>;

// Valores iniciales de un formulario nuevo: fecha y hora actuales
export function emptyDraft(list: ListDef): Draft {
  const d: Draft = {};
  for (const f of list.fields) d[f.key] = f.type === "date" ? today() : f.type === "time" ? nowTime() : "";
  return d;
}

export function draftFrom(list: ListDef, fields: Fields): Draft {
  const d: Draft = {};
  for (const f of list.fields) d[f.key] = fields[f.key] === null || fields[f.key] === undefined ? "" : String(fields[f.key]);
  return d;
}

// Convierte el texto del formulario a valores: numeros con coma o punto decimal
export function draftToFields(list: ListDef, draft: Draft): Fields {
  const out: Fields = {};
  for (const f of list.fields) {
    const raw = (draft[f.key] ?? "").trim();
    if (raw === "") out[f.key] = null;
    else if (f.type === "number") out[f.key] = Number(raw.replace(",", "."));
    else out[f.key] = raw;
  }
  return out;
}
