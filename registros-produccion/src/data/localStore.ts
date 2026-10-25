import type { Fields, ListDef, RecordItem } from "../schema";
import type { Store } from "./store";

// Modo demo: guarda en localStorage del navegador. Sirve para probar la app sin SharePoint.
const keyFor = (list: ListDef) => `registros:${list.key}`;

function read(list: ListDef): RecordItem[] {
  try {
    return JSON.parse(localStorage.getItem(keyFor(list)) ?? "[]") as RecordItem[];
  } catch {
    return [];
  }
}

function write(list: ListDef, items: RecordItem[]) {
  localStorage.setItem(keyFor(list), JSON.stringify(items));
}

export const localStore: Store = {
  async list(list) {
    return read(list).sort((a, b) => b.created.localeCompare(a.created));
  },
  async create(list, fields: Fields) {
    const item: RecordItem = { id: crypto.randomUUID(), created: new Date().toISOString(), fields };
    write(list, [...read(list), item]);
    return item;
  },
  async update(list, id, fields) {
    const items = read(list);
    const i = items.findIndex((it) => it.id === id);
    if (i < 0) throw new Error("No se encontró el registro");
    items[i] = { ...items[i], fields: { ...items[i].fields, ...fields } };
    write(list, items);
    return items[i];
  },
};
