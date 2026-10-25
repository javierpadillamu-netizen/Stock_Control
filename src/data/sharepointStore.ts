import type { Fields, ListDef, RecordItem } from "../schema";
import { config } from "../config";
import { getToken } from "./auth";
import type { Store } from "./store";

// Lee y escribe las listas de SharePoint con Microsoft Graph.
const GRAPH = "https://graph.microsoft.com/v1.0";

async function graph<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(path.startsWith("http") ? path : GRAPH + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SharePoint respondió ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

let siteId: Promise<string> | null = null;
const listIds = new Map<string, Promise<string>>();

function getSiteId() {
  siteId ??= graph<{ id: string }>(`/sites/${config.sharepointSite}`).then((s) => s.id);
  return siteId;
}

function getListId(list: ListDef) {
  if (!listIds.has(list.title)) {
    listIds.set(
      list.title,
      getSiteId().then(async (site) => {
        const res = await graph<{ value: { id: string; displayName: string }[] }>(`/sites/${site}/lists?$select=id,displayName`);
        const found = res.value.find((l) => l.displayName === list.title);
        if (!found) throw new Error(`No existe la lista "${list.title}" en el sitio`);
        return found.id;
      }),
    );
  }
  return listIds.get(list.title)!;
}

// Fecha (YYYY-MM-DD) a SharePoint: mediodia UTC, para que el dia no cambie por la zona horaria.
function toSharePoint(list: ListDef, fields: Fields): Fields {
  const out: Fields = { ...fields };
  for (const f of list.fields) {
    if (f.type === "date" && typeof out[f.key] === "string") out[f.key] = `${out[f.key]}T12:00:00Z`;
  }
  return out;
}

function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface GraphItem {
  id: string;
  createdDateTime: string;
  fields: Fields;
}

function fromSharePoint(list: ListDef, item: GraphItem): RecordItem {
  const fields: Fields = {};
  for (const key of ["Title", "Modificado", "ModificadoPor", "FechaModificacion", ...list.fields.map((f) => f.key)]) {
    fields[key] = item.fields[key] ?? null;
  }
  for (const f of list.fields) {
    if (f.type === "date" && typeof fields[f.key] === "string") fields[f.key] = localDate(fields[f.key] as string);
  }
  fields.Modificado = fields.Modificado === true;
  return { id: item.id, created: item.createdDateTime, fields };
}

export const sharepointStore: Store = {
  async list(list) {
    const site = await getSiteId();
    const listId = await getListId(list);
    const items: RecordItem[] = [];
    let url: string | undefined = `/sites/${site}/lists/${listId}/items?$expand=fields&$top=999`;
    while (url) {
      const page: { value: GraphItem[]; "@odata.nextLink"?: string } = await graph(url);
      items.push(...page.value.map((it) => fromSharePoint(list, it)));
      url = page["@odata.nextLink"];
    }
    return items.sort((a, b) => b.created.localeCompare(a.created));
  },
  async create(list, fields) {
    const site = await getSiteId();
    const listId = await getListId(list);
    const item = await graph<GraphItem>(`/sites/${site}/lists/${listId}/items`, {
      method: "POST",
      body: JSON.stringify({ fields: toSharePoint(list, fields) }),
    });
    return fromSharePoint(list, item);
  },
  async update(list, id, fields) {
    const site = await getSiteId();
    const listId = await getListId(list);
    await graph(`/sites/${site}/lists/${listId}/items/${id}/fields`, {
      method: "PATCH",
      body: JSON.stringify(toSharePoint(list, fields)),
    });
    const item = await graph<GraphItem>(`/sites/${site}/lists/${listId}/items/${id}?$expand=fields`);
    return fromSharePoint(list, item);
  },
};
