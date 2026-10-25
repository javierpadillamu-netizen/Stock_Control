import { optionsFor, type FieldDef, type Fields } from "../schema";

interface Props {
  field: FieldDef;
  value: string;
  values: Fields;
  error?: string;
  onChange: (value: string) => void;
}

export function FieldInput({ field, value, values, error, onChange }: Props) {
  const id = `f-${field.key}`;
  let input;
  if (field.type === "choice") {
    const options = optionsFor(field, values);
    input = (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={options.length === 0}>
        <option value="">{options.length === 0 ? "Select an area first" : "Select…"}</option>
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
      <label htmlFor={id}>{field.label}</label>
      {input}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
