import { useCallback, useEffect, useState } from "react";
import { today, type ListDef, type RecordItem } from "../schema";
import { store } from "../data";
import { exportToExcel } from "../data/exportExcel";
import { RecordForm } from "./RecordForm";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
}

export function History({ list, nombre }: { list: ListDef; nombre: string }) {
  const [from, setFrom] = useState(() => daysAgo(6));
  const [to, setTo] = useState(today);
  const [items, setItems] = useState<RecordItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RecordItem | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await store.list(list));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los registros");
    }
  }, [list]);

  useEffect(() => {
    setItems(null);
    setEditing(null);
    void load();
  }, [load]);

  const shown = (items ?? []).filter((it) => {
    const f = String(it.fields.Fecha ?? "");
    return f >= from && f <= to;
  });

  if (editing) {
    return (
      <div>
        <p className="hint">
          Editando un registro de {String(editing.fields.Title ?? "")}. Al guardar quedará marcado como modificado por {nombre}.
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
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="row">
        <div className="field">
          <label htmlFor="h-from">Desde</label>
          <input id="h-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="h-to">Hasta</label>
          <input id="h-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <button
        className="secondary"
        disabled={shown.length === 0}
        onClick={() => void exportToExcel(list, shown, `${list.title} ${from} a ${to}.xlsx`)}
      >
        Exportar a Excel ({shown.length})
      </button>
      {error && <p className="notice bad">{error}</p>}
      {items === null && !error && <p className="hint">Cargando…</p>}
      {items !== null && shown.length === 0 && <p className="hint">No hay registros en estas fechas.</p>}
      <ul className="records">
        {shown.map((it) => (
          <li key={it.id} className={it.fields.Modificado ? "record modified" : "record"}>
            <div className="record-main">
              {list.fields.map((f) => (
                <span key={f.key}>
                  <small>{f.label}</small> {String(it.fields[f.key] ?? "")}
                </span>
              ))}
            </div>
            <div className="record-meta">
              Ingresado por {String(it.fields.Title ?? "")} · {formatDate(it.created)}
              {it.fields.Modificado && (
                <span className="badge">
                  Modificado por {String(it.fields.ModificadoPor ?? "")}
                  {typeof it.fields.FechaModificacion === "string" && ` · ${formatDate(it.fields.FechaModificacion)}`}
                </span>
              )}
            </div>
            <button className="link" onClick={() => setEditing(it)}>
              Editar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
