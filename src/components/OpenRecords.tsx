import { useEffect, useState } from "react";
import {
  closingField,
  elapsedMinutes,
  durationMinutes,
  formatDuration,
  isOpen,
  nowTime,
  type ListDef,
  type RecordItem,
} from "../schema";
import { store } from "../data";
import { closedRecordFields, type Author } from "../data/store";
import { authErrorMessage } from "../auth";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

interface Props {
  list: ListDef;
  author: Author;
  // Registro recien creado en el formulario: si quedo abierto, se agrega a la lista
  added: RecordItem | null;
}

// Irrigaciones en curso (Open), arriba del formulario, cada una con su boton Close
export function OpenRecords({ list, author, added }: Props) {
  const field = closingField(list);
  const [items, setItems] = useState<RecordItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    store
      .list(list)
      .then((all) => alive && setItems(all.filter((it) => isOpen(list, it.fields))))
      .catch((e) => alive && setError(authErrorMessage(e)));
    return () => {
      alive = false;
    };
  }, [list]);

  useEffect(() => {
    if (added && isOpen(list, added.fields)) setItems((prev) => [added, ...(prev ?? []).filter((it) => it.id !== added.id)]);
  }, [added, list]);

  // Actualiza el tiempo que llevan abiertas cada minuto
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  if (!field) return null;
  if (error) return <p className="notice bad">{error}</p>;
  if (items === null) return <p className="hint">Looking for open irrigations…</p>;

  function startClose(it: RecordItem) {
    setClosing(it.id);
    setEndTime(nowTime());
    setDone(null);
    setError(null);
  }

  async function confirm(it: RecordItem) {
    if (!field || !TIME_RE.test(endTime)) return;
    setSaving(true);
    try {
      await store.update(list, it.id, closedRecordFields(field.key, endTime, author));
      setItems((prev) => (prev ?? []).filter((x) => x.id !== it.id));
      const mins = durationMinutes(it.fields.HoraInicio, endTime);
      setDone(`Closed at ${endTime}${mins !== null ? ` · ${formatDuration(mins)}` : ""}`);
      setClosing(null);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="open-records">
      <h2 className="section-title">Open irrigations ({items.length})</h2>
      {done && <p className="notice ok">{done}</p>}
      {items.length === 0 && <p className="hint">No irrigation in progress. Save one below to start it.</p>}
      <ul className="records">
        {items.map((it) => {
          const f = it.fields;
          const mins = elapsedMinutes(f.Fecha, f.HoraInicio);
          return (
            <li key={it.id} className="record">
              <div className="record-main">
                <span className="status open">Open</span>
                <span>
                  <small>Pond</small> {String(f.Pond ?? "")}
                </span>
                <span>
                  <small>Area</small> {String(f.Area ?? "")} · {String(f.Subarea ?? "")}
                </span>
                <span>
                  <small>Started</small> {String(f.Fecha ?? "")} {String(f.HoraInicio ?? "")}
                </span>
                {mins !== null && (
                  <span>
                    <small>Running</small> {formatDuration(mins)}
                  </span>
                )}
              </div>
              <div className="record-meta">Started by {String(f.Title ?? "")}</div>
              {closing === it.id ? (
                <form
                  className="close-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void confirm(it);
                  }}
                >
                  <div className="field">
                    <label htmlFor={`end-${it.id}`}>{field.label}</label>
                    <input id={`end-${it.id}`} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                  <button type="submit" className="primary" disabled={saving || !TIME_RE.test(endTime)}>
                    {saving ? "Closing…" : "Confirm close"}
                  </button>
                  <button type="button" className="link" onClick={() => setClosing(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <button className="secondary close-btn" onClick={() => startClose(it)}>
                  Close
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
