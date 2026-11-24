import { useEffect, useState } from "react";
import {
  closingField,
  closingFields,
  elapsedMinutes,
  durationMinutes,
  formatDuration,
  isOpen,
  nowTime,
  usageOf,
  validate,
  type Fields,
  type ListDef,
  type RecordItem,
} from "../schema";
import { store } from "../data";
import { closedRecordFields, type Author } from "../data/store";
import { authErrorMessage } from "../auth";

interface Props {
  list: ListDef;
  author: Author;
  // Registro recien creado en el formulario: si quedo abierto, se agrega a la lista
  added: RecordItem | null;
  // Avisa el registro cerrado, para que el formulario use su lectura como la anterior
  onClosed?: (item: RecordItem) => void;
}

// Irrigaciones en curso (Open), arriba del formulario, cada una con su boton Close
export function OpenRecords({ list, author, added, onClosed }: Props) {
  const field = closingField(list);
  const toFill = closingFields(list);
  const [items, setItems] = useState<RecordItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  // Valores del paso Close (End time y Current Reading), como texto del formulario
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    // La hora de termino propone la hora actual; la lectura actual se escribe al cerrar
    setDraft(Object.fromEntries(toFill.map((f) => [f.key, f.type === "time" ? nowTime() : ""])));
    setErrors({});
    setDone(null);
    setError(null);
  }

  function closingValues(): Fields {
    const out: Fields = {};
    for (const f of toFill) {
      const raw = (draft[f.key] ?? "").trim();
      out[f.key] = raw === "" ? null : f.type === "number" ? Number(raw.replace(",", ".")) : raw;
    }
    return out;
  }

  async function confirm(it: RecordItem) {
    if (!field) return;
    const values = closingValues();
    const all = validate(list, { ...it.fields, ...values }, { closing: true });
    const errs = Object.fromEntries(Object.entries(all).filter(([k]) => k in values));
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await store.update(list, it.id, closedRecordFields(values, author));
      setItems((prev) => (prev ?? []).filter((x) => x.id !== it.id));
      onClosed?.({ ...it, fields: { ...it.fields, ...closedRecordFields(values, author) } });
      const end = String(values[field.key]);
      const mins = durationMinutes(it.fields.HoraInicio, end);
      const used = list.meter ? usageOf(list, { ...it.fields, ...values }) : null;
      setDone(
        `Closed at ${end}${mins !== null ? ` · ${formatDuration(mins)}` : ""}${used !== null && list.meter ? ` · ${list.meter.usageLabel} ${used}` : ""}`,
      );
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
                  {toFill.map((cf) => {
                    const id = `close-${cf.key}-${it.id}`;
                    const prev = list.meter && cf.key === list.meter.current ? f[list.meter.previous] : null;
                    return (
                      <div key={cf.key} className={errors[cf.key] ? "field has-error" : "field"}>
                        <label htmlFor={id}>{cf.label}</label>
                        <input
                          id={id}
                          type={cf.type === "number" ? "text" : cf.type}
                          inputMode={cf.type === "number" ? "decimal" : undefined}
                          autoComplete="off"
                          value={draft[cf.key] ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, [cf.key]: e.target.value }))}
                        />
                        {errors[cf.key] && <p className="error">{errors[cf.key]}</p>}
                        {!errors[cf.key] && typeof prev === "number" && <p className="hint field-hint">Previous reading: {prev}</p>}
                      </div>
                    );
                  })}
                  <button type="submit" className="primary" disabled={saving}>
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
