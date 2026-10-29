import { useState } from "react";
import { validate, type ListDef, type RecordItem } from "../schema";
import { store } from "../data";
import { Icon } from "./Icon";
import { editedRecordFields, newRecordFields } from "../data/store";
import { draftFrom, draftToFields, emptyDraft } from "../form";
import { FieldInput } from "./FieldInput";

interface Props {
  list: ListDef;
  nombre: string;
  // Si viene un registro, el formulario lo edita y lo marca como modificado
  editing?: RecordItem;
  onSaved: (item: RecordItem) => void;
}

export function RecordForm({ list, nombre, editing, onSaved }: Props) {
  const [draft, setDraft] = useState(() => (editing ? draftFrom(list, editing.fields) : emptyDraft(list)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const values = draftToFields(list, draft);

  function change(key: string, value: string) {
    const next = { ...draft, [key]: value };
    // Al cambiar el valor del que depende otra opcion, se limpia la dependiente
    for (const f of list.fields) if (f.dependsOn?.key === key) next[f.key] = "";
    setDraft(next);
    setMessage(null);
  }

  async function save() {
    const errs = validate(list, values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setMessage({ ok: false, text: "Check the highlighted fields" });
      return;
    }
    setSaving(true);
    try {
      const item = editing
        ? await store.update(list, editing.id, editedRecordFields(values, nombre))
        : await store.create(list, newRecordFields(values, nombre));
      setMessage({ ok: true, text: editing ? "Changes saved. The record is now marked as modified." : "Record saved" });
      if (!editing) {
        // Mantiene fecha y opciones; limpia los numeros para el siguiente registro
        const next = { ...draft };
        for (const f of list.fields) if (f.type === "number") next[f.key] = "";
        setDraft(next);
      }
      onSaved(item);
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not save. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      {list.fields.map((f) => (
        <FieldInput key={f.key} field={f} value={draft[f.key]} values={values} error={errors[f.key]} onChange={(v) => change(f.key, v)} />
      ))}
      {message && <p className={message.ok ? "notice ok" : "notice bad"}>{message.text}</p>}
      <button type="submit" className="primary" disabled={saving}>
        <Icon name="save" />
        {saving ? "Saving…" : editing ? "Save changes" : "Save"}
      </button>
    </form>
  );
}
