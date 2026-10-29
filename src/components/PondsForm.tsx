import { useState } from "react";
import { LISTS, PONDS, nowTime, today, validate } from "../schema";
import { store } from "../data";
import { Icon } from "./Icon";
import { newRecordFields } from "../data/store";

const list = LISTS.ponds;

// Los 12 ponds en una pantalla. Al guardar se crea un registro por cada pond con valor.
export function PondsForm({ nombre }: { nombre: string }) {
  const [fecha, setFecha] = useState(today);
  const [hora, setHora] = useState(nowTime);
  const [cm, setCm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    const filled = PONDS.filter((p) => (cm[p] ?? "").trim() !== "");
    if (filled.length === 0) {
      setMessage({ ok: false, text: "Enter at least one pond" });
      return;
    }
    const records = filled.map((p) => ({
      Fecha: fecha,
      Hora: hora,
      Pond: p,
      ProfundidadCm: Number(cm[p].replace(",", ".")),
    }));
    const invalid = records.find((r) => Object.keys(validate(list, r)).length > 0);
    if (invalid) {
      const err = Object.values(validate(list, invalid))[0];
      setMessage({ ok: false, text: `${invalid.Pond}: ${err}` });
      return;
    }
    setSaving(true);
    try {
      for (const r of records) await store.create(list, newRecordFields(r, nombre));
      setCm({});
      setMessage({ ok: true, text: `${records.length} ${records.length === 1 ? "pond" : "ponds"} saved` });
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
      <div className="row">
        <div className="field">
          <label htmlFor="p-fecha">Date</label>
          <input id="p-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-hora">Time</label>
          <input id="p-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      </div>
      <p className="hint">Available depth in cm. Leave blank any pond you did not measure.</p>
      <div className="ponds">
        {PONDS.map((p) => (
          <label key={p} className="pond">
            <span>{p}</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="cm"
              value={cm[p] ?? ""}
              onChange={(e) => {
                setCm({ ...cm, [p]: e.target.value });
                setMessage(null);
              }}
            />
          </label>
        ))}
      </div>
      {message && <p className={message.ok ? "notice ok" : "notice bad"}>{message.text}</p>}
      <button type="submit" className="primary" disabled={saving}>
        <Icon name="save" />
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
