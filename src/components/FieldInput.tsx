import { labelFor, optionsFor, type FieldDef, type Fields } from "../schema";

interface Props {
  field: FieldDef;
  value: string;
  values: Fields;
  error?: string;
  onChange: (value: string) => void;
}

export function FieldInput({ field, value, values, error, onChange }: Props) {
  const id = `f-${field.key}`;
  const max = field.max?.(values);
  const current = values[field.key];
  let input;
  if (field.type === "choice") {
    const options = optionsFor(field, values);
    input = (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={options.length === 0}>
        <option value="">{options.length === 0 ? (field.dependsOn?.placeholder ?? "Select…") : "Select…"}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "number") {
    input = (
      <input id={id} type="text" inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    );
  } else {
    input = <input id={id} type={field.type} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <div className={error ? "field has-error" : "field"}>
      <label htmlFor={id}>{labelFor(field, values)}</label>
      {input}
      {error && <p className="error">{error}</p>}
      {!error && max !== undefined && (
        <p className="hint field-hint">
          Capacity {max} t
          {typeof current === "number" && Number.isFinite(current) && current >= 0 && ` · ${Math.round((current / max) * 100)}% full`}
        </p>
      )}
    </div>
  );
}
