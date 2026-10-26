import { useCallback, useEffect, useRef, useState } from "react";
import { LISTS, labelFor, today, type ListDef, type RecordItem } from "../schema";
import { store } from "../data";
import { exportToExcel } from "../data/exportExcel";
import { RecordForm } from "./RecordForm";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}

export function History({ list, nombre }: { list: ListDef; nombre: string }) {
  const [from, setFrom] = useState(() => daysAgo(6));
  const [to, setTo] = useState(today);
  const [items, setItems] = useState<RecordItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RecordItem | null>(null);

  const [exporting, setExporting] = useState(false);

  // Cada carga lleva un numero; si el usuario cambia de lista o de fechas antes de que
  // llegue la respuesta, la respuesta vieja se descarta.
  const loadId = useRef(0);
  const load = useCallback(async () => {
    const id = ++loadId.current;
    setError(null);
    try {
      const result = await store.list(list, { from, to });
      if (id === loadId.current) setItems(result);
    } catch (e) {
      if (id === loadId.current) setError(e instanceof Error ? e.message : "Could not load records. Check your connection and try again.");
    }
  }, [list, from, to]);

  // Todas las listas en un solo archivo, con el formato de "Registros Water Stock Pits"
  async function exportAll() {
    setExporting(true);
    setError(null);
    try {
      const lists = Object.values(LISTS);
      const sheets = await Promise.all(lists.map(async (l) => ({ list: l, items: await store.list(l, { from, to }) })));
      await exportToExcel(sheets, `Production Records ${from} to ${to}.xlsx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not export");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    setItems(null);
    setEditing(null);
    void load();
  }, [load]);

  const shown = items ?? [];

  if (editing) {
    return (
      <div>
        <p className="hint">
          Editing a record entered by {String(editing.fields.Title ?? "")}. When you save, it will be marked as modified by {nombre}.
        </p>
        <RecordForm
          list={list}
          nombre={nombre}
          editing={editing}
          onSaved={(item) => {
            setItems((prev) => (prev ?? []).map((it) => (it.id === item.id ? item : it)));
            setEditing(null);
          }}
        />
        <button className="link" onClick={() => setEditing(null)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="row">
        <div className="field">
          <label htmlFor="h-from">From</label>
          <input id="h-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="h-to">To</label>
          <input id="h-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <button
        className="secondary"
        disabled={shown.length === 0}
        onClick={() => void exportToExcel([{ list, items: shown }], `${list.title} ${from} to ${to}.xlsx`)}
      >
        Export {list.title} to Excel ({shown.length})
      </button>
      <button className="secondary" disabled={exporting} onClick={() => void exportAll()}>
        {exporting ? "Preparing…" : "Export all records to Excel"}
      </button>
      {error && <p className="notice bad">{error}</p>}
      {items === null && !error && <p className="hint">Loading…</p>}
      {items !== null && shown.length === 0 && <p className="hint">No records for these dates.</p>}
      <ul className="records">
        {shown.map((it) => (
          <li key={it.id} className={it.fields.Modificado ? "record modified" : "record"}>
            <div className="record-main">
              {list.fields.map((f) => (
                <span key={f.key}>
                  <small>{labelFor(f, it.fields)}</small> {String(it.fields[f.key] ?? "")}
                </span>
              ))}
            </div>
            <div className="record-meta">
              Entered by {String(it.fields.Title ?? "")} · {formatDate(it.created)}
              {it.fields.Modificado && (
                <span className="badge">
                  Modified by {String(it.fields.ModificadoPor ?? "")}
                  {typeof it.fields.FechaModificacion === "string" && ` · ${formatDate(it.fields.FechaModificacion)}`}
                </span>
              )}
            </div>
            <button className="link" onClick={() => setEditing(it)}>
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
