// Definicion de los registros de cada flujo. Las claves (key) son los nombres
// internos de las columnas en SharePoint, los mismos que crea crear-listas.ps1.

export const TURNOS = ["Am", "Day", "Night"];

export const AREAS: Record<string, string[]> = {
  Argyle: ["B1", "B2", "B3", "B4", "B5", "B6"],
  Forestry: ["C1", "C2"],
  "Irrigation Ride": ["D1"],
  "Western Paddocks": ["F1", "F2", "G1", "G2"],
  "Swan Gully South": ["A1", "A2", "A3", "A4", "H1", "I1", "J1"],
  "Swan Gully North": ["H2", "H3", "I2", "J2"],
};

export const PONDS = [
  "Anaerobic Pond 1",
  "Anaerobic Pond 2",
  "Anaerobic Pond 3",
  "Facultative Pond 4",
  "Aeration Pond 5",
  "Cover Anaerobic Lagoon G1",
  "Cover Anaerobic Lagoon G2",
  "Cover Anaerobic Lagoon G3",
  "WWS Pond 10",
  "Lagoon 7",
  "Lagoon 8",
  "Lagoon 9",
];

export const PRODUCTOS = [
  "Poultry Meal (PM)",
  "Mixed Species (MBM)",
  "Tallow (MST)",
  "Poultry Oil (PO)",
  "Feather Meal (FM)",
  "Blood Meal (BM)",
];

export const PITS = ["1", "2", "3", "4", "5", "6", "7", "8"];

// Donde se almacena el producto. Cake Bin y Silo tienen capacidad maxima por producto o silo (t).
export const ALMACENAMIENTO = ["Cake Bin", "Silo", "Bulk Bags", "Container"];

export const CAPACIDAD: Record<string, Record<string, number>> = {
  "Cake Bin": {
    "Poultry Meal (PM)": 10,
    "Mixed Species (MBM)": 80,
    "Feather Meal (FM)": 15,
  },
  Silo: {
    Ingham: 70,
    Feather: 50,
    "Meal 1": 50,
    "Meal 2": 50,
    "MBM 1": 50,
    "MBM 2": 50,
  },
};

// En Cake Bin y Silo solo se eligen los productos o silos con capacidad; en el resto, cualquier producto
const PRODUCTO_POR_ALMACENAMIENTO: Record<string, string[]> = {
  "Cake Bin": Object.keys(CAPACIDAD["Cake Bin"]),
  Silo: Object.keys(CAPACIDAD.Silo),
  "Bulk Bags": PRODUCTOS,
  Container: PRODUCTOS,
};

export function capacityFor(values: Fields): number | undefined {
  const lugar = values.Almacenamiento;
  const item = values.Producto;
  if (typeof lugar !== "string" || typeof item !== "string") return undefined;
  return CAPACIDAD[lugar]?.[item];
}

export type FieldType = "date" | "time" | "number" | "choice";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  // Para una opcion que depende de otra (Subarea depende de Area)
  dependsOn?: {
    key: string;
    options: Record<string, string[]>;
    // Texto del selector mientras no se elige el campo del que depende
    placeholder: string;
    // Etiqueta distinta segun el valor elegido (en Silo se elige el silo, no el producto)
    labels?: Record<string, string>;
  };
  // Valor maximo permitido segun los demas campos (capacidad del Cake Bin o Silo)
  max?: (values: Fields) => number | undefined;
}

export type ListKey = "irrigation" | "river" | "wastewater" | "ponds" | "productionStock" | "stockOnhand" | "pits";

export interface ListDef {
  key: ListKey;
  title: string; // nombre de la lista en SharePoint
  flow: "Water" | "Stock" | "Pits";
  fields: FieldDef[];
}

const fecha: FieldDef = { key: "Fecha", label: "Date", type: "date" };
const hora: FieldDef = { key: "Hora", label: "Time", type: "time" };
const turno: FieldDef = { key: "Turno", label: "Shift", type: "choice", options: TURNOS };

// Production Stock y Stock Onhand se registran con los mismos campos, en listas separadas
const stockFields: FieldDef[] = [
  fecha,
  turno,
  { key: "Almacenamiento", label: "Storage", type: "choice", options: ALMACENAMIENTO },
  {
    key: "Producto",
    label: "Product",
    type: "choice",
    dependsOn: {
      key: "Almacenamiento",
      options: PRODUCTO_POR_ALMACENAMIENTO,
      placeholder: "Select the storage first",
      labels: { Silo: "Silo" },
    },
  },
  { key: "StockTn", label: "Stock (t)", type: "number", max: capacityFor },
];

export const LISTS: Record<ListKey, ListDef> = {
  irrigation: {
    key: "irrigation",
    title: "Irrigation",
    flow: "Water",
    fields: [
      fecha,
      { key: "HoraInicio", label: "Start time", type: "time" },
      { key: "HoraTermino", label: "End time", type: "time" },
      { key: "Area", label: "Area", type: "choice", options: Object.keys(AREAS) },
      {
        key: "Subarea",
        label: "Sub-area",
        type: "choice",
        dependsOn: { key: "Area", options: AREAS, placeholder: "Select an area first" },
      },
      { key: "Ml", label: "Ml", type: "number" },
    ],
  },
  river: {
    key: "river",
    title: "River",
    flow: "Water",
    fields: [fecha, hora, { key: "Ml", label: "River Water (Ml)", type: "number" }],
  },
  wastewater: {
    key: "wastewater",
    title: "Waste Water",
    flow: "Water",
    fields: [fecha, hora, { key: "Ml", label: "Waste Water (Ml)", type: "number" }],
  },
  ponds: {
    key: "ponds",
    title: "Ponds",
    flow: "Water",
    fields: [
      fecha,
      hora,
      { key: "Pond", label: "Pond", type: "choice", options: PONDS },
      { key: "ProfundidadCm", label: "Available depth (cm)", type: "number" },
    ],
  },
  productionStock: { key: "productionStock", title: "Production Stock", flow: "Stock", fields: stockFields },
  stockOnhand: { key: "stockOnhand", title: "Stock Onhand", flow: "Stock", fields: stockFields },
  pits: {
    key: "pits",
    title: "Pits",
    flow: "Pits",
    fields: [
      fecha,
      turno,
      { key: "NumeroPit", label: "Pit number", type: "choice", options: PITS },
      { key: "CantidadTn", label: "Product quantity (t)", type: "number" },
    ],
  },
};

export type FieldValue = string | number | boolean | null;
export type Fields = Record<string, FieldValue>;

// Un registro guardado. Ademas de los campos del flujo lleva los de control:
// Title (Ingresado por), Modificado, ModificadoPor y FechaModificacion.
export interface RecordItem {
  id: string;
  created: string; // ISO, fecha de ingreso
  fields: Fields;
}

export function labelFor(field: FieldDef, values: Fields): string {
  const parent = field.dependsOn ? values[field.dependsOn.key] : undefined;
  return (typeof parent === "string" && field.dependsOn?.labels?.[parent]) || field.label;
}

export function optionsFor(field: FieldDef, values: Fields): string[] {
  if (field.dependsOn) {
    const parent = values[field.dependsOn.key];
    return typeof parent === "string" ? (field.dependsOn.options[parent] ?? []) : [];
  }
  return field.options ?? [];
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Devuelve un mensaje por cada campo con error; un objeto vacio si todo esta bien.
export function validate(list: ListDef, values: Fields): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of list.fields) {
    const v = values[f.key];
    if (v === null || v === undefined || v === "") {
      errors[f.key] = "Required";
      continue;
    }
    if (f.type === "time" && !TIME_RE.test(String(v))) errors[f.key] = "Use the hh:mm format";
    if (f.type === "date" && !DATE_RE.test(String(v))) errors[f.key] = "Enter a valid date";
    if (f.type === "number" && (typeof v !== "number" || !Number.isFinite(v) || v < 0))
      errors[f.key] = "Enter a number of 0 or more";
    if (f.type === "choice" && !optionsFor(f, values).includes(String(v)))
      errors[f.key] = "Select an option from the list";
    const max = f.max?.(values);
    if (!errors[f.key] && max !== undefined && typeof v === "number" && v > max)
      errors[f.key] = `Exceeds the capacity of ${max} t`;
  }
  return errors;
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
