import type { Fields, ListDef, RecordItem } from "../schema";
import { inRange, type Store } from "./store";

// Modo demo: guarda en localStorage del navegador. Sirve para probar la app sin SharePoint.
const keyFor = (list: ListDef) => `registros:${list.key}`;

// Si el navegador no permite localStorage, los datos quedan en memoria mientras la pagina este abierta
const memory = new Map<string, RecordItem[]>();

function read(list: ListDef): RecordItem[] {
  try {
    const raw = localStorage.getItem(keyFor(list));
    if (raw) return JSON.parse(raw) as RecordItem[];
  } catch {
    // se usa la copia en memoria
  }
  return [...(memory.get(keyFor(list)) ?? [])];
}

function write(list: ListDef, items: RecordItem[]) {
  memory.set(keyFor(list), items);
  try {
    localStorage.setItem(keyFor(list), JSON.stringify(items));
  } catch {
    // solo queda en memoria
  }
}

export const localStore: Store = {
  async list(list, range) {
    return read(list)
      .filter((it) => inRange(it, range))
      .sort((a, b) => b.created.localeCompare(a.created));
  },
  async create(list, fields: Fields) {
    const item: RecordItem = { id: crypto.randomUUID(), created: new Date().toISOString(), fields };
    write(list, [...read(list), item]);
    return item;
  },
  async update(list, id, fields) {
    const items = read(list);
    const i = items.findIndex((it) => it.id === id);
    if (i < 0) throw new Error("Record not found");
    items[i] = { ...items[i], fields: { ...items[i].fields, ...fields } };
    write(list, items);
    return items[i];
  },
};
