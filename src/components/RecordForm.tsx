import { useEffect, useState } from "react";
import { lastReading, nowTime, today, validate, type Fields, type ListDef, type RecordItem } from "../schema";
import { store } from "../data";
import { Icon } from "./Icon";
import { editedRecordFields, newRecordFields, type Author } from "../data/store";
import { draftFrom, draftToFields, emptyDraft } from "../form";
import { FieldInput } from "./FieldInput";
import { authErrorMessage } from "../auth";

interface Props {
  list: ListDef;
  author: Author;
  // Si viene un registro, el formulario lo edita y lo marca como modificado
  editing?: RecordItem;
  onSaved: (item: RecordItem) => void;
}

export function RecordForm({ list, author, editing, onSaved }: Props) {
  const [draft, setDraft] = useState(() => (editing ? draftFrom(list, editing.fields) : emptyDraft(list)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Fecha y hora automaticas: al registrar no se muestran y toman el momento en que se guarda
  const autoFields = editing ? [] : list.fields.filter((f) => f.auto);
  const visible = list.fields.filter((f) => !autoFields.includes(f));
  const values = draftToFields(list, draft);
  function stamp(fields: Fields): Fields {
    const out = { ...fields };
    for (const f of autoFields) out[f.key] = f.type === "date" ? today() : nowTime();
    return out;
  }
  const meter = list.meter;

  // Registros guardados de la lista, para buscar la ultima lectura del medidor (solo al registrar)
  const [saved, setSaved] = useState<RecordItem[] | null>(null);
  useEffect(() => {
    if (!meter || editing) return;
    let alive = true;
    store
      .list(list)
      .then((items) => {
        if (!alive) return;
        setSaved(items);
        // Si ya se eligio la combinacion antes de que llegaran los registros, completa la anterior
        setDraft((d) => (d[meter.previous] === "" ? { ...d, [meter.previous]: previousFor(draftToFields(list, d), items) } : d));
      })
      .catch(() => alive && setSaved([]));
    return () => {
      alive = false;
    };
  }, [list, meter, editing]);

  const last = meter && !editing && saved ? lastReading(list, saved, values) : null;

  // Lectura anterior propuesta para una combinacion: la ultima lectura actual guardada, o vacio
  function previousFor(fields: Fields, items: RecordItem[] | null) {
    if (!meter || !items) return "";
    const rec = lastReading(list, items, fields);
    return rec ? String(rec.fields[meter.current]) : "";
  }

  function change(key: string, value: string) {
    const next = { ...draft, [key]: value };
    // Al cambiar el valor del que depende otra opcion, se limpia la dependiente
    for (const f of list.fields) if (f.dependsOn?.key === key) next[f.key] = "";
    // Al elegir Pond, Area o Sub-area, la lectura anterior se completa con la ultima guardada
    if (meter && !editing && meter.groupBy.includes(key)) next[meter.previous] = previousFor(draftToFields(list, next), saved);
    setDraft(next);
    setMessage(null);
  }

  async function save() {
    const toSave = stamp(values);
    const errs = validate(list, toSave);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setMessage({ ok: false, text: "Check the highlighted fields" });
      return;
    }
    setSaving(true);
    try {
      const item = editing
        ? await store.update(list, editing.id, editedRecordFields(toSave, author))
        : await store.create(list, newRecordFields(toSave, author));
      const when = autoFields.length > 0 ? ` on ${String(toSave.Fecha)} at ${String(toSave.Hora)}` : "";
      setMessage({ ok: true, text: editing ? "Changes saved. The record is now marked as modified." : `Record saved${when}` });
      if (!editing) {
        // Mantiene fecha y opciones; limpia los numeros para el siguiente registro
        const next = { ...draft };
        for (const f of list.fields) if (f.type === "number" || f.type === "text") next[f.key] = "";
        // La lectura recien guardada pasa a ser la anterior del siguiente registro
        if (meter) {
          const items = [item, ...(saved ?? [])];
          setSaved(items);
          next[meter.previous] = previousFor(draftToFields(list, next), items);
        }
        setDraft(next);
      }
      onSaved(item);
    } catch (e) {
      setMessage({ ok: false, text: authErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  function previousHint() {
    if (!meter) return undefined;
    if (meter.groupBy.some((k) => !values[k])) return undefined;
    if (saved === null) return "Looking for the last reading…";
    if (!last) return "No previous reading for this combination";
    return `Last reading: ${String(last.fields[meter.current])} on ${String(last.fields.Fecha ?? "")} (you can change it)`;
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      {autoFields.length > 0 && (
        <p className="notice auto">
          <Icon name="history" />
          Date and time are recorded automatically when you save.
        </p>
      )}
      {visible.map((f) => (
        <FieldInput
          key={f.key}
          field={f}
          value={draft[f.key]}
          values={values}
          error={errors[f.key]}
          hint={meter && !editing && f.key === meter.previous ? previousHint() : undefined}
          onChange={(v) => change(f.key, v)}
        />
      ))}
      {message && <p className={message.ok ? "notice ok" : "notice bad"}>{message.text}</p>}
      <button type="submit" className="primary" disabled={saving}>
        <Icon name="save" />
        {saving ? "Saving…" : editing ? "Save changes" : "Save"}
      </button>
    </form>
  );
}
